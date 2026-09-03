import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = Path(__file__).resolve().parent

UPLOADS_DIR = BASE_DIR / "uploads"
OUTPUTS_DIR = BASE_DIR / "outputs"
REPORTS_DIR = OUTPUTS_DIR / "reports"
PROMPTS_DIR = BACKEND_DIR / "prompts"
REPORTED_DATA_DIR = BASE_DIR / "reported_data"
PROCESSED_OUTPUT_DIR = BASE_DIR / "processed_output"

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)
PROMPTS_DIR.mkdir(parents=True, exist_ok=True)
REPORTED_DATA_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Ollama & Model configurations
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
LLAMA_MODEL = os.getenv("LLAMA_MODEL", "llama3.1:latest")
GEMMA_MODEL = os.getenv("GEMMA_MODEL", "gemma4:latest")

# Fallback for Gemma
GEMMA_FALLBACK_MODEL = os.getenv("GEMMA_FALLBACK_MODEL", "llama3.1:latest")

# Default Request Timeout for Local LLM (seconds)
LLM_TIMEOUT = int(os.getenv("LLM_TIMEOUT", "300"))
