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


def is_suppressed(lines: list[str], finding_line: int, rule_id: str) -> bool:
    """Return True when a finding is suppressed by an inline/file comment.

    ``finding_line`` is one-based, matching RawMatch/normalized Finding lines.
    Invalid/out-of-range line numbers simply produce no suppression.
    """
    if finding_line < 1 or finding_line > len(lines):
        return False

    # File-level suppression: a matching ignore-file marker anywhere in the
    # source applies to the complete file.
    for line in lines:
        for match in _MARKER_RE.finditer(line):
            if match.group("kind").casefold() == "ignore-file" and _matches_rule(
                match.group("rule"), rule_id
            ):
                return True

    # Inline suppression: only the finding's own source line is affected.
    source_line = lines[finding_line - 1]
    for match in _MARKER_RE.finditer(source_line):
        if match.group("kind").casefold() == "ignore" and _matches_rule(
            match.group("rule"), rule_id
        ):
            return True

    return False
