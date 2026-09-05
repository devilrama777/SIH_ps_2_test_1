import json
import logging
import os
import shutil
import subprocess
import threading
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import requests

from backend import config

logger = logging.getLogger("inference_manager")


class InferenceManager:
    """
    Manages local LLM inference lifecycle.
    Auto-detects active Ollama or llama.cpp servers, auto-launches local daemons if available,
    and provides dual-protocol (Ollama / OpenAI-compatible) abstraction for local LLM calls.
    """

    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(InferenceManager, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self.daemon_process: Optional[subprocess.Popen] = None
        self.active_backend: str = "offline"  # "ollama", "llama.cpp", "openai", "offline"
        self.active_base_url: str = config.OLLAMA_BASE_URL
        self.detected_models: List[str] = []
        self._is_starting: bool = False
        self._init_thread = threading.Thread(target=self.auto_configure_inference, daemon=True)
        self._init_thread.start()

    def probe_server(self, base_url: str, timeout: float = 1.0) -> Tuple[bool, str]:
        """Probes a base URL to detect whether it is Ollama or an OpenAI-compatible llama.cpp server."""
        clean_url = base_url.rstrip("/")
        # 1. Probe Ollama /api/tags
        try:
            r = requests.get(f"{clean_url}/api/tags", timeout=timeout)
            if r.status_code == 200 and "models" in r.json():
                models = [m.get("name") for m in r.json().get("models", [])]
                self.detected_models = models
                return True, "ollama"
        except Exception:
            pass

        # 2. Probe OpenAI /v1/models (llama.cpp / LM Studio)
        try:
            r = requests.get(f"{clean_url}/v1/models", timeout=timeout)
            if r.status_code == 200 and "data" in r.json():
                models = [m.get("id") for m in r.json().get("data", [])]
                self.detected_models = models
                return True, "llama.cpp"
        except Exception:
            pass

        # 3. Probe llama.cpp health endpoint
        try:
            r = requests.get(f"{clean_url}/health", timeout=timeout)
            if r.status_code == 200:
                return True, "llama.cpp"
        except Exception:
            pass

        return False, "offline"

    def auto_configure_inference(self):
        """Scans known local ports and launches daemon if necessary."""
        self._is_starting = True
        candidate_ports = [
            ("http://localhost:11434", "ollama"),
            ("http://localhost:8080", "llama.cpp"),
            ("http://localhost:1234", "openai")
        ]

        # Check configured URL first
        ok, protocol = self.probe_server(self.active_base_url)
        if ok:
            self.active_backend = protocol
            self._is_starting = False
            logger.info(f"Connected to local inference engine at {self.active_base_url} ({protocol})")
            return

        # Check standard candidate ports
        for url, _ in candidate_ports:
            if url == self.active_base_url:
                continue
            ok, protocol = self.probe_server(url)
            if ok:
                self.active_backend = protocol
                self.active_base_url = url
                self._is_starting = False
                logger.info(f"Discovered active local inference engine at {url} ({protocol})")
                return

        # If not running, attempt auto-launching daemon if installed on host
        ollama_bin = shutil.which("ollama") or "/usr/local/bin/ollama" or "/opt/homebrew/bin/ollama"
        if os.path.exists(ollama_bin):
            try:
                logger.info(f"Attempting to auto-start local Ollama daemon via {ollama_bin}...")
                self.daemon_process = subprocess.Popen(
                    [ollama_bin, "serve"],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    start_new_session=True
                )
                # Wait up to 3 seconds for socket initialization
                for _ in range(6):
                    time.sleep(0.5)
                    ok, protocol = self.probe_server("http://localhost:11434")
                    if ok:
                        self.active_backend = "ollama"
                        self.active_base_url = "http://localhost:11434"
                        self._is_starting = False
                        logger.info("Auto-launched local Ollama daemon successfully.")
                        return
            except Exception as e:
                logger.warning(f"Could not auto-start Ollama: {e}")

        self.active_backend = "deterministic_enclave"
        self._is_starting = False

    def get_engine_status(self) -> Dict[str, Any]:
        """Returns comprehensive status of local inference engine for Desktop GUI."""
        is_online = self.active_backend in ["ollama", "llama.cpp", "openai"]
        return {
            "status": "online" if is_online else ("starting" if self._is_starting else "deterministic_mode"),
            "backend": self.active_backend,
            "base_url": self.active_base_url,
            "detected_models": self.detected_models,
            "primary_llama": config.LLAMA_MODEL,
            "primary_gemma": config.GEMMA_MODEL,
            "is_accelerated": is_online,
            "description": (
                f"Local GPU/Metal Inference ({self.active_backend.upper()})"
                if is_online
                else "Deterministic Mathematical & Sovereign Enclave Mode"
            )
        }

    def generate_completion(
        self,
        model: str,
        prompt: str,
        system_prompt: str = "",
        temperature: float = 0.2,
        max_tokens: int = 4096
    ) -> Dict[str, Any]:
        """Dispatches completion request to either Ollama or OpenAI-compatible llama.cpp endpoint."""
        base_url = self.active_base_url.rstrip("/")

        # 1. Ollama Protocol
        if self.active_backend == "ollama":
            payload = {
                "model": model,
                "prompt": prompt,
                "system": system_prompt,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_ctx": 32768
                }
            }
            res = requests.post(f"{base_url}/api/generate", json=payload, timeout=config.LLM_TIMEOUT)
            res.raise_for_status()
            data = res.json()
            return {
                "text": data.get("response", ""),
                "model": model,
                "duration_ms": data.get("total_duration", 0) // 1_000_000,
                "eval_count": data.get("eval_count", 0)
            }

        # 2. OpenAI / llama.cpp Protocol
        elif self.active_backend in ["llama.cpp", "openai"]:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens
            }
            res = requests.post(f"{base_url}/v1/chat/completions", json=payload, timeout=config.LLM_TIMEOUT)
            res.raise_for_status()
            data = res.json()
            choices = data.get("choices", [])
            reply = choices[0].get("message", {}).get("content", "") if choices else ""
            return {
                "text": reply,
                "model": model,
                "duration_ms": 100,
                "eval_count": data.get("usage", {}).get("completion_tokens", 0)
            }

        # 3. Fallback if offline
        raise ConnectionError("No active local inference engine found.")

    def shutdown(self):
        """Cleans up any managed subprocesses upon app termination."""
        if self.daemon_process:
            try:
                self.daemon_process.terminate()
                self.daemon_process.wait(timeout=2)
            except Exception:
                try:
                    self.daemon_process.kill()
                except Exception:
                    pass
            self.daemon_process = None
