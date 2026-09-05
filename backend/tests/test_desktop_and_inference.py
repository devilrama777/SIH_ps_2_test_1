import unittest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.inference_manager import InferenceManager


class TestDesktopAndInference(unittest.TestCase):
    """Test suite for desktop helper endpoints and InferenceManager lifecycle."""

    def setUp(self):
        self.client = TestClient(app)
        self.inference_mgr = InferenceManager()

    def test_inference_manager_status(self):
        """Verify that InferenceManager initializes and returns a valid status payload."""
        status = self.inference_mgr.get_engine_status()
        self.assertIn("status", status)
        self.assertIn("backend", status)
        self.assertIn("base_url", status)
        self.assertIn("primary_llama", status)
        self.assertIn("primary_gemma", status)
        self.assertIn("description", status)

    def test_api_inference_status_endpoint(self):
        """Verify that /api/inference/status returns 200 and valid JSON."""
        res = self.client.get("/api/inference/status")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("status", data)
        self.assertIn("backend", data)

    def test_desktop_open_file_endpoint(self):
        """Verify /api/desktop/open-file endpoint creates/finds file and attempts launch."""
        res = self.client.post("/api/desktop/open-file", json={"format": "docx"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertIn("opened_file", data)

    def test_desktop_reveal_folder_endpoint(self):
        """Verify /api/desktop/reveal-folder endpoint succeeds."""
        res = self.client.post("/api/desktop/reveal-folder")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertIn("folder", data)


if __name__ == "__main__":
    unittest.main()
