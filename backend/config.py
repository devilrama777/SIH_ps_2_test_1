import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = Path(__file__).resolve().parent

if os.getenv("VERCEL") == "1" or os.getenv("VERCEL_ENV"):
    WORK_DIR = Path("/tmp")
    UPLOADS_DIR = WORK_DIR / "uploads"
    OUTPUTS_DIR = WORK_DIR / "outputs"
    REPORTS_DIR = OUTPUTS_DIR / "reports"
    REPORTED_DATA_DIR = WORK_DIR / "reported_data"
    PROCESSED_OUTPUT_DIR = WORK_DIR / "processed_output"
else:
    UPLOADS_DIR = BASE_DIR / "uploads"
    OUTPUTS_DIR = BASE_DIR / "outputs"
    REPORTS_DIR = OUTPUTS_DIR / "reports"
    REPORTED_DATA_DIR = BASE_DIR / "reported_data"
    PROCESSED_OUTPUT_DIR = BASE_DIR / "processed_output"

STATIC_REPORTS_DIR = BASE_DIR / "outputs" / "reports"
PUBLIC_REPORTS_DIR = BASE_DIR / "public" / "reports"

for d in (UPLOADS_DIR, OUTPUTS_DIR, REPORTS_DIR, REPORTED_DATA_DIR, PROCESSED_OUTPUT_DIR):
    try:
        d.mkdir(parents=True, exist_ok=True)
    except OSError:
        pass

# Seed pre-generated template reports to /tmp/outputs/reports on Vercel
if STATIC_REPORTS_DIR.exists() and STATIC_REPORTS_DIR != REPORTS_DIR:
    import shutil
    for item in STATIC_REPORTS_DIR.glob("*"):
        dest = REPORTS_DIR / item.name
        if not dest.exists() and item.is_file():
            try:
                shutil.copy2(item, dest)
            except Exception:
                pass

# Ollama & Model configurations
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
LLAMA_MODEL = os.getenv("LLAMA_MODEL", "llama3.1:latest")
GEMMA_MODEL = os.getenv("GEMMA_MODEL", "gemma4:latest")

# Fallback for Gemma
GEMMA_FALLBACK_MODEL = os.getenv("GEMMA_FALLBACK_MODEL", "llama3.1:latest")

# Default Request Timeout for Local LLM (seconds)
LLM_TIMEOUT = int(os.getenv("LLM_TIMEOUT", "300"))
