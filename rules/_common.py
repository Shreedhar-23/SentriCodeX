"""Internal helper shared by rule implementations.

Not a rule itself (hence the leading underscore) - removes repetitive
regex-scanning boilerplate from individual rule modules.
"""

from __future__ import annotations

import re
from collections.abc import Iterator

# Bound on how far extract_call_text() will look ahead for a balanced
# closing parenthesis. Prevents a rule from scanning an entire large
# file if a call is somehow never closed (e.g. a parsing edge case) -
# no realistic function call spans more than this many lines.
_MAX_CALL_LOOKAHEAD_LINES = 20


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


def extract_call_text(lines: list[str], line_number: int) -> str:
    """Returns the text of the full call/statement starting at
    line_number, extending forward until parentheses opened on or
    after that line become balanced.

    Why this exists: a rule like SqlInjectionRule finds its anchor
    pattern (e.g. ".execute(") on one line via iter_line_matches, then
    needs to check secondary conditions (does this query contain a SQL
    keyword? is it built dynamically?) against the *complete* call -
    which, for a call written across multiple lines for readability
    (a common, idiomatic style), is not fully present on the anchor
    line alone. Checking only that single line makes such calls
    invisible to the rule - a real false negative, not a theoretical
    one. This helper widens what the confirmation checks see, while
    callers still report the finding at the anchor's own precise
    line/column, which is where a developer would actually look.

    Limitation: paren-counting here is deliberately simple - it does
    not parse string literals, so a single unbalanced parenthesis
    character inside a string within the call could throw off the
    boundary. This is rare for the SQL/shell-command strings these
    rules inspect. If no balanced close is found within
    _MAX_CALL_LOOKAHEAD_LINES, the accumulated window text is returned
    as-is rather than raising, so callers always get a usable string.
    """
    start_idx = line_number - 1
    end_idx = min(len(lines), start_idx + _MAX_CALL_LOOKAHEAD_LINES)
    window_lines = lines[start_idx:end_idx]
    window_text = "\n".join(window_lines)

    first_paren = window_text.find("(")
    if first_paren == -1:
        return window_lines[0] if window_lines else ""

    depth = 0
    for index, char in enumerate(window_text[first_paren:], start=first_paren):
        if char == "(":
            depth += 1
        elif char == ")":
            depth -= 1
            if depth == 0:
                return window_text[: index + 1]

    # No balanced close found within the lookahead window - return
    # what we accumulated rather than nothing, so confirmation checks
    # still have a chance to match against real content.
    return window_text
