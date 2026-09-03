import sys
import unittest
from pathlib import Path

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.services.converter import MarkdownConverter
from backend.services.math_engine import MathEngine, safe_eval_expr
from backend.services.llama_client import LlamaClient
from backend.services.pipeline import DocumentPipeline


class TestPipeline(unittest.TestCase):

    def setUp(self):
        self.converter = MarkdownConverter()
        self.math_engine = MathEngine()
        self.llama_client = LlamaClient()
        self.pipeline = DocumentPipeline()
        self.test_data_dir = ROOT_DIR / "backend" / "tests" / "sample_data"
        self.test_data_dir.mkdir(parents=True, exist_ok=True)

    def test_safe_math_eval(self):
        """Test safe math evaluator on standard arithmetic expressions."""
        self.assertEqual(safe_eval_expr("10 + 20"), 30)
        self.assertEqual(safe_eval_expr("100 * 1.05"), 105.0)
        self.assertEqual(safe_eval_expr("(500 - 200) / 2"), 150.0)
        self.assertEqual(safe_eval_expr("2 ** 3"), 8)

    def test_math_verification_with_expected(self):
        """Test verification status when expected matches or mismatches."""
        # Match case
        res_pass = self.math_engine.verify_expression("150 + 250", expected_val=400.0)
        self.assertEqual(res_pass["status"], "VERIFIED")
        self.assertEqual(res_pass["calculated"], 400.0)

        # Mismatch case
        res_fail = self.math_engine.verify_expression("150 + 250", expected_val=450.0)
        self.assertEqual(res_fail["status"], "DISCREPANCY_DETECTED")
        self.assertEqual(res_fail["calculated"], 400.0)

    def test_math_flags_extraction(self):
        """Test extracting [MATH_CHECK: ... | formula: ...] pattern."""
        sample_text = (
            "The company saw revenue of $500k. "
            "[MATH_CHECK: Net Profit | formula: 500000 - 320000 = 180000]\n"
            "Operating margin: [MATH_CHECK: Margin | formula: (180000 / 500000) * 100]"
        )
        audit = self.math_engine.process_math_checks(sample_text)
        self.assertEqual(audit["total_checks"], 2)
        self.assertIn("Mathematical & Quantitative Audit Table", audit["audit_markdown"])

    def test_csv_to_markdown_conversion(self):
        """Test converting a sample CSV file into structured Markdown."""
        sample_csv = self.test_data_dir / "test_sales.csv"
        sample_csv.write_text(
            "Region,Quarter,Units_Sold,Unit_Price,Revenue\n"
            "North,Q1,120,45.0,5400.0\n"
            "South,Q1,85,45.0,3825.0\n"
            "East,Q1,140,50.0,7000.0\n"
            "West,Q1,95,50.0,4750.0\n",
            encoding="utf-8"
        )
        res = self.converter.convert_csv_to_markdown(sample_csv)
        self.assertEqual(res["file_type"], "csv")
        self.assertIn("test_sales.csv", res["markdown"])
        self.assertIn("Numerical Summary Statistics", res["markdown"])
        self.assertIn("| North | Q1 | 120 | 45.0 | 5400.0 |", res["markdown"])

    def test_ollama_connectivity(self):
        """Verify that local Ollama instance is reachable."""
        is_up = self.llama_client.is_available()
        self.assertTrue(is_up, "Local Ollama server is not reachable on localhost:11434")
        models = self.llama_client.list_installed_models()
        self.assertTrue(any("llama3.1" in m for m in models), f"llama3.1 not found in models: {models}")


if __name__ == "__main__":
    unittest.main()
