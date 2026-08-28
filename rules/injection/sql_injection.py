"""SCX-INJECTION-001: SQL Injection via String Formatting.

Detects database .execute() calls whose query string appears to be
built via f-strings, % formatting, .format(), or concatenation instead
of parameterized placeholders - the classic SQL injection pattern.

Confirmation checks (SQL keyword present, dynamic build pattern
present) run against the full call text via extract_call_text(), not
just the anchor line - a call written across multiple lines, e.g.

    cursor.execute(
        f"SELECT * FROM users WHERE id = {user_id}"
    )

is otherwise invisible to a purely line-based check, since the SQL
keyword and the f-string prefix are on a different line than
".execute(". The finding is still reported at the anchor line/column
(where ".execute(" itself was found), matching where a developer would
actually look.
"""

from __future__ import annotations

import re

from rules._common import extract_call_text, iter_line_matches
from sentricodex.models import Category, Confidence, Language, ParsedSource, RawMatch, Severity
from sentricodex.rule_base import Rule

_EXECUTE_PATTERN = re.compile(r"\.execute\s*\(")
_SQL_KEYWORD_PATTERN = re.compile(
    r"(?i)\b(select|insert|update|delete)\b.*\b(from|into|table|set)\b"
)
_DYNAMIC_BUILD_PATTERN = re.compile(r"""f["']|\.format\(|["']\s*\+\s*\w|["']\s*%\s*[\w(]""")


class SqlInjectionRule(Rule):
    rule_id = "SCX-INJECTION-001"
    title = "Potential SQL Injection"
    category = Category.INJECTION
    severity = Severity.HIGH
    description = (
        "A SQL query appears to be built using string formatting or "
        "concatenation rather than parameterized placeholders, which can "
        "allow attackers to inject arbitrary SQL."
    )
    recommendation = (
        "Use parameterized queries (e.g. cursor.execute(query, params)) "
        "instead of building SQL strings with f-strings, % formatting, "
        "or concatenation."
    )
    supported_languages = frozenset({Language.PYTHON})

    def check(self, source: ParsedSource) -> list[RawMatch]:
        matches: list[RawMatch] = []

        for line_number, column, _match in iter_line_matches(
            source.lines, _EXECUTE_PATTERN
        ):
            call_text = extract_call_text(source.lines, line_number)

            if not _SQL_KEYWORD_PATTERN.search(call_text):
                continue
            if not _DYNAMIC_BUILD_PATTERN.search(call_text):
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
