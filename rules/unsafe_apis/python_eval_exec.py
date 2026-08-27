"""SCX-UNSAFE-001: Use of eval()/exec() in Python.

AST-based (upgraded from regex): walks the actual parsed syntax tree,
so text that merely *mentions* eval/exec - inside a comment, a string
literal, or as part of another identifier like `evaluate()` - is never
flagged. Regex could only match text; it had no way to distinguish
"the code calls eval()" from "a comment talks about eval()". AST
detection makes that distinction for free, because a comment or string
literal was never a Call node to begin with.
"""

from __future__ import annotations

from rules._ast_common import SourceSyntaxError, iter_direct_call_nodes, parse_python_ast
from sentricodex.models import Category, Confidence, Language, ParsedSource, RawMatch, Severity
from sentricodex.rule_base import Rule

_TARGET_FUNCTIONS = frozenset({"eval", "exec"})


class PythonEvalExecRule(Rule):
    rule_id = "SCX-UNSAFE-001"
    title = "Use of eval()/exec()"
    category = Category.UNSAFE_APIS
    severity = Severity.HIGH
    description = (
        "eval() or exec() executes arbitrary code from a string, which is "
        "a common source of remote code execution if any part of the "
        "input is influenced by external data."
    )
    recommendation = (
        "Avoid eval()/exec() entirely where possible. Use safer "
        "alternatives such as ast.literal_eval() for parsing literals, "
        "or an explicit dispatch table instead of dynamic code execution."
    )
    supported_languages = frozenset({Language.PYTHON})

    def check(self, source: ParsedSource) -> list[RawMatch]:
        try:
            tree = parse_python_ast(source.content)
        except SourceSyntaxError:
            # A file with invalid Python syntax has bigger problems
            # than this rule can report on - stay silent rather than
            # guessing at line-based matches in broken source.
            return []

        matches: list[RawMatch] = []
        for call_node in iter_direct_call_nodes(tree, _TARGET_FUNCTIONS):
            matches.append(
                RawMatch(
                    rule_id=self.rule_id,
                    title=self.title,
                    severity=self.severity,
                    confidence=Confidence.HIGH,
                    category=self.category,
                    description=self.description,
                    recommendation=self.recommendation,
                    line=call_node.lineno,
                    column=call_node.col_offset + 1,
                )
            )
        return matches
