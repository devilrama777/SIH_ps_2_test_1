import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.services.pipeline import DocumentPipeline

def run_test():
    pipeline = DocumentPipeline()
    sample_csv = ROOT_DIR / "backend" / "tests" / "sample_data" / "test_sales.csv"
    
    print(f"Testing pipeline on sample CSV: {sample_csv}")
    result = pipeline.process_file(
        file_path=sample_csv,
        custom_llama_cmd="Identify top performing region by revenue and verify if total revenue equals 5400 + 3825 + 7000 + 4750.",
        custom_calculations=[
            {"label": "Total Regional Revenue Sum", "formula": "5400 + 3825 + 7000 + 4750", "expected": 20975.0}
        ]
    )

    print("\n--- PIPELINE EXECUTION SUMMARY ---")
    print(f"Success: {result['success']}")
    print(f"Job ID: {result['job_id']}")
    print(f"Timings: {result['metadata']['stage_timings_sec']}")
    print(f"Output Directory: {result['output_directory']}")
    print("\n--- FINAL REPORT SAMPLE (first 600 chars) ---")
    print(result["final_report"][:600])

if __name__ == "__main__":
    run_test()
