import json
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from backend import config

HISTORY_FILE = config.OUTPUTS_DIR / "reports_history.json"


def get_history(search: Optional[str] = None, auditor_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieves all generated reports with optional keyword search filtering."""
    if not HISTORY_FILE.exists():
        # Initialize default foundational history entry
        initial_history = [
            {
                "id": "REP-2026-B56D",
                "title": "National Coal Extraction & Power Dispatch Briefing",
                "template": "executive_brief",
                "template_name": "Executive Ministry Brief",
                "theme": "Sovereign Navy & Gold",
                "auditor_id": "MOC-7890",
                "timestamp": datetime.now().strftime("%d %b %Y, %I:%M %p"),
                "records_count": 18,
                "summary_snippet": "National extraction logged 133,767.30 MT with 96.26% target fulfillment and 95.55% offtake ratio.",
                "pdf_url": "/api/reports/download/pdf?template=executive_brief",
                "docx_url": "/api/reports/download/docx?template=executive_brief",
                "csv_url": "/api/reports/download/csv"
            }
        ]
        try:
            HISTORY_FILE.write_text(json.dumps(initial_history, indent=2), encoding="utf-8")
        except Exception:
            pass
        items = initial_history
    else:
        try:
            items = json.loads(HISTORY_FILE.read_text(encoding="utf-8"))
        except Exception:
            items = []

    # Filter by auditor_id if provided
    if auditor_id:
        items = [i for i in items if i.get("auditor_id", "").lower() == auditor_id.lower()]

    # Filter by search keyword (checks title, template, summary, and id)
    if search and search.strip():
        q = search.strip().lower()
        filtered = []
        for i in items:
            searchable_text = f"{i.get('title', '')} {i.get('template_name', '')} {i.get('template', '')} {i.get('id', '')} {i.get('summary_snippet', '')}".lower()
            if q in searchable_text:
                filtered.append(i)
        return filtered

    return items


def record_report(
    report_id: str,
    title: str,
    template_id: str,
    template_name: str,
    theme: str,
    auditor_id: str = "MOC-7890",
    records_count: int = 18,
    summary_snippet: str = ""
) -> Dict[str, Any]:
    """Records a newly generated report in the persistent history log."""
    history = get_history()
    
    new_entry = {
        "id": report_id,
        "title": title or f"Coal Performance Report ({template_name})",
        "template": template_id,
        "template_name": template_name,
        "theme": theme,
        "auditor_id": auditor_id,
        "timestamp": datetime.now().strftime("%d %b %Y, %I:%M %p"),
        "records_count": records_count,
        "summary_snippet": summary_snippet[:180] + ("..." if len(summary_snippet) > 180 else ""),
        "pdf_url": f"/api/reports/download/pdf?template={template_id}",
        "docx_url": f"/api/reports/download/docx?template={template_id}",
        "csv_url": "/api/reports/download/csv"
    }

    # Prepend new entry
    history.insert(0, new_entry)
    
    try:
        HISTORY_FILE.write_text(json.dumps(history, indent=2), encoding="utf-8")
    except Exception:
        pass

    return new_entry
