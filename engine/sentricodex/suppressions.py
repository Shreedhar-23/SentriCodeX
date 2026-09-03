"""SentriCodeX source-code suppression comment handling.

Supported forms:
    # sentricodex: ignore SCX-RULE-ID
    // sentricodex: ignore SCX-RULE-ID
    <!-- sentricodex: ignore SCX-RULE-ID -->
    # sentricodex: ignore
    # sentricodex: ignore-file SCX-RULE-ID

Rule-specific suppression is preferred. A bare ``ignore`` suppresses all
findings on that source line. ``ignore-file`` suppresses the specified rule
for the entire file.
"""

from __future__ import annotations

import re

_MARKER_RE = re.compile(
    r"sentricodex\s*:\s*(?P<kind>ignore-file|ignore)"
    r"(?:\s+(?P<rule>[A-Za-z0-9_-]+))?",
    re.IGNORECASE,
)


def _matches_rule(rule: str | None, rule_id: str) -> bool:
    if rule is None:
        return True
    return rule.casefold() == rule_id.casefold()


def get_suppression(
    lines: list[str],
    finding_line: int,
    rule_id: str,
) -> tuple[str, str] | None:
    """Return suppression type and comment for a suppressed finding."""

    if finding_line < 1 or finding_line > len(lines):
        return None

    # File-level suppression.
    for line in lines:
        for match in _MARKER_RE.finditer(line):
            if (
                match.group("kind").casefold() == "ignore-file"
                and _matches_rule(match.group("rule"), rule_id)
            ):
                return ("file", line.strip())

    # Line-level suppression.
    source_line = lines[finding_line - 1]

    for match in _MARKER_RE.finditer(source_line):
        if (
            match.group("kind").casefold() == "ignore"
            and _matches_rule(match.group("rule"), rule_id)
        ):
            return ("line", source_line.strip())

    return None


def is_suppressed(
    lines: list[str],
    finding_line: int,
    rule_id: str,
) -> bool:
    """Backward-compatible boolean suppression check."""

    return get_suppression(lines, finding_line, rule_id) is not None