"""SCX-INJECTION-002: Command Injection.

Detects shell commands built dynamically (via f-strings, concatenation,
or template literals) and passed to os.system, subprocess, or Node's
child_process.exec - a classic command injection pattern when any part
of the command includes variable data.

The Python confirmation check runs against the full call text via
extract_call_text(), not just the anchor line, for the same reason as
SqlInjectionRule: a multi-line call like

    subprocess.run(
        f"ping -c 1 {hostname}", shell=True
    )

would otherwise be invisible to a purely line-based check.
"""

from __future__ import annotations

import re

from rules._common import extract_call_text, iter_line_matches
from sentricodex.models import Category, Confidence, Language, ParsedSource, RawMatch, Severity
from sentricodex.rule_base import Rule

_PYTHON_CALL_PATTERN = re.compile(r"\bos\.system\s*\(|\bsubprocess\.\w+\s*\(")
_PYTHON_DYNAMIC_PATTERN = re.compile(r"""f["']|["']\s*\+\s*\w|%\s*\w""")

_JS_CALL_PATTERN = re.compile(r"\bexec\s*\(\s*`")
_JS_DYNAMIC_PATTERN = re.compile(r"\$\{")


class CommandInjectionRule(Rule):
    rule_id = "SCX-INJECTION-002"
    title = "Potential Command Injection"
    category = Category.INJECTION
    severity = Severity.HIGH
    description = (
        "A system command appears to be built dynamically using variable "
        "data, which can allow attackers to inject arbitrary shell "
        "commands."
    )
    recommendation = (
        "Avoid building shell commands from variable input. Use argument "
        "lists (e.g. subprocess.run([cmd, arg1, arg2])) instead of "
        "shell strings, and validate/escape any unavoidable dynamic "
        "input."
    )
    supported_languages = frozenset(
        {Language.PYTHON, Language.JAVASCRIPT, Language.TYPESCRIPT}
    )

    def check(self, source: ParsedSource) -> list[RawMatch]:
        matches: list[RawMatch] = []

        if source.language is Language.PYTHON:
            matches.extend(self._check_python(source))
        else:
            matches.extend(self._check_javascript(source))

        return matches

    def _check_python(self, source: ParsedSource) -> list[RawMatch]:
        matches: list[RawMatch] = []
        for line_number, column, _match in iter_line_matches(
            source.lines, _PYTHON_CALL_PATTERN
        ):
            call_text = extract_call_text(source.lines, line_number)
            if _PYTHON_DYNAMIC_PATTERN.search(call_text):
                matches.append(self._build_match(line_number, column))
        return matches

    def _check_javascript(self, source: ParsedSource) -> list[RawMatch]:
        matches: list[RawMatch] = []
        for line_number, column, _match in iter_line_matches(
            source.lines, _JS_CALL_PATTERN
        ):
            call_text = extract_call_text(source.lines, line_number)
            if _JS_DYNAMIC_PATTERN.search(call_text):
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
