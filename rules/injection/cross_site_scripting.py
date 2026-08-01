"""SCX-INJECTION-003: Cross-Site Scripting (XSS).

Detects two common unsafe DOM-injection patterns:
    - Assigning to `.innerHTML` with a non-literal (variable) value.
    - React's `dangerouslySetInnerHTML`, which is unsafe by design
      unless the content is explicitly sanitized.
"""

from __future__ import annotations

import re

from rules._common import iter_line_matches
from sentricodex.models import Category, Confidence, Language, ParsedSource, RawMatch, Severity
from sentricodex.rule_base import Rule

_INNER_HTML_PATTERN = re.compile(r'\.innerHTML\s*=\s*(?!["\']|`[^$]*`\s*;?\s*$)')
_DANGEROUS_HTML_PATTERN = re.compile(r"dangerouslySetInnerHTML")


class CrossSiteScriptingRule(Rule):
    rule_id = "SCX-INJECTION-003"
    title = "Potential Cross-Site Scripting (XSS)"
    category = Category.INJECTION
    severity = Severity.MEDIUM
    description = (
        "Content appears to be inserted into the DOM without sanitization, "
        "which can allow attackers to inject and execute arbitrary "
        "scripts (XSS)."
    )
    recommendation = (
        "Avoid assigning untrusted data directly to innerHTML or "
        "dangerouslySetInnerHTML. Use textContent for plain text, or "
        "sanitize HTML with a trusted library before insertion."
    )
    supported_languages = frozenset(
        {Language.JAVASCRIPT, Language.TYPESCRIPT, Language.REACT, Language.HTML}
    )

    def check(self, source: ParsedSource) -> list[RawMatch]:
        matches: list[RawMatch] = []

        for line_number, column, _match in iter_line_matches(
            source.lines, _INNER_HTML_PATTERN
        ):
            matches.append(self._build_match(line_number, column))

        for line_number, column, _match in iter_line_matches(
            source.lines, _DANGEROUS_HTML_PATTERN
        ):
            matches.append(self._build_match(line_number, column))

        return matches

    def _build_match(self, line_number: int, column: int) -> RawMatch:
        return RawMatch(
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
