import io
from pathlib import Path
from typing import Any, Dict, List, Optional
import pandas as pd
import pdfplumber
import pypdf
from PIL import Image as PILImage


class MarkdownConverter:
    """Converts CSV, Excel, PDF, and image documents into structured, clean Markdown."""

    @staticmethod
    def _table_to_markdown(table: List[List[Any]]) -> str:
        """Converts a 2D list into a GitHub Flavored Markdown table."""
        if not table or not table[0]:
            return ""

        header = [str(col).strip() if col is not None else "" for col in table[0]]
        num_cols = len(header)
        md_lines = ["| " + " | ".join(header) + " |", "| " + " | ".join(["---"] * num_cols) + " |"]

        for row in table[1:]:
            normalized_row = []
            for i in range(num_cols):
                val = row[i] if i < len(row) else ""
                val_str = str(val).strip().replace("\n", " ") if val is not None else ""
                normalized_row.append(val_str)
            md_lines.append("| " + " | ".join(normalized_row) + " |")

        return "\n".join(md_lines) + "\n\n"

    @classmethod
    def convert_pdf_to_markdown(cls, file_path: Path, output_media_dir: Optional[Path] = None) -> Dict[str, Any]:
        """Converts a PDF file into structured Markdown with extracted tables, text, and multimodal media."""
        markdown_sections: List[str] = []
        total_pages = 0
        extracted_images: List[Dict[str, Any]] = []
        extracted_audio: List[Dict[str, Any]] = []

        # Extract embedded images and media attachments
        try:
            reader = pypdf.PdfReader(str(file_path))
            media_dir = output_media_dir or (file_path.parent / "extracted_media")
            media_dir.mkdir(parents=True, exist_ok=True)

            for page_idx, page in enumerate(reader.pages, start=1):
                try:
                    if len(extracted_images) >= 10:
                        break
                    for img_idx, img_file in enumerate(page.images, start=1):
                        if len(extracted_images) >= 10:
                            break
                        if len(img_file.data) < 2048:
                            continue
                        img_filename = f"p{page_idx}_img{img_idx}_{img_file.name}"
                        img_path = media_dir / img_filename
                        with open(img_path, "wb") as f:
                            f.write(img_file.data)
                        extracted_images.append({
                            "page": page_idx,
                            "index": img_idx,
                            "name": img_filename,
                            "path": str(img_path),
                            "size_bytes": len(img_file.data)
                        })
                except Exception:
                    pass

            if hasattr(reader, "attachments") and reader.attachments:
                for name, data in reader.attachments.items():
                    if any(name.lower().endswith(ext) for ext in [".mp3", ".wav", ".aac", ".ogg", ".m4a", ".mp4"]):
                        media_path = media_dir / name
                        media_path.write_bytes(data[0] if isinstance(data, list) else data)
                        extracted_audio.append({
                            "name": name,
                            "path": str(media_path),
                            "type": "audio"
                        })
        except Exception:
            pass

        # Extract layout, text, and tables with pdfplumber
        with pdfplumber.open(file_path) as pdf:
            total_pages = len(pdf.pages)
            markdown_sections.append(f"# PDF Document Intelligence: {file_path.name}\n")
            markdown_sections.append(f"- **Total Pages:** {total_pages}")
            markdown_sections.append(f"- **Extracted Visual Figures:** {len(extracted_images)}")
            markdown_sections.append("\n---\n")

            total_tables = 0
            for i, page in enumerate(pdf.pages):
                tables = page.extract_tables()
                if tables:
                    for table in tables:
                        md_table = cls._table_to_markdown(table)
                        if md_table:
                            total_tables += 1
                            markdown_sections.append(f"### [Table {total_tables} - Page {i + 1}]\n")
                            markdown_sections.append(md_table)

                text = page.extract_text()
                if text:
                    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
                    clean_text = "\n".join(lines[:35])  # prioritize high-signal headers
                    markdown_sections.append(f"#### Page {i + 1} Salient Text Extract\n{clean_text}\n\n")

        full_md = "\n".join(markdown_sections)
        return {
            "markdown": full_md,
            "file_type": "pdf",
            "extracted_images": extracted_images,
            "extracted_audio": extracted_audio,
            "has_multimedia": len(extracted_images) > 0 or len(extracted_audio) > 0,
            "metadata": {
                "filename": file_path.name,
                "total_pages": total_pages,
                "total_tables": total_tables,
                "image_count": len(extracted_images),
                "char_count": len(full_md)
            }
        }

    @classmethod
    def convert_csv_to_markdown(cls, file_path: Path, max_preview_rows: int = 100) -> Dict[str, Any]:
        """Converts a CSV or TSV file into structured Markdown with schema and statistical overview."""
        encodings = ["utf-8", "latin1", "cp1252", "iso-8859-1"]
        df: Optional[pd.DataFrame] = None
        delimiter = "\t" if file_path.suffix.lower() == ".tsv" else ","

        for enc in encodings:
            try:
                df = pd.read_csv(file_path, encoding=enc, sep=delimiter)
                break
            except (UnicodeDecodeError, pd.errors.ParserError):
                continue

        if df is None:
            raise ValueError(f"Unable to parse delimited file: {file_path.name}")

        row_count, col_count = df.shape
        md_sections = [
            f"# Delimited Dataset Overview: {file_path.name}\n",
            f"- **Total Records:** {row_count:,}",
            f"- **Total Columns:** {col_count}",
            f"- **Columns:** {', '.join(df.columns.astype(str))}\n\n---\n"
        ]

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

        # Numerical Summary Statistics
        numeric_df = df.select_dtypes(include=["number"])
        if not numeric_df.empty:
            md_sections.append("## Numerical Summary Statistics\n")
            desc = numeric_df.describe().T.reset_index()
            desc.rename(columns={"index": "Metric / Column"}, inplace=True)
            stats_rows = [desc.columns.tolist()] + desc.round(4).values.tolist()
            md_sections.append(cls._table_to_markdown(stats_rows))

        # Data Sample Preview
        md_sections.append(f"## Data Records Preview (First {min(row_count, max_preview_rows)} rows)\n")
        preview_df = df.head(max_preview_rows)
        preview_rows = [preview_df.columns.tolist()] + preview_df.fillna("").values.tolist()
        md_sections.append(cls._table_to_markdown(preview_rows))

        full_md = "\n".join(md_sections)
        return {
            "markdown": full_md,
            "file_type": "csv",
            "extracted_images": [],
            "extracted_audio": [],
            "has_multimedia": False,
            "metadata": {
                "filename": file_path.name,
                "row_count": row_count,
                "column_count": col_count,
                "numeric_columns": numeric_df.columns.tolist(),
                "char_count": len(full_md)
            }
        }

    @classmethod
    def convert_excel_to_markdown(cls, file_path: Path, max_preview_rows: int = 80) -> Dict[str, Any]:
        """Converts an Excel workbook (.xlsx, .xls) into structured Markdown covering all sheets."""
        try:
            excel_file = pd.ExcelFile(file_path)
        except Exception as e:
            raise ValueError(f"Unable to read Excel file {file_path.name}: {str(e)}")

        sheet_names = excel_file.sheet_names
        md_sections = [
            f"# Multi-Sheet Spreadsheet Intelligence: {file_path.name}\n",
            f"- **Total Sheets:** {len(sheet_names)} ({', '.join(sheet_names)})",
            "\n---\n"
        ]

        total_rows = 0
        all_numeric_cols = []

        for sheet in sheet_names:
            df = excel_file.parse(sheet)
            row_count, col_count = df.shape
            total_rows += row_count
            md_sections.append(f"## Sheet: {sheet}\n")
            md_sections.append(f"- **Dimensions:** {row_count} rows × {col_count} columns\n")

            if row_count > 0:
                # Schema preview
                schema_rows = [["Column", "Data Type", "Non-Null"]]
                for col in df.columns:
                    schema_rows.append([str(col), str(df[col].dtype), str(int(df[col].notnull().sum()))])
                md_sections.append(cls._table_to_markdown(schema_rows))

                # Numerical summary
                num_df = df.select_dtypes(include=["number"])
                if not num_df.empty:
                    all_numeric_cols.extend([f"{sheet}::{c}" for c in num_df.columns])
                    desc = num_df.describe().T.reset_index().rename(columns={"index": "Metric"})
                    stats_rows = [desc.columns.tolist()] + desc.round(4).values.tolist()
                    md_sections.append(f"### Numerical Summary ({sheet})\n" + cls._table_to_markdown(stats_rows))

                # Table Preview
                preview_df = df.head(max_preview_rows)
                p_rows = [preview_df.columns.tolist()] + preview_df.fillna("").values.tolist()
                md_sections.append(f"### Data Preview ({sheet})\n" + cls._table_to_markdown(p_rows))

        full_md = "\n".join(md_sections)
        return {
            "markdown": full_md,
            "file_type": "excel",
            "extracted_images": [],
            "extracted_audio": [],
            "has_multimedia": False,
            "metadata": {
                "filename": file_path.name,
                "sheet_count": len(sheet_names),
                "sheets": sheet_names,
                "total_rows": total_rows,
                "numeric_columns": all_numeric_cols,
                "char_count": len(full_md)
            }
        }

    @classmethod
    def convert_image_to_markdown(cls, file_path: Path) -> Dict[str, Any]:
        """Profiles a standalone image and extracts visual metadata for multimodal reasoning & DOCX injection."""
        try:
            with PILImage.open(file_path) as img:
                width, height = img.size
                format_name = img.format or file_path.suffix.lstrip(".").upper()
                mode = img.mode
                info_keys = list(img.info.keys())
        except Exception as e:
            raise ValueError(f"Unable to profile image file {file_path.name}: {str(e)}")

        size_kb = round(file_path.stat().st_size / 1024, 2)
        md = (
            f"# Standalone Photographic & Geospatial Evidence: {file_path.name}\n"
            f"- **Resolution:** {width} × {height} px\n"
            f"- **Format:** {format_name} (Color Mode: {mode})\n"
            f"- **File Size:** {size_kb} KB\n"
            f"- **Metadata Tags:** {', '.join(info_keys) if info_keys else 'None'}\n\n"
            f"*This image asset has been registered into the multimodal synthesis pipeline and will be embedded into the final executive Word DOCX report.*\n\n---\n"
        )
        img_info = {
            "page": 1,
            "index": 1,
            "name": file_path.name,
            "path": str(file_path),
            "size_bytes": file_path.stat().st_size,
            "dimensions": f"{width}x{height}"
        }
        return {
            "markdown": md,
            "file_type": "image",
            "extracted_images": [img_info],
            "extracted_audio": [],
            "has_multimedia": True,
            "metadata": {
                "filename": file_path.name,
                "dimensions": f"{width}x{height}",
                "format": format_name,
                "size_kb": size_kb
            }
        }

    @classmethod
    def convert(cls, file_path: Path, output_media_dir: Optional[Path] = None) -> Dict[str, Any]:
        """Auto-detects file extension and converts to structured Markdown."""
        suffix = file_path.suffix.lower()
        if suffix == ".pdf":
            return cls.convert_pdf_to_markdown(file_path, output_media_dir=output_media_dir)
        elif suffix in [".xlsx", ".xls"]:
            return cls.convert_excel_to_markdown(file_path)
        elif suffix in [".csv", ".tsv", ".txt"]:
            return cls.convert_csv_to_markdown(file_path)
        elif suffix in [".jpg", ".jpeg", ".png", ".webp", ".bmp"]:
            return cls.convert_image_to_markdown(file_path)
        else:
            raise ValueError(f"Unsupported file format: '{suffix}'. Supported: .pdf, .xlsx, .xls, .csv, .tsv, images (.png, .jpg)")

    @classmethod
    def compile_multi_source_bundle(cls, file_paths: List[Path], output_media_dir: Optional[Path] = None) -> Dict[str, Any]:
        """Compiles heterogeneous data sources into an integrated intelligence bundle."""
        combined_markdown: List[str] = [
            "# Integrated Multi-Source Intelligence Dossier — Ministry of Coal\n",
            f"*Synthesized from {len(file_paths)} heterogeneous sources (digital documents, spreadsheets, scanned PDFs, photographic archives)*\n\n---\n"
        ]
        all_extracted_images = []
        all_extracted_audio = []
        sources_summary = []

        for p in file_paths:
            if not p.exists():
                continue
            res = cls.convert(p, output_media_dir=output_media_dir)
            combined_markdown.append(f"## Source Document: `{p.name}` (Type: {res['file_type'].upper()})\n\n")
            combined_markdown.append(res["markdown"])
            combined_markdown.append("\n---\n")

            if res.get("extracted_images"):
                all_extracted_images.extend(res["extracted_images"])
            if res.get("extracted_audio"):
                all_extracted_audio.extend(res["extracted_audio"])

            sources_summary.append({
                "filename": p.name,
                "type": res["file_type"],
                "metadata": res.get("metadata", {})
            })

        full_bundle_md = "\n".join(combined_markdown)
        return {
            "markdown": full_bundle_md,
            "sources": sources_summary,
            "extracted_images": all_extracted_images,
            "extracted_audio": all_extracted_audio,
            "has_multimedia": len(all_extracted_images) > 0 or len(all_extracted_audio) > 0,
            "total_sources": len(sources_summary)
        }
