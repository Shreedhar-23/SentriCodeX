"""SCX-UNSAFE-001: Use of eval()/exec() in Python.

Detects calls to Python's built-in eval() or exec(), which execute
arbitrary code from a string and are a common source of remote code
execution vulnerabilities when the argument includes any external
input.
"""

from __future__ import annotations

import re

from rules._common import iter_line_matches
from sentricodex.models import Category, Confidence, Language, ParsedSource, RawMatch, Severity
from sentricodex.rule_base import Rule

_PATTERN = re.compile(r"(?<![\w.])(eval|exec)\s*\(")


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
        matches: list[RawMatch] = []

        for line_number, column, _match in iter_line_matches(source.lines, _PATTERN):
            matches.append(
                RawMatch(
                    rule_id=self.rule_id,
                    title=self.title,
                    severity=self.severity,
                    confidence=Confidence.HIGH,
                    category=self.category,
                    description=self.description,
                    recommendation=self.recommendation,
                    line=line_number,
                    column=column,
                )
            )

        return matches
