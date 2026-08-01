"""Internal helper shared by rule implementations.

Not a rule itself (hence the leading underscore) - just removes
repetitive regex-scanning boilerplate from every concrete rule module.
"""

from __future__ import annotations

import re
from collections.abc import Iterator


def iter_line_matches(
    lines: list[str], pattern: re.Pattern[str]
) -> Iterator[tuple[int, int, re.Match[str]]]:
    """Yields (line_number, column, match) for the first match of
    pattern on each line that contains one. Line numbers are 1-indexed
    to match editor conventions; columns are 1-indexed match start
    positions.
    """
    for line_number, line in enumerate(lines, start=1):
        match = pattern.search(line)
        if match:
            yield line_number, match.start() + 1, match
