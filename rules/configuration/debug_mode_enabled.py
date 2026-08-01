"""SCX-CONFIG-001: Debug Mode Enabled.

Detects debug mode explicitly enabled in Python source (e.g. Django's
DEBUG = True, or Flask's app.run(debug=True)) or in JSON/YAML
configuration files. Debug mode in production commonly exposes stack
traces, environment variables, and internal application state to
attackers.
"""

from __future__ import annotations

import re

from rules._common import iter_line_matches
from sentricodex.models import Category, Confidence, Language, ParsedSource, RawMatch, Severity
from sentricodex.rule_base import Rule

_PYTHON_PATTERN = re.compile(r"(?i)\bDEBUG\s*=\s*True\b|debug\s*=\s*True")
_CONFIG_PATTERN = re.compile(r'(?i)["\']?debug["\']?\s*:\s*true\b')


class DebugModeEnabledRule(Rule):
    rule_id = "SCX-CONFIG-001"
    title = "Debug Mode Enabled"
    category = Category.CONFIGURATION
    severity = Severity.MEDIUM
    description = (
        "Debug mode appears to be explicitly enabled. In production, "
        "debug mode commonly exposes stack traces, source code, and "
        "environment details to attackers."
    )
    recommendation = (
        "Ensure debug mode is disabled in production, and control it via "
        "an environment variable rather than a hardcoded value."
    )
    supported_languages = frozenset(
        {Language.PYTHON, Language.JSON, Language.YAML}
    )

    def check(self, source: ParsedSource) -> list[RawMatch]:
        pattern = (
            _PYTHON_PATTERN if source.language is Language.PYTHON else _CONFIG_PATTERN
        )
        matches: list[RawMatch] = []

        for line_number, column, _match in iter_line_matches(source.lines, pattern):
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
