"""SCX-SECRET-002: Hardcoded API Key or Secret Token.

Detects string literals assigned to variables named like API keys,
access tokens, or client secrets - the same risk pattern as hardcoded
passwords, but for the credential types most commonly leaked in public
repositories and commit history.
"""

from __future__ import annotations

import re

from rules._common import iter_line_matches
from sentricodex.models import Category, Confidence, Language, ParsedSource, RawMatch, Severity
from sentricodex.rule_base import Rule

_PATTERN = re.compile(
    r'(?i)\b(api[_-]?key|secret[_-]?key|access[_-]?token|auth[_-]?token|'
    r'client[_-]?secret)\b\s*[:=]\s*["\']([^"\']{6,})["\']'
)

_ENV_INDICATORS = ("os.environ", "process.env", "getenv", "env.get")

_PLACEHOLDER_VALUES = {
    "your-api-key",
    "your_api_key",
    "changeme",
    "placeholder",
    "xxxxxxxx",
    "<api-key>",
    "example",
}


class HardcodedApiKeyRule(Rule):
    rule_id = "SCX-SECRET-002"
    title = "Hardcoded API Key or Secret Token"
    category = Category.SECRETS
    severity = Severity.CRITICAL
    description = (
        "An API key, access token, or client secret appears to be "
        "hardcoded directly in source code."
    )
    recommendation = (
        "Remove the hardcoded credential and load it from an environment "
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
