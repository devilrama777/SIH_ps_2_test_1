# Backend Architecture & Multi-Stage AI Pipeline Plan

## 1. Executive Summary

This architecture defines an end-to-end backend processing engine designed to convert documents (**PDF** and **CSV**) into structured **Markdown**, run reasoning and extraction through a local **LLaMA 3.1** model via Ollama, execute exact **mathematical calculations**, and produce a publication-grade, systematic analytical report using a **Gemma** model.

```
+-----------------------------------------------------------------------------------+
|                                 USER INPUT                                        |
|                       [ PDF Document ]  |  [ CSV Data ]                           |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| STAGE 1: INGESTION & MARKDOWN CONVERSION ENGINE                                   |
| - PDF: Table extraction (pdfplumber) + Heading/Text layout (pypdf/pdfminer)       |
| - CSV: Schema detection, summary stats + Clean GitHub Markdown Tables (pandas)    |
| - Output: Standardized Clean Markdown (.md) with metadata tags                    |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| STAGE 2: LOCAL LLAMA 3.1 REASONING ENGINE (OLLAMA)                                |
| - Endpoint: http://localhost:11434/api/generate (llama3.1:latest)                 |
| - Dynamic Task Prompting: Inject file-specific predefined commands                |
| - Task: Information extraction, structural semantic analysis, key insights        |
| - Output: Intermediate Structured Markdown + Math Extraction tags                |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| STAGE 3: DETERMINISTIC MATHEMATICAL & QUANTITATIVE ENGINE                         |
| - Python Num Engine: Verifies formulas, sums, ratios, differences, statistics      |
| - Eliminates LLM calculation hallucinations                                       |
| - Output: Verified numbers and calculation metadata matrix                        |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| STAGE 4: GEMMA REPORT SYNTHESIS & FORMATTING ENGINE                               |
| - Model: Gemma 2 / Gemma local (or API)                                           |
| - Task: Merge verified math + LLaMA extraction into a systematic, polished report |
| - Structure: Executive Summary, Key Findings, Verified Tables, Recommendations   |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| STAGE 5: EXPORT & FRONTEND DELIVERY                                               |
| - Final Output Formats: Markdown (.md), Clean HTML, PDF (ReportLab/WeasyPrint)    |
| - Consumed by Web UI / Stitch Dashboard                                           |
+-----------------------------------------------------------------------------------+
```

---

## 2. Technology Stack & Environment

- **Framework**: FastAPI (high-speed asynchronous REST API)
- **ASGI Server**: Uvicorn
- **Local Model Provider**: Ollama (already running with `llama3.1:latest` on port `11434`)
- **Report Polishing Model**: Gemma (can run locally via Ollama `gemma2:9b` / `gemma2:2b` or Google API)
- **Document Parsing**:
  - `pdfplumber` / `pypdf`: High-fidelity PDF table and textual extraction
  - `pandas`: CSV reading, data profiling, markdown table rendering
- **Deterministic Math Engine**: Python `numpy` / `math` / custom rule-based arithmetic validator

---

## 3. Detailed Component Design

### 3.1 Ingestion & Markdown Converter (`converter.py`)
- **PDF to Markdown**:
  - Extracts text while preserving structural hierarchy (headings `#`, `##`, lists `-`).
  - Extracts tabular blocks using `pdfplumber.extract_tables()` and converts them to GitHub Flavored Markdown tables (`| Col1 | Col2 |`).
  - Flags potential formulas or numerical indicators for Stage 3.
- **CSV to Markdown**:
  - Reads CSV using pandas with automatic encoding/delimiter detection.
  - Generates a dataset overview (row count, column types, missing values).
  - Renders top rows and distribution summaries into Markdown tables.

### 3.2 LLaMA 3.1 Local Reasoning Module (`llama_runner.py`)
- Interfaces directly with Ollama's HTTP API (`http://localhost:11434/api/generate`).
- Uses modular prompt templates based on file type:
  - `pdf_commands.yaml` / `csv_commands.yaml`: Pluggable user-defined directives.
  - The model parses the raw converted Markdown, applies your specific analysis rules, and tags any data requiring arithmetic checks.

### 3.3 Math & Calculation Engine (`math_engine.py`)
- Extracts formulas, totals, percentages, differences, or metrics defined in the document.
- Computes exact calculations deterministically in Python to guarantee 100% precision.
- Injects a verified `## Mathematical Verification & Quantitative Analysis` section.

### 3.4 Gemma Report Generation (`gemma_reporter.py`)
- Takes the LLaMA extracted insights and the verified calculations.
- Prompts Gemma with a professional report style guide (Clean typography, executive summaries, highlight callouts, structured data tables).
- Produces the final systematic `.md` report.

### 3.5 Storage & Pipeline Orchestrator (`pipeline.py`)
- Provides both step-by-step endpoints and an all-in-one `/api/pipeline/run` execution path.
- Saves artifacts in a structured `output/` directory:
  1. `output/{job_id}/01_raw_converted.md`
  2. `output/{job_id}/02_llama_analysis.md`
  3. `output/{job_id}/03_math_verified.json`
  4. `output/{job_id}/04_final_systematic_report.md`

---

## 4. API Specification

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/upload` | Upload PDF or CSV and return `file_id` |
| `POST` | `/api/convert-md` | Convert uploaded file into clean Markdown |
| `POST` | `/api/llama/process` | Run LLaMA 3.1 on the Markdown with predefined commands |
| `POST` | `/api/math/compute` | Run deterministic calculations on extracted numbers |
| `POST` | `/api/gemma/report` | Run Gemma to generate the final systematic report |
| `POST` | `/api/pipeline/full` | Execute entire end-to-end workflow in one call |
| `GET`  | `/api/reports/{job_id}` | Fetch final report in Markdown or HTML |

---

## 5. Directory Structure Plan

```
<project_root>/
├── backend/
│   ├── main.py                  # FastAPI application entrypoint
│   ├── config.py                # Configurations (Ollama URLs, model names)
│   ├── services/
│   │   ├── converter.py         # PDF & CSV -> Markdown converter
│   │   ├── llama_client.py      # Ollama LLaMA 3.1 client
│   │   ├── gemma_client.py      # Gemma client (Ollama or API)
│   │   ├── math_engine.py       # Deterministic calculation engine
│   │   └── pipeline.py          # Orchestration service
│   ├── prompts/
│   │   ├── llama_pdf_prompt.txt # Pre-defined instructions for PDF
│   │   ├── llama_csv_prompt.txt # Pre-defined instructions for CSV
│   │   └── gemma_report_prompt.txt # System prompt for final formatting
│   ├── routers/
│   │   ├── upload_router.py
│   │   └── pipeline_router.py
│   ├── requirements.txt
│   └── tests/
│       └── test_pipeline.py
├── uploads/                     # Temporary raw input files
├── outputs/                     # Generated intermediate and final MD reports
└── backend_architecture_plan.md # This architecture document
```
