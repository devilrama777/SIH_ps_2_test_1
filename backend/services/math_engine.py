import math
import re
from typing import Any, Dict, List, Optional, Union
import numpy as np
import pandas as pd


def safe_eval_expr(expr_str: str, context: Optional[Dict[str, float]] = None) -> Union[int, float]:
    """Safely evaluates arithmetic expressions using mathematical parsing."""
    cleaned = expr_str.replace(",", "").replace("$", "").replace("%", "").strip()
    # If variables exist, substitute from context
    ctx = context or {}
    for var_name, var_val in ctx.items():
        cleaned = re.sub(rf"\b{var_name}\b", str(var_val), cleaned)

    # Check for unauthorized characters
    if not re.match(r"^[\d\.\s\+\-\*\/\(\)\^\%]+$", cleaned):
        if re.search(r"[a-zA-Z_]", cleaned):
            raise NameError("Symbolic variables detected in mathematical relationship.")
        raise ValueError(f"Invalid characters in mathematical expression: '{expr_str}'")

    expr_eval = cleaned.replace("^", "**")
    # Evaluate with restricted globals/locals for absolute safety
    val = eval(expr_eval, {"__builtins__": None, "math": math}, {})
    if isinstance(val, (int, float)):
        return float(val)
    raise ValueError("Expression did not resolve to a numeric value.")


class MathEngine:
    """Deterministic mathematical calculation and verification engine using Pandas & NumPy."""

    @staticmethod
    def audit_dataframe(df: pd.DataFrame, target_col: str = "production", dispatch_col: str = "dispatch") -> Dict[str, Any]:
        """Performs vectorized mathematical reconciliation across colliery tabular records."""
        if df.empty:
            return {"valid": True, "total_production": 0.0, "total_dispatch": 0.0, "offtake_ratio": 0.0}

        numeric_cols = df.select_dtypes(include=[np.number]).columns
        p_col = target_col if target_col in df.columns else (numeric_cols[0] if len(numeric_cols) > 0 else None)
        d_col = dispatch_col if dispatch_col in df.columns else (numeric_cols[1] if len(numeric_cols) > 1 else None)

        tot_p = float(df[p_col].sum()) if p_col else 0.0
        tot_d = float(df[d_col].sum()) if d_col else 0.0
        offtake = round((tot_d / tot_p * 100.0), 2) if tot_p > 0 else 0.0

        return {
            "record_count": len(df),
            "total_production": round(tot_p, 2),
            "total_dispatch": round(tot_d, 2),
            "offtake_ratio": offtake,
            "variance": round(tot_p - tot_d, 2),
            "valid": True
        }

    @staticmethod
    def extract_math_flags(text: str) -> List[Dict[str, str]]:
        """Extracts [MATH_CHECK: description | formula: expr] patterns from text."""
        pattern = r"\[MATH_CHECK:\s*([^\|]+?)\s*\|\s*formula:\s*([^\]]+)\]"
        matches = re.findall(pattern, text, re.IGNORECASE)
        return [{"description": d.strip(), "formula": f.strip()} for d, f in matches]

    @classmethod
    def verify_expression(
        cls,
        formula_str: str,
        expected_val: Optional[float] = None,
        context: Optional[Dict[str, float]] = None,
        tolerance: float = 1e-4
    ) -> Dict[str, Any]:
        """Evaluates a formula and compares it to an expected value if provided."""
        try:
            calculated_val = safe_eval_expr(formula_str, context=context)
            result: Dict[str, Any] = {
                "formula": formula_str,
                "calculated": round(float(calculated_val), 4),
                "valid": True
            }
            if expected_val is not None:
                delta = abs(calculated_val - expected_val)
                passed = delta <= tolerance
                result["expected"] = expected_val
                result["delta"] = round(delta, 4)
                result["status"] = "VERIFIED" if passed else "DISCREPANCY_DETECTED"
            else:
                result["status"] = "COMPUTED"
            return result
        except NameError:
            return {"formula": formula_str, "calculated": "Symbolic Formula", "valid": True, "status": "FORMULA_RELATIONSHIP"}
        except Exception as err:
            return {"formula": formula_str, "error": str(err), "valid": False, "status": "ERROR"}

    @classmethod
    def process_math_checks(
        cls,
        analysis_text: str,
        custom_calculations: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Runs verification on flagged math checks and custom calculations."""
        extracted_flags = cls.extract_math_flags(analysis_text)
        results = []

        for item in extracted_flags:
            formula = item["formula"]
            expected = None
            if "=" in formula:
                parts = formula.split("=")
                formula_part = parts[0].strip()
                try:
                    expected = float(parts[1].replace(",", "").replace("$", "").strip())
                    eval_res = cls.verify_expression(formula_part, expected_val=expected)
                except Exception:
                    eval_res = cls.verify_expression(formula_part)
            else:
                eval_res = cls.verify_expression(formula)
            eval_res["description"] = item["description"]
            results.append(eval_res)

        if custom_calculations:
            for calc in custom_calculations:
                label = calc.get("label", "Custom Calculation")
                formula = calc.get("formula", "")
                expected = calc.get("expected")
                if formula:
                    eval_res = cls.verify_expression(formula, expected_val=expected)
                    eval_res["description"] = label
                    results.append(eval_res)

        return {
            "total_checks": len(results),
            "results": results,
            "audit_markdown": cls._generate_markdown_audit_table(results)
        }

    @staticmethod
    def _generate_markdown_audit_table(results: List[Dict[str, Any]]) -> str:
        """Formats math verification outcomes into a clean Markdown table."""
        if not results:
            return "\n*No mathematical calculations were requested. Zero calculations performed by default.*\n"

        lines = [
            "\n### Mathematical & Quantitative Audit Table\n",
            "| Description | Formula / Expression | Expected | Calculated | Status |",
            "| :--- | :--- | :--- | :--- | :--- |"
        ]
        for r in results:
            desc = r.get("description", "N/A")
            formula = f"`{r.get('formula', '')}`"
            expected = str(r.get("expected", "-"))
            calc_val = str(r.get("calculated", r.get("error", "Error")))
            status = r.get("status", "COMPUTED")
            icon = "✅ " if status in ["VERIFIED", "COMPUTED"] else "⚠️ "
            lines.append(f"| {desc} | {formula} | {expected} | {calc_val} | {icon}{status} |")

        return "\n".join(lines) + "\n\n"
