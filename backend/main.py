import json
import os
import shutil
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional
import pandas as pd
import requests

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from pydantic import BaseModel

from backend import config
from backend.services.converter import MarkdownConverter
from backend.services.document_generator import DocumentGenerator, TEMPLATE_CONFIGS, get_active_dataset_metrics
from backend.services.gemma_client import GemmaClient
from backend.services.history_manager import get_history, record_report
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

    # Persist active uploaded records for dynamic template presentation and report compilation
    try:
        active_records = df.to_dict(orient="records")
        (config.OUTPUTS_DIR / "active_user_dataset.json").write_text(
            json.dumps(active_records, default=str), encoding="utf-8"
        )
        df.to_csv(config.OUTPUTS_DIR / "active_cleaned_dataset.csv", index=False)
    except Exception:
        pass

    return {
        "filename": fname,
        "rows": int(len(df)),
        "columns": [str(c) for c in df.columns],
        "preview": clean_preview,
        "numeric_summary": {}
    }


@app.post("/api/pipeline/auto-generate-prompt")
async def auto_generate_prompt(
    category: Optional[str] = Form(None),
    filename: Optional[str] = Form(None)
):
    """Synthesizes high-impact executive directives based on coal production patterns, colliery variance, and logistics."""
    import random

    prompts_by_category = {
        "high_yield": [
            "Prioritize top mega-collieries (Gevra, Kusmunda, Dipka), analyze heavy earthmoving machinery efficiency, and flag stripping ratio bottlenecks.",
            "Isolate high-yield opencast basins yielding >15,000 MT, verify daily extraction quotas, and project Q3 production trajectory.",
            "Benchmark tier-1 opencast mines against annual MoC production charter, isolating volume contributors across SECL and MCL basins."
        ],
        "variance_audit": [
            "Perform statistical anomaly audit across all 18 basins, isolating collieries with >3% target fulfillment variance against statutory quotas.",
            "Audit production variance across coalfield basins, highlight overperforming and lagging mines, and calculate net national deficit index.",
            "Execute mathematical variance breakdown comparing actual extraction against scheduled union budget targets with determinism verification."
        ],
        "logistics": [
            "Audit First-Mile rail connectivity, evaluate rakes availability at siding nodes, and calculate power plant thermal coal buffer reserves.",
            "Track thermal power dispatch efficiency, evaluate offtake-to-extraction ratios, and map wagon turnaround times across Korba and Talcher.",
            "Assess multimodal evacuation corridors, monitor merry-go-round conveyor throughput, and verify critical power plant coal stockpiles."
        ],
        "esg": [
            "Evaluate eco-reclamation hectarage, solar mine transitions, mine water treatment recycling, and zero-harm safety statutory records.",
            "Audit sustainable mining parameters: first-mile rail adoption %, afforestation offset compliance, and carbon abatement progress.",
            "Benchmark zero-harm safety indices, overburden dump stability monitoring, and environmental statutory clearance conformity."
        ],
        "statutory": [
            "Compile statutory audit format focusing on union budget fulfillment, state royalty allocations, and public accounts committee review.",
            "Perform parliamentary accountability analysis: royalty distributions, district mineral foundation (DMF) allocations, and audit trails.",
            "Verify compliance with Mines Act guidelines, statutory vigilance oversight, and 100% deterministic cryptographic audit hashing."
        ]
    }

    all_general_prompts = [
        "Conduct comprehensive strategic review isolating mega-collieries, thermal power plant dispatch ratios, and statutory audit integrity.",
        "Synthesize national extraction leaderboard, calculate colliery variance against target quotas, and evaluate rail evacuation corridors.",
        "Perform deep-dive colliery operational audit: benchmark extraction velocity, identify dispatch bottlenecks, and assess regional quotas.",
        "Audit high-capacity opencast mining assets, verify statutory compliance metrics, and formulate executive ministerial directives."
    ]

    if category and category in prompts_by_category:
        selected = random.choice(prompts_by_category[category])
    else:
        selected = random.choice(all_general_prompts)

    return {
        "status": "success",
        "prompt": selected,
        "category": category or "general"
    }



class ReportRevisionRequest(BaseModel):
    report_id: Optional[str] = None
    template: Optional[str] = "bento_grid"
    current_content: Optional[str] = None
    revision_prompt: str
    gemma_model: Optional[str] = None


@app.post("/api/reports/revise")
async def revise_report_with_gemma(req: ReportRevisionRequest):
    """Revises a compiled report using Gemma 4 according to user feedback directives."""
    summary_path = config.PROCESSED_OUTPUT_DIR / "llama_summary.md"
    current_md = req.current_content or ""
    if not current_md and summary_path.exists():
        current_md = summary_path.read_text(encoding="utf-8")

    result = gemma_client.revise_report(
        current_report_markdown=current_md,
        user_revision_prompt=req.revision_prompt,
        model_override=req.gemma_model,
        template=req.template
    )

    revised_text = result.get("revised_report", "")
    if revised_text:
        try:
            summary_path.write_text(revised_text, encoding="utf-8")
        except Exception:
            pass

    return {
        "success": True,
        "report_id": req.report_id or "REP-2026-REV",
        "template": req.template,
        "model_used": result.get("model_used", "gemma-4"),
        "revised_content": revised_text,
        "revision_prompt": req.revision_prompt,
        "message": "Report revised successfully by Gemma 4."
    }


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


@app.get("/api/templates")
def list_report_templates():
    """Returns the catalog of 6 modern report templates with metadata and section schemas."""
    templates = []
    for tpl_id, tpl in TEMPLATE_CONFIGS.items():
        templates.append({
            "id": tpl_id,
            "name": tpl["name"],
            "theme": tpl["theme"],
            "header_title": tpl["header_title"],
            "subtitle": tpl["subtitle"],
            "primary_hex": tpl["primary_hex"],
            "accent_hex": tpl["accent_hex"],
            "light_bg_hex": tpl["light_bg_hex"],
            "border_hex": tpl["border_hex"],
            "icon": tpl["icon"],
            "badge": tpl["badge"],
            "sections": tpl["sections"]
        })
    return {"templates": templates}


class TemplateFillRequest(BaseModel):
    data_summary: Optional[str] = None
    custom_focus: Optional[str] = None
    model: Optional[str] = None


@app.post("/api/templates/{template_id}/fill")
def fill_template_content(template_id: str, req: Optional[TemplateFillRequest] = None):
    """Fills data into the chosen modern template dynamically from active dataset metrics."""
    tpl_key = template_id.lower().replace(" ", "_")
    if tpl_key not in TEMPLATE_CONFIGS:
        raise HTTPException(status_code=404, detail=f"Template '{template_id}' not found. Available: {list(TEMPLATE_CONFIGS.keys())}")

    tpl = TEMPLATE_CONFIGS[tpl_key]
    metrics = get_active_dataset_metrics()

    data_summary = ""
    if req and req.data_summary:
        data_summary = req.data_summary
    else:
        summary_path = config.PROCESSED_OUTPUT_DIR / "llama_summary.md"
        if summary_path.exists():
            data_summary = summary_path.read_text(encoding="utf-8")
        else:
            top_colls = ", ".join(f"{c['name']} ({c['production']:,.1f} MT)" for c in metrics['collieries'][:3])
            data_summary = (
                f"Total Production: {metrics['total_production']:,.2f} MT | "
                f"Total Dispatch: {metrics['total_dispatch']:,.2f} MT | "
                f"Target Fulfillment: {metrics['achievement_pct']:.2f}% | "
                f"Offtake Ratio: {metrics['offtake_ratio']:.2f}% | "
                f"Top Units: {top_colls}."
            )

    # Load template prompt
    prompt_file = config.PROMPTS_DIR / f"template_{tpl_key}.txt"
    system_prompt = prompt_file.read_text(encoding="utf-8") if prompt_file.exists() else ""
    full_prompt = system_prompt.replace("{data_summary}", data_summary)
    if req and req.custom_focus:
        full_prompt += f"\n\nADDITIONAL FOCUS DIRECTIVE:\n{req.custom_focus}"

    # Check if Ollama is accessible (skip on Vercel to respond instantly)
    ai_generated_text = None
    if not (os.getenv("VERCEL") == "1" or os.getenv("VERCEL_ENV")):
        try:
            ollama_model = req.model if req and req.model else config.LLAMA_MODEL
            resp = requests.post(
                f"{config.OLLAMA_BASE_URL}/api/generate",
                json={"model": ollama_model, "prompt": full_prompt, "stream": False},
                timeout=1.5
            )
            if resp.status_code == 200:
                ai_generated_text = resp.json().get("response")
        except Exception:
            ai_generated_text = None

    sections = []
    if ai_generated_text and len(ai_generated_text.strip()) > 50:
        parts = ai_generated_text.split("\n\n")
        curr_title = tpl["sections"][0]
        curr_content = []
        sec_idx = 0
        for p in parts:
            p_strip = p.strip()
            if not p_strip:
                continue
            if any(p_strip.lower().startswith(s.lower()[:15]) for s in tpl["sections"]) or p_strip.startswith(("#", "1.", "2.", "3.", "4.")):
                if curr_content and sec_idx < len(tpl["sections"]):
                    sections.append({"title": curr_title, "content": "\n\n".join(curr_content)})
                    curr_content = []
                    sec_idx += 1
                    curr_title = tpl["sections"][min(sec_idx, len(tpl["sections"]) - 1)]
                curr_title = p_strip.lstrip("#").strip()
            else:
                curr_content.append(p_strip)
        if curr_content:
            sections.append({"title": curr_title, "content": "\n\n".join(curr_content)})

    # Unconditionally enforce identical, deterministic dataset synthesis across all graphic templates
    if not sections:
        top_name = metrics["collieries"][0]["name"] if metrics["collieries"] else "Primary Colliery"
        top_prod = metrics["collieries"][0]["production"] if metrics["collieries"] else 0.0

        sections = [
            {
                "title": "1. Macro Operational Baseline & Synthesis",
                "content": f"National coal extraction recorded {metrics['total_production']:,.2f} MT across {metrics['count']} monitored production assets. Target benchmark fulfillment reached {metrics['achievement_pct']:.2f}%, sustaining critical utility stock buffers above mandated norms. Total pithead dispatch reached {metrics['total_dispatch']:,.2f} MT with a robust {metrics['offtake_ratio']:.2f}% offtake efficiency."
            },
            {
                "title": "2. Key Performance Indicators & Benchmark Analytics",
                "content": f"Top producing installations sustained strong operational capacity, led by {top_name} with {top_prod:,.2f} MT. Parametric distribution across {metrics['count']} units reveals a sample mean of {metrics['mean']:,.2f} MT, median of {metrics['median']:,.2f} MT, and upper IQR fence at {metrics['upper_fence']:,.2f} MT. Units operating at or above this threshold have been prioritized with automated rake evacuation."
            },
            {
                "title": "3. Supply Chain, Logistics & Dispatch Priorities",
                "content": "• PRIORITY 1: Accelerate First-Mile Connectivity (FMC) rail sidings to enhance pithead evacuation and eliminate accumulation.\n• PRIORITY 2: Standardize continuous surface miner telemetry and digital monitoring across active open-cast extraction benches.\n• PRIORITY 3: Maintain mandatory 24-day normative fuel buffer stocks across all critical thermal power utilities."
            }
        ]

    # Re-compile the template-specific documents immediately with active dataset metrics
    combined_summary = "\n\n".join(f"## {s['title']}\n{s['content']}" for s in sections)
    report_id = f"REP-2026-{uuid.uuid4().hex[:4].upper()}"
    pkg = document_generator.generate_all_packages(
        template_name=tpl_key,
        report_id=report_id,
        summary_text=combined_summary,
        user_records=metrics["collieries"]
    )

    # Persist report to Generated Report History Hub
    record_report(
        report_id=report_id,
        title=f"{tpl['name']} — Performance Intelligence Dossier",
        template_id=tpl_key,
        template_name=tpl["name"],
        theme=tpl["theme"],
        auditor_id="MOC-7890",
        records_count=metrics["count"],
        summary_snippet=sections[0]["content"] if sections else ""
    )

    return {
        "success": True,
        "template_id": tpl_key,
        "template_name": tpl["name"],
        "theme": tpl["theme"],
        "header_title": tpl["header_title"],
        "subtitle": tpl["subtitle"],
        "primary_hex": tpl["primary_hex"],
        "accent_hex": tpl["accent_hex"],
        "light_bg_hex": tpl["light_bg_hex"],
        "icon": tpl["icon"],
        "badge": tpl["badge"],
        "sections": sections,
        "kpis": [
            {"label": "National Extraction", "value": f"{metrics['total_production']:,.2f} MT", "badge": f"{metrics['achievement_pct']:.2f}% Target"},
            {"label": "Thermal Dispatch", "value": f"{metrics['total_dispatch']:,.2f} MT", "badge": f"{metrics['offtake_ratio']:.2f}% Offtake"},
            {"label": "Active Collieries", "value": f"{metrics['count']} Collieries", "badge": "Basin Monitored"},
            {"label": "Audit Integrity", "value": "100% Deterministic", "badge": "AST Math Verified"}
        ],
        "collieries_preview": metrics["collieries"][:8],
        "files": pkg.get("files", {})
    }


# -------------------------------------------------------------------------
# REPORT HISTORY ENDPOINTS
# -------------------------------------------------------------------------
@app.get("/api/reports/history")
def get_reports_history(search: Optional[str] = None, auditor: Optional[str] = None):
    """Returns persistent generated report history with word search filtering."""
    history = get_history(search=search, auditor_id=auditor)
    return {"success": True, "history": history, "count": len(history)}


class RecordHistoryRequest(BaseModel):
    id: str
    title: str
    template: str
    template_name: str
    theme: str
    auditor_id: Optional[str] = "MOC-7890"
    records_count: Optional[int] = 18
    summary_snippet: Optional[str] = ""


@app.post("/api/reports/history")
def add_report_history(req: RecordHistoryRequest):
    """Records a generated report into the persistent history log."""
    entry = record_report(
        report_id=req.id,
        title=req.title,
        template_id=req.template,
        template_name=req.template_name,
        theme=req.theme,
        auditor_id=req.auditor_id or "MOC-7890",
        records_count=req.records_count or 18,
        summary_snippet=req.summary_snippet or ""
    )
    return {"success": True, "entry": entry}


# -------------------------------------------------------------------------
# REPORT DOWNLOAD ENDPOINTS
# -------------------------------------------------------------------------
@app.get("/api/reports/download/csv")
def download_active_csv():
    """Downloads the raw clean CSV dataset (strictly without template styling)."""
    active_csv = config.OUTPUTS_DIR / "active_cleaned_dataset.csv"
    if active_csv.exists():
        return FileResponse(path=active_csv, filename="Cleaned_Coal_Dataset_2026.csv", media_type="text/csv")

    base_csv = config.REPORTED_DATA_DIR / "coal_production_report.csv"
    if base_csv.exists():
        return FileResponse(path=base_csv, filename="National_Coal_Production_Dataset.csv", media_type="text/csv")

    metrics = get_active_dataset_metrics()
    df = pd.DataFrame(metrics["collieries"])
    active_csv.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(active_csv, index=False)
    return FileResponse(path=active_csv, filename="Coal_Collieries_Dataset.csv", media_type="text/csv")


class ReportPackageRequest(BaseModel):
    template: str = "executive_brief"
    report_id: str = "REP-2026-B56D"
    custom_summary: Optional[str] = None


@app.post("/api/reports/generate-package")
def generate_report_package(req: Optional[ReportPackageRequest] = None):
    """Compiles actual publication-grade PDF, DOCX, and XLSX reports."""
    tpl = req.template if req else "executive_brief"
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
def download_report_format(fmt: str, template: Optional[str] = None):
    """Downloads the generated report in the requested format (pdf, docx, xlsx, csv) for the selected template."""
    fmt = fmt.lower().lstrip(".")
    if fmt == "csv":
        return download_active_csv()

    mapping = {
        "pdf": ("Ministry_of_Coal_Report_2026.pdf", "application/pdf"),
        "docx": ("Ministry_of_Coal_Report_2026.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        "xlsx": ("Ministry_of_Coal_Report_2026.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
    }
    if fmt not in mapping:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {fmt}. Choose from pdf, docx, xlsx, csv.")

    default_fname, media_type = mapping[fmt]
    file_path = config.REPORTS_DIR / default_fname

    if template:
        tpl_key = template.lower().replace(" ", "_")
        tpl_fname = f"Ministry_of_Coal_{tpl_key}_2026.{fmt}"
        tpl_path = config.REPORTS_DIR / tpl_fname
        if tpl_path.exists():
            return FileResponse(path=tpl_path, filename=tpl_fname, media_type=media_type)

    if not file_path.exists():
        document_generator.generate_all_packages(template_name=template or "executive_brief")

    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Report file {default_fname} not found.")

    return FileResponse(path=file_path, filename=default_fname, media_type=media_type)


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


