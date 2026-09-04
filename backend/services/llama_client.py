import json
import logging
from pathlib import Path
from typing import Any, Dict, Optional
import requests
from backend import config

logger = logging.getLogger("llama_client")


class LlamaClient:
    """Client for local Ollama instance running LLaMA 3.1."""

    def __init__(self, base_url: str = config.OLLAMA_BASE_URL, default_model: str = config.LLAMA_MODEL):
        self.base_url = base_url.rstrip("/")
        self.default_model = default_model

    def is_available(self) -> bool:
        """Check if local Ollama server is reachable."""
        try:
            res = requests.get(f"{self.base_url}/api/tags", timeout=5)
            return res.status_code == 200
        except Exception:
            return False

    def list_installed_models(self) -> list:
        """List all models installed locally in Ollama."""
        try:
            res = requests.get(f"{self.base_url}/api/tags", timeout=5)
            if res.status_code == 200:
                data = res.json()
                return [m.get("name") for m in data.get("models", [])]
            return []
        except Exception as e:
            logger.error(f"Error checking models: {e}")
            return []

    def load_system_prompt(self, file_type: str, custom_instruction: Optional[str] = None) -> str:
        """Loads default prompt for PDF/CSV and appends custom instructions if provided."""
        prompt_file = config.PROMPTS_DIR / f"llama_{file_type.lower()}_prompt.txt"
        base_prompt = ""
        if prompt_file.exists():
            base_prompt = prompt_file.read_text(encoding="utf-8")
        else:
            base_prompt = "Analyze the following markdown content thoroughly and provide key structured insights."

        if custom_instruction and custom_instruction.strip():
            base_prompt += f"\n\n### USER PRE-DEFINED COMMAND & INSTRUCTIONS:\n{custom_instruction.strip()}\n"

        return base_prompt

    def analyze_document(
        self,
        markdown_content: str,
        file_type: str,
        custom_command: Optional[str] = None,
        model: Optional[str] = None,
        bypass_media: bool = False
    ) -> Dict[str, Any]:
        """Runs LLaMA 3.1 inference on the converted Markdown content (bypassing visual/audio media to Gemma 4)."""
        target_model = model or self.default_model
        system_prompt = self.load_system_prompt(file_type, custom_command)

        if bypass_media:
            system_prompt += (
                "\n\n### MULTIMODAL DIRECTIVE (STRICT BYPASS TO GEMMA 4):\n"
                "This document contains embedded images, diagrams, video, or audio files. "
                "Do NOT attempt to summarize, hallucinate, describe, or fabricate any visual or audio assets. "
                "All image and audio files are directly isolated and passed to Gemma 4 to add into our publication templates. "
                "Analyze ONLY authentic textual tables, extraction metrics, and arithmetic relationships.\n"
            )

        payload = {
            "model": target_model,
            "prompt": f"Here is the document Markdown content to analyze:\n\n{markdown_content}\n\nPlease perform the analysis according to your directives.",
            "system": system_prompt,
            "stream": False,
            "options": {
                "temperature": 0.2,
                "num_ctx": 32768
            }
        }

        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=config.LLM_TIMEOUT
            )
            response.raise_for_status()
            res_json = response.json()

            analysis_text = res_json.get("response", "")
            return {
                "success": True,
                "model_used": target_model,
                "analysis": analysis_text,
                "total_duration_ms": res_json.get("total_duration", 0) // 1_000_000,
                "prompt_eval_count": res_json.get("prompt_eval_count", 0),
                "eval_count": res_json.get("eval_count", 0)
            }
        except requests.exceptions.RequestException as err:
            logger.error(f"Ollama generation failed: {err}")
            return {
                "success": False,
                "error": f"LLaMA 3.1 inference error: {str(err)}",
                "analysis": ""
            }
