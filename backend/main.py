import json
import shutil
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from pydantic import BaseModel

from backend import config
from backend.services.converter import MarkdownConverter
from backend.services.document_generator import DocumentGenerator
from backend.services.gemma_client import GemmaClient
from backend.services.llama_client import LlamaClient
from backend.services.math_engine import MathEngine
from backend.services.pipeline import DocumentPipeline

app = FastAPI(
    title="Document Intelligence & Reasoning Pipeline API",
    description="Multi-stage document processing backend converting CSV/PDF to Markdown, analyzing via local LLaMA 3.1, verifying mathematics, and synthesizing reports via Gemma.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pipeline_service = DocumentPipeline()
converter_service = MarkdownConverter()
llama_client = LlamaClient()
math_engine = MathEngine()
gemma_client = GemmaClient()
document_generator = DocumentGenerator()


# Pydantic Request Models
class LlamaRequest(BaseModel):
    markdown_content: str
    file_type: str = "pdf"
    custom_command: Optional[str] = None
    model_override: Optional[str] = None


class MathRequest(BaseModel):
    analysis_text: str
    custom_calculations: Optional[List[Dict[str, Any]]] = None


class GemmaRequest(BaseModel):
    llama_analysis: str
    math_audit_markdown: str
    custom_instructions: Optional[str] = None
    model_override: Optional[str] = None


@app.get("/api/health")
def health_check():
    """Checks service health and local Ollama connectivity."""
    ollama_ok = llama_client.is_available()
    installed_models = llama_client.list_installed_models() if ollama_ok else []
    return {
        "status": "healthy",
        "ollama_connected": ollama_ok,
        "ollama_url": config.OLLAMA_BASE_URL,
        "installed_models": installed_models,
        "default_llama_model": config.LLAMA_MODEL,
        "default_gemma_model": config.GEMMA_MODEL
    }


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """Uploads a PDF or CSV file to the backend."""
    ext = Path(file.filename).suffix.lower()
    if ext not in [".pdf", ".csv", ".tsv"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Only PDF and CSV files are allowed."
        )

    file_id = f"{uuid.uuid4().hex[:8]}_{file.filename}"
    save_path = config.UPLOADS_DIR / file_id

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "file_id": file_id,
        "filename": file.filename,
        "file_type": ext.lstrip("."),
        "file_path": str(save_path)
    }


@app.post("/api/convert")
def convert_to_markdown(file_id: str = Form(...)):
    """Converts an uploaded file into structured Markdown."""
    target_path = config.UPLOADS_DIR / file_id
    if not target_path.exists():
        raise HTTPException(status_code=404, detail="Uploaded file not found.")

    try:
        result = converter_service.convert(target_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion error: {str(e)}")


@app.post("/api/process/llama")
def run_llama_analysis(req: LlamaRequest):
    """Runs Stage 1 local LLaMA 3.1 analysis on Markdown content."""
    result = llama_client.analyze_document(
        markdown_content=req.markdown_content,
        file_type=req.file_type,
        custom_command=req.custom_command,
        model=req.model_override
    )
    return result


@app.post("/api/process/math")
def run_math_audit(req: MathRequest):
    """Runs Stage 2 deterministic math calculation engine."""
    result = math_engine.process_math_checks(
        analysis_text=req.analysis_text,
        custom_calculations=req.custom_calculations
    )
    return result


@app.post("/api/process/report")
def run_gemma_report(req: GemmaRequest):
    """Runs Stage 3 Gemma systematic report synthesis."""
    result = gemma_client.generate_systematic_report(
        llama_analysis=req.llama_analysis,
        math_audit_markdown=req.math_audit_markdown,
        custom_instructions=req.custom_instructions,
        model_override=req.model_override
    )
    return result


@app.post("/api/pipeline/run")
async def run_full_pipeline(
    file: UploadFile = File(...),
    custom_llama_command: Optional[str] = Form(None),
    custom_calculations_json: Optional[str] = Form(None),
    custom_report_command: Optional[str] = Form(None),
    llama_model: Optional[str] = Form(None),
    gemma_model: Optional[str] = Form(None)
):
    """Executes the full end-to-end multi-stage pipeline on an uploaded file."""
    # 1. Save uploaded file
    file_id = f"{uuid.uuid4().hex[:8]}_{file.filename}"
    save_path = config.UPLOADS_DIR / file_id
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 2. Parse custom calculations if present
    custom_calcs = None
    if custom_calculations_json:
        try:
            custom_calcs = json.loads(custom_calculations_json)
        except Exception:
            pass

    # 3. Execute Pipeline
    try:
        pipeline_output = pipeline_service.process_file(
            file_path=save_path,
            custom_llama_cmd=custom_llama_command,
            custom_calculations=custom_calcs,
            custom_report_cmd=custom_report_command,
            llama_model_override=llama_model,
            gemma_model_override=gemma_model
        )
        return pipeline_output
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline execution error: {str(e)}")


@app.post("/api/pipeline/stream-run")
async def run_pipeline_stream(
    file: Optional[UploadFile] = File(None),
    raw_csv_text: Optional[str] = Form(None),
    custom_llama_command: Optional[str] = Form(None),
    custom_calculations_json: Optional[str] = Form(None),
    custom_report_command: Optional[str] = Form(None),
    llama_model: Optional[str] = Form(None),
    gemma_model: Optional[str] = Form(None)
):
    """Executes the pipeline yielding live Server-Sent Events (SSE) progress milestones."""
    if not file and not raw_csv_text:
        raise HTTPException(status_code=400, detail="Either a file upload or raw_csv_text must be provided.")

    if file:
        file_id = f"{uuid.uuid4().hex[:8]}_{file.filename}"
        save_path = config.UPLOADS_DIR / file_id
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    else:
        file_id = f"{uuid.uuid4().hex[:8]}_pasted_data.csv"
        save_path = config.UPLOADS_DIR / file_id
        save_path.write_text(raw_csv_text.strip(), encoding="utf-8")

    custom_calcs = None
    if custom_calculations_json:
        try:
            custom_calcs = json.loads(custom_calculations_json)
        except Exception:
            pass

    def event_stream():
        try:
            for event in pipeline_service.process_file_stream(
                file_path=save_path,
                custom_llama_cmd=custom_llama_command,
                custom_calculations=custom_calcs,
                custom_report_cmd=custom_report_command,
                llama_model_override=llama_model,
                gemma_model_override=gemma_model
            ):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as err:
            err_payload = {"stage": "error", "progress": 0, "message": str(err)}
            yield f"data: {json.dumps(err_payload)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.post("/api/pipeline/quick-preview")
async def quick_preview(
    file: Optional[UploadFile] = File(None),
    raw_csv_text: Optional[str] = Form(None)
):
    """Provides instant dataset stats and preview before AI processing completes."""
    import pandas as pd
    import numpy as np
    import io

    df = None
    fname = "Uploaded_Data.csv"
    if file:
        fname = file.filename or fname
        content = await file.read()
        try:
            if fname.endswith((".xlsx", ".xls")):
                df = pd.read_excel(io.BytesIO(content))
            else:
                sep = "\t" if fname.endswith(".tsv") else ","
                df = pd.read_csv(io.BytesIO(content), sep=sep)
        except Exception:
            df = pd.read_csv(io.BytesIO(content), sep=None, engine="python")
    elif raw_csv_text:
        df = pd.read_csv(io.StringIO(raw_csv_text))
    else:
        raise HTTPException(status_code=400, detail="No data provided.")

    clean_preview = []
    for row in df.head(5).to_dict(orient="records"):
        clean_row = {}
        for k, v in row.items():
            if pd.isna(v) or v is None or str(v).lower() in ("nan", "nat", "none"):
                clean_row[str(k)] = "-"
            elif isinstance(v, (float, np.floating)):
                clean_row[str(k)] = str(round(float(v), 2))
            else:
                clean_row[str(k)] = str(v)
        clean_preview.append(clean_row)

    return {
        "filename": fname,
        "rows": int(len(df)),
        "columns": [str(c) for c in df.columns],
        "preview": clean_preview,
        "numeric_summary": {}
    }


@app.get("/api/reports/latest-summary")
@app.get("/api/summary/latest")
def get_latest_summary():
    """Returns the latest summarized executive report text."""
    summary_path = config.PROCESSED_OUTPUT_DIR / "llama_summary.md"
    if summary_path.exists():
        return {"success": True, "summary": summary_path.read_text(encoding="utf-8")}
    return {"success": False, "summary": ""}


@app.get("/api/reports/{job_id}")
def get_report(job_id: str):
    """Retrieves all generated artifacts and reports for a given job."""
    job_dir = config.OUTPUTS_DIR / job_id
    if not job_dir.exists():
        raise HTTPException(status_code=404, detail="Job ID not found.")

    def read_artifact(fname: str) -> Optional[str]:
        p = job_dir / fname
        return p.read_text(encoding="utf-8") if p.exists() else None

    meta_file = job_dir / "metadata.json"
    metadata = json.loads(meta_file.read_text(encoding="utf-8")) if meta_file.exists() else {}

    return {
        "job_id": job_id,
        "metadata": metadata,
        "raw_markdown": read_artifact("01_raw_converted.md"),
        "llama_analysis": read_artifact("02_llama_analysis.md"),
        "math_audit": json.loads(read_artifact("03_math_audit.json") or "{}"),
        "final_report": read_artifact("04_final_systematic_report.md")
    }


@app.get("/api/reports/{job_id}/download")
def download_final_report(job_id: str):
    """Downloads the final systematic Markdown report file."""
    report_path = config.OUTPUTS_DIR / job_id / "04_final_systematic_report.md"
    if not report_path.exists():
        raise HTTPException(status_code=404, detail="Final report not found.")
    return FileResponse(
        path=report_path,
        filename=f"Report_{job_id}.md",
        media_type="text/markdown"
    )


@app.get("/api/reports/latest-summary")
def get_latest_summary():
    """Returns the latest LLaMA 3.1 summary and converted Markdown."""
    summary_path = config.PROCESSED_OUTPUT_DIR / "llama_summary.md"
    md_path = config.PROCESSED_OUTPUT_DIR / "converted_data.md"
    
    return {
        "summary": summary_path.read_text(encoding="utf-8") if summary_path.exists() else None,
        "markdown": md_path.read_text(encoding="utf-8") if md_path.exists() else None,
        "files": [f.name for f in config.REPORTED_DATA_DIR.glob("*.csv")]
    }


@app.get("/api/reports/download-summary")
def download_summary():
    summary_path = config.PROCESSED_OUTPUT_DIR / "llama_summary.md"
    if not summary_path.exists():
        raise HTTPException(status_code=404, detail="Summary not found.")
    return FileResponse(path=summary_path, filename="LLaMA_Coal_Summary.md", media_type="text/markdown")


class ReportPackageRequest(BaseModel):
    template: str = "monthly_production"
    report_id: str = "REP-2026-B56D"
    custom_summary: Optional[str] = None


@app.post("/api/reports/generate-package")
def generate_report_package(req: Optional[ReportPackageRequest] = None):
    """Compiles actual publication-grade PDF, DOCX, and XLSX reports."""
    tpl = req.template if req else "monthly_production"
    rep_id = req.report_id if req else "REP-2026-B56D"
    summary_text = None
    if req and req.custom_summary:
        summary_text = req.custom_summary
    else:
        summary_path = config.PROCESSED_OUTPUT_DIR / "llama_summary.md"
        if summary_path.exists():
            summary_text = summary_path.read_text(encoding="utf-8")

    result = document_generator.generate_all_packages(
        template_name=tpl,
        report_id=rep_id,
        summary_text=summary_text
    )
    return result


@app.get("/api/reports/download/{fmt}")
def download_report_format(fmt: str):
    """Downloads the generated report in the requested format (pdf, docx, xlsx)."""
    fmt = fmt.lower().lstrip(".")
    mapping = {
        "pdf": ("Ministry_of_Coal_Report_2026.pdf", "application/pdf"),
        "docx": ("Ministry_of_Coal_Report_2026.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        "xlsx": ("Ministry_of_Coal_Report_2026.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
    }
    if fmt not in mapping:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {fmt}. Choose from pdf, docx, xlsx.")

    fname, media_type = mapping[fmt]
    file_path = config.REPORTS_DIR / fname

    # If it doesn't exist yet, generate it now
    if not file_path.exists():
        document_generator.generate_all_packages()

    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Report file {fname} not found.")

    return FileResponse(path=file_path, filename=fname, media_type=media_type)


@app.post("/api/pipeline/run-dataset-audit")
def run_dataset_audit():
    """Converts reported_data CSVs and triggers local LLaMA 3.1 analysis."""
    import sys
    from run_user_task import run as run_task
    try:
        run_task()
        summary_path = config.PROCESSED_OUTPUT_DIR / "llama_summary.md"
        return {
            "success": True,
            "message": "Dataset audit and LLaMA 3.1 summarization complete.",
            "summary": summary_path.read_text(encoding="utf-8") if summary_path.exists() else ""
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audit execution error: {str(e)}")








# Mount static directory for frontend UI
static_dir = Path(__file__).resolve().parent / "static"
if static_dir.exists():
    from starlette.staticfiles import StaticFiles
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")


