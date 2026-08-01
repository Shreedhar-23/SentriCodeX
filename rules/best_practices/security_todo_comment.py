"""SCX-BESTPRACTICE-001: Security-Related TODO/FIXME Comment.

Detects TODO or FIXME comments that also mention a security-relevant
keyword (security, vulnerable, insecure, unsafe, hack, exploit). These
are self-admitted, unresolved security concerns left in code - low
severity individually, but valuable to surface since they represent
known issues a team already knows about but hasn't fixed.
"""

from __future__ import annotations

import re

from rules._common import iter_line_matches
from sentricodex.models import Category, Confidence, Language, ParsedSource, RawMatch, Severity
from sentricodex.rule_base import Rule

_PATTERN = re.compile(
    r"(?:#|//|/\*|<!--).*\b(TODO|FIXME)\b.*\b"
    r"(security|vulnerable|insecure|unsafe|exploit|hack)\b",
    re.IGNORECASE,
)


class SecurityTodoCommentRule(Rule):
    rule_id = "SCX-BESTPRACTICE-001"
    title = "Security-Related TODO/FIXME Comment"
    category = Category.BEST_PRACTICES
    severity = Severity.INFORMATIONAL
    description = (
        "A TODO or FIXME comment references a known, unresolved security "
        "concern that has not yet been addressed."
    )
    recommendation = (
        "Track this as a proper issue/ticket and resolve it, rather than "
        "leaving a known security concern only as an inline comment."
    )
    supported_languages = frozenset(
        {
            Language.PYTHON,
            Language.JAVASCRIPT,
            Language.TYPESCRIPT,
            Language.REACT,
            Language.HTML,
            Language.CSS,
            Language.YAML,
            Language.DOCKERFILE,
        }
    )

    def check(self, source: ParsedSource) -> list[RawMatch]:
        matches: list[RawMatch] = []

        for line_number, column, _match in iter_line_matches(source.lines, _PATTERN):
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
