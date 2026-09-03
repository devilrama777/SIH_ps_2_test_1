import ast
import operator
import re
from typing import Any, Dict, List, Optional, Union


# Safe arithmetic operators mapping
SAFE_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}


def safe_eval_expr(expr_str: str, context: Optional[Dict[str, float]] = None) -> Union[int, float]:
    """Safely evaluates arithmetic expressions with optional variable substitution."""
    cleaned = expr_str.replace(",", "").replace("$", "").replace("%", "").strip()
    node = ast.parse(cleaned, mode="eval")
    ctx = context or {}

    def _eval(current_node):
        if isinstance(current_node, ast.Expression):
            return _eval(current_node.body)
        elif isinstance(current_node, ast.Constant):
            if isinstance(current_node.value, (int, float)):
                return current_node.value
            raise ValueError(f"Unsupported constant type: {type(current_node.value)}")
        elif isinstance(current_node, ast.Name):
            var_name = current_node.id
            if var_name in ctx:
                return ctx[var_name]
            # If not in context, it's a symbolic variable
            raise NameError(f"Variable '{var_name}' identified (symbolic relationship)")
        elif isinstance(current_node, ast.BinOp):
            op_type = type(current_node.op)
            if op_type not in SAFE_OPERATORS:
                raise ValueError(f"Unsupported operator: {op_type}")
            left = _eval(current_node.left)
            right = _eval(current_node.right)
            return SAFE_OPERATORS[op_type](left, right)
        elif isinstance(current_node, ast.UnaryOp):
            op_type = type(current_node.op)
            if op_type not in SAFE_OPERATORS:
                raise ValueError(f"Unsupported unary operator: {op_type}")
            operand = _eval(current_node.operand)
            return SAFE_OPERATORS[op_type](operand)
        else:
            raise ValueError(f"Unsupported expression node: {type(current_node)}")

    return _eval(node)


class MathEngine:
    """Deterministic mathematical calculation and verification engine."""

    @staticmethod
    def extract_math_flags(text: str) -> List[Dict[str, str]]:
        """Extracts [MATH_CHECK: description | formula: expr] patterns from text."""
        pattern = r"\[MATH_CHECK:\s*([^\|]+?)\s*\|\s*formula:\s*([^\]]+)\]"
        matches = re.findall(pattern, text, re.IGNORECASE)
        flags = []
        for desc, formula in matches:
            flags.append({
                "description": desc.strip(),
                "formula": formula.strip()
            })
        return flags

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
            # Symbolic formula / algebraic relationship
            return {
                "formula": formula_str,
                "calculated": "Symbolic Formula",
                "valid": True,
                "status": "FORMULA_RELATIONSHIP"
            }
        except Exception as err:
            return {
                "formula": formula_str,
                "error": str(err),
                "valid": False,
                "status": "ERROR"
            }

    @classmethod
    def process_math_checks(
        cls,
        analysis_text: str,
        custom_calculations: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Runs verification on all flagged math checks and optional user-provided calculations."""
        extracted_flags = cls.extract_math_flags(analysis_text)
        results = []

        # Process extracted flags
        for item in extracted_flags:
            formula = item["formula"]
            expected = None

            # If formula contains an equals sign (e.g. '100 + 50 = 150')
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

        # Process user-defined custom calculations
        if custom_calculations:
            for calc in custom_calculations:
                label = calc.get("label", "Custom Calculation")
                formula = calc.get("formula", "")
                expected = calc.get("expected")
                if formula:
                    eval_res = cls.verify_expression(formula, expected_val=expected)
                    eval_res["description"] = label
                    results.append(eval_res)

        # Generate Markdown audit section
        md_table = cls._generate_markdown_audit_table(results)

        return {
            "total_checks": len(results),
            "results": results,
            "audit_markdown": md_table
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
