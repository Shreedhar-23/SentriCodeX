"""SCX-UNSAFE-003: subprocess shell=True.

Detects the shell=True argument to Python's subprocess functions,
listed explicitly as an Unsafe API example in the rule specification.
Using shell=True invokes a system shell to interpret the command,
which significantly widens the attack surface even when the command
itself looks static today.
"""

from __future__ import annotations

import re

from rules._common import iter_line_matches
from sentricodex.models import Category, Confidence, Language, ParsedSource, RawMatch, Severity
from sentricodex.rule_base import Rule

_PATTERN = re.compile(r"shell\s*=\s*True")


class ShellTrueRule(Rule):
    rule_id = "SCX-UNSAFE-003"
    title = "subprocess shell=True"
    category = Category.UNSAFE_APIS
    severity = Severity.MEDIUM
    description = (
        "shell=True causes subprocess to invoke a system shell to "
        "interpret the command, which significantly widens the attack "
        "surface if any part of the command is influenced by external "
        "input."
    )
    recommendation = (
        "Avoid shell=True. Pass the command as a list of arguments "
        "(e.g. subprocess.run(['ls', '-l'])) so no shell interpretation "
        "occurs."
    )
    supported_languages = frozenset({Language.PYTHON})

    def check(self, source: ParsedSource) -> list[RawMatch]:
        matches: list[RawMatch] = []

        for line_number, column, _match in iter_line_matches(source.lines, _PATTERN):
            matches.append(
                RawMatch(
                    rule_id=self.rule_id,
                    title=self.title,
                    severity=self.severity,
                    confidence=Confidence.HIGH,
                    category=self.category,
                    description=self.description,
                    recommendation=self.recommendation,
                    line=line_number,
                    column=column,
                )
            )

        return matches
