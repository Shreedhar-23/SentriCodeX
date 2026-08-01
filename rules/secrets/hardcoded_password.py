"""SCX-SECRET-001: Hardcoded Password.

Detects string literals assigned to variables named like passwords,
which strongly suggests a credential committed directly into source
control rather than loaded from a secret store or environment variable.
"""

from __future__ import annotations

import re

from rules._common import iter_line_matches
from sentricodex.models import Category, Confidence, Language, ParsedSource, RawMatch, Severity
from sentricodex.rule_base import Rule

_PATTERN = re.compile(
    r'(?i)\b(password|passwd|pwd)\b\s*[:=]\s*["\']([^"\']{3,})["\']'
)

_ENV_INDICATORS = ("os.environ", "process.env", "getenv", "env.get")

_PLACEHOLDER_VALUES = {
    "changeme",
    "change_me",
    "password",
    "xxxxxxxx",
    "<password>",
    "your_password",
    "your-password",
    "placeholder",
}


class HardcodedPasswordRule(Rule):
    rule_id = "SCX-SECRET-001"
    title = "Hardcoded Password"
    category = Category.SECRETS
    severity = Severity.CRITICAL
    description = (
        "A password appears to be hardcoded directly in source code as a "
        "string literal."
    )
    recommendation = (
        "Remove the hardcoded password and load it from an environment "
        "variable or a dedicated secrets manager instead."
    )
    supported_languages = frozenset(
        {
            Language.PYTHON,
            Language.JAVASCRIPT,
            Language.TYPESCRIPT,
            Language.REACT,
            Language.JSON,
            Language.YAML,
        }
    )

    def check(self, source: ParsedSource) -> list[RawMatch]:
        matches: list[RawMatch] = []

        for line_number, column, match in iter_line_matches(source.lines, _PATTERN):
            line = source.lines[line_number - 1]

            if any(indicator in line for indicator in _ENV_INDICATORS):
                continue

            value = match.group(2).strip().lower()
            if value in _PLACEHOLDER_VALUES:
                continue

            matches.append(
                RawMatch(
                    rule_id=self.rule_id,
                    title=self.title,
                    severity=self.severity,
                    confidence=Confidence.MEDIUM,
                    category=self.category,
                    description=self.description,
                    recommendation=self.recommendation,
                    line=line_number,
                    column=column,
                )
            )

        return matches
