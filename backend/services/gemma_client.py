import logging
from typing import Any, Dict, Optional
import requests
from backend import config

logger = logging.getLogger("gemma_client")


class GemmaClient:
    """Client for generating the final polished, systematic report using Gemma."""

    def __init__(
        self,
        base_url: str = config.OLLAMA_BASE_URL,
        primary_model: str = config.GEMMA_MODEL,
        fallback_model: str = config.GEMMA_FALLBACK_MODEL
    ):
        self.base_url = base_url.rstrip("/")
        self.primary_model = primary_model
        self.fallback_model = fallback_model

    def get_effective_model(self) -> str:
        """Determines if the primary Gemma model is installed, or falls back to installed model."""
        try:
            res = requests.get(f"{self.base_url}/api/tags", timeout=5)
            if res.status_code == 200:
                models = [m.get("name") for m in res.json().get("models", [])]
                for m in models:
                    if "gemma" in m.lower():
                        return m
            return self.fallback_model
        except Exception:
            return self.fallback_model

    def generate_systematic_report(
        self,
        llama_analysis: str,
        math_audit_markdown: str,
        custom_instructions: Optional[str] = None,
        model_override: Optional[str] = None
    ) -> Dict[str, Any]:
        """Synthesizes the analytical extraction and math checks into a systematic, polished report."""
        target_model = model_override or self.get_effective_model()

        # Load system report prompt
        prompt_path = config.PROMPTS_DIR / "gemma_report_prompt.txt"
        system_prompt = prompt_path.read_text(encoding="utf-8") if prompt_path.exists() else (
            "You are a professional intelligence report author. Format this analysis into a systematic executive report in Markdown."
        )

        if custom_instructions and custom_instructions.strip():
            system_prompt += f"\n\n### ADDITIONAL REPORTING DIRECTIVES:\n{custom_instructions.strip()}\n"

        user_content = (
            "# STAGE 1 FINDINGS (FROM LLAMA 3.1 REASONING ENGINE):\n\n"
            f"{llama_analysis}\n\n"
            "---\n\n"
            "# STAGE 2 VERIFIED QUANTITATIVE & MATHEMATICAL AUDIT:\n\n"
            f"{math_audit_markdown}\n\n"
            "---\n\n"
            "Please generate the complete, high-quality, systematic final report in clean Markdown."
        )

        payload = {
            "model": target_model,
            "prompt": user_content,
            "system": system_prompt,
            "stream": False,
            "options": {
                "temperature": 0.3,
                "num_ctx": 32768
            }
        }

        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=config.LLM_TIMEOUT
            )
            response.raise_for_status()
            res_json = response.json()
            report_text = res_json.get("response", "")

            return {
                "success": True,
                "model_used": target_model,
                "final_report": report_text,
                "total_duration_ms": res_json.get("total_duration", 0) // 1_000_000,
                "eval_count": res_json.get("eval_count", 0)
            }
        except requests.exceptions.RequestException as err:
            logger.error(f"Gemma report generation failed: {err}")
            return {
                "success": False,
                "error": f"Report generation error: {str(err)}",
                "final_report": ""
            }
