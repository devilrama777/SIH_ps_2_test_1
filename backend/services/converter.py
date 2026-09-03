import io
from pathlib import Path
from typing import Any, Dict, List, Optional
import pandas as pd
import pdfplumber
import pypdf


class MarkdownConverter:
    """Converts CSV and PDF files into structured, clean Markdown."""

    @staticmethod
    def _table_to_markdown(table: List[List[Any]]) -> str:
        """Converts a 2D list into a GitHub Flavored Markdown table."""
        if not table or not table[0]:
            return ""

        # Normalize rows to match header length
        header = [str(col).strip() if col is not None else "" for col in table[0]]
        num_cols = len(header)
        
        md_lines = []
        md_lines.append("| " + " | ".join(header) + " |")
        md_lines.append("| " + " | ".join(["---"] * num_cols) + " |")

        for row in table[1:]:
            normalized_row = []
            for i in range(num_cols):
                val = row[i] if i < len(row) else ""
                val_str = str(val).strip().replace("\n", " ") if val is not None else ""
                normalized_row.append(val_str)
            md_lines.append("| " + " | ".join(normalized_row) + " |")

        return "\n".join(md_lines) + "\n\n"

    @classmethod
    def convert_pdf_to_markdown(cls, file_path: Path) -> Dict[str, Any]:
        """Converts a PDF file into structured Markdown with extracted tables and text."""
        markdown_sections: List[str] = []
        total_pages = 0
        total_tables = 0

        # Try extracting with pdfplumber for best layout & table fidelity
        with pdfplumber.open(file_path) as pdf:
            total_pages = len(pdf.pages)
            markdown_sections.append(f"# PDF Document Content: {file_path.name}\n")
            markdown_sections.append(f"**Total Pages:** {total_pages}\n\n---\n")

            for page_num, page in enumerate(pdf.pages, start=1):
                markdown_sections.append(f"## Page {page_num}\n")
                
                # Extract tables first
                tables = page.extract_tables()
                if tables:
                    for table_idx, tbl in enumerate(tables, start=1):
                        total_tables += 1
                        markdown_sections.append(f"### Table {page_num}.{table_idx}\n")
                        markdown_sections.append(cls._table_to_markdown(tbl))

                # Extract textual content
                text = page.extract_text(layout=True)
                if text and text.strip():
                    markdown_sections.append("### Content\n")
                    # Clean multiple consecutive blank lines
                    cleaned_lines = []
                    for line in text.splitlines():
                        cleaned_lines.append(line.rstrip())
                    markdown_sections.append("\n".join(cleaned_lines) + "\n\n")

        full_md = "\n".join(markdown_sections)
        return {
            "markdown": full_md,
            "file_type": "pdf",
            "metadata": {
                "filename": file_path.name,
                "total_pages": total_pages,
                "total_tables_extracted": total_tables,
                "char_count": len(full_md)
            }
        }

    @classmethod
    def convert_csv_to_markdown(cls, file_path: Path, max_preview_rows: int = 100) -> Dict[str, Any]:
        """Converts a CSV file into structured Markdown with schema and statistical overview."""
        # Detect encoding
        encodings = ["utf-8", "latin1", "cp1252", "iso-8859-1"]
        df: Optional[pd.DataFrame] = None

        for enc in encodings:
            try:
                df = pd.read_csv(file_path, encoding=enc)
                break
            except (UnicodeDecodeError, pd.errors.ParserError):
                continue

        if df is None:
            raise ValueError(f"Unable to parse CSV file: {file_path.name}")

        row_count, col_count = df.shape
        md_sections: List[str] = []
        md_sections.append(f"# CSV Dataset Overview: {file_path.name}\n")
        md_sections.append(f"- **Total Records:** {row_count:,}")
        md_sections.append(f"- **Total Columns:** {col_count}")
        md_sections.append(f"- **Column List:** {', '.join(df.columns.astype(str))}\n\n---\n")

        # Column Schema & Missing Values Table
        schema_rows = [["Column Name", "Data Type", "Non-Null Count", "Missing Count", "Unique Values"]]
        for col in df.columns:
            non_null = int(df[col].notnull().sum())
            missing = row_count - non_null
            unique = int(df[col].nunique())
            dtype = str(df[col].dtype)
            schema_rows.append([str(col), dtype, str(non_null), str(missing), str(unique)])

        md_sections.append("## Dataset Schema\n")
        md_sections.append(cls._table_to_markdown(schema_rows))

        # Numerical Summary Statistics (if numeric columns exist)
        numeric_df = df.select_dtypes(include=["number"])
        if not numeric_df.empty:
            md_sections.append("## Numerical Summary Statistics\n")
            desc = numeric_df.describe().T.reset_index()
            desc.rename(columns={"index": "Metric / Column"}, inplace=True)
            stats_rows = [desc.columns.tolist()] + desc.round(4).values.tolist()
            md_sections.append(cls._table_to_markdown(stats_rows))

        # Data Sample Preview
        md_sections.append(f"## Data Records Preview (Showing first {min(row_count, max_preview_rows)} rows)\n")
        preview_df = df.head(max_preview_rows)
        preview_rows = [preview_df.columns.tolist()] + preview_df.fillna("").values.tolist()
        md_sections.append(cls._table_to_markdown(preview_rows))

        full_md = "\n".join(md_sections)
        return {
            "markdown": full_md,
            "file_type": "csv",
            "metadata": {
                "filename": file_path.name,
                "row_count": row_count,
                "column_count": col_count,
                "numeric_columns": numeric_df.columns.tolist(),
                "char_count": len(full_md)
            }
        }

    @classmethod
    def convert(cls, file_path: Path) -> Dict[str, Any]:
        """Auto-detects file extension and converts to Markdown."""
        suffix = file_path.suffix.lower()
        if suffix == ".pdf":
            return cls.convert_pdf_to_markdown(file_path)
        elif suffix in [".csv", ".tsv", ".txt"]:
            return cls.convert_csv_to_markdown(file_path)
        else:
            raise ValueError(f"Unsupported file format: '{suffix}'. Supported: .pdf, .csv")
