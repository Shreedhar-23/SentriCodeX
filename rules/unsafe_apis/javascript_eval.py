"""SCX-UNSAFE-002: Use of eval() in JavaScript/TypeScript.

Detects calls to JavaScript's eval(), which executes arbitrary code
from a string and is a well-known source of code injection
vulnerabilities.
"""

from __future__ import annotations

import re

from rules._common import iter_line_matches
from sentricodex.models import Category, Confidence, Language, ParsedSource, RawMatch, Severity
from sentricodex.rule_base import Rule

_PATTERN = re.compile(r"(?<![\w.])eval\s*\(")


class JavaScriptEvalRule(Rule):
    rule_id = "SCX-UNSAFE-002"
    title = "Use of eval()"
    category = Category.UNSAFE_APIS
    severity = Severity.HIGH
    description = (
        "eval() executes arbitrary JavaScript from a string, which is a "
        "well-known source of code injection vulnerabilities."
    )
    recommendation = (
        "Avoid eval() entirely. Use JSON.parse() for parsing data, or "
        "restructure the logic to avoid dynamic code execution."
    )
    supported_languages = frozenset(
        {Language.JAVASCRIPT, Language.TYPESCRIPT, Language.REACT}
    )

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
