from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

app = FastAPI(
    title="SIH Mining Web Application",
    description="Smart India Hackathon (SIH) — Ministry of Coal Web Platform API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ROOT_DIR = Path(__file__).resolve().parent.parent

@app.get("/api/health")
def health():
    return {
        "status": "online",
        "app": "SIH Mining Web Platform",
        "version": "1.0.0",
        "enclave": "Secure Local"
    }

# Serve root SPA
@app.get("/")
def serve_index():
    return FileResponse(ROOT_DIR / "index.html")

# Mount static folders
app.mount("/css", StaticFiles(directory=ROOT_DIR / "css"), name="css")
app.mount("/js", StaticFiles(directory=ROOT_DIR / "js"), name="js")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
