"""SCX-CRYPTO-002: Insecure Randomness.

Detects use of Python's `random` module, which is not cryptographically
secure and must never be used to generate tokens, passwords, session
IDs, or any other security-sensitive value.

This rule uses LOW confidence deliberately: `random` is completely fine
for non-security purposes (shuffling a game deck, sampling test data),
so a raw usage match alone is a weak signal. It is included specifically
to demonstrate honest use of the Confidence field - not every match
should be treated as equally certain.
"""

from __future__ import annotations

import re

from rules._common import iter_line_matches
from sentricodex.models import Category, Confidence, Language, ParsedSource, RawMatch, Severity
from sentricodex.rule_base import Rule

_PATTERN = re.compile(r"\brandom\.(random|randint|choice|randrange|uniform)\s*\(")


class InsecureRandomnessRule(Rule):
    rule_id = "SCX-CRYPTO-002"
    title = "Potentially Insecure Randomness"
    category = Category.CRYPTOGRAPHY
    severity = Severity.LOW
    description = (
        "Python's random module is not cryptographically secure. If this "
        "value is used for a token, password, session ID, or any other "
        "security-sensitive purpose, it can be predicted by an attacker."
    )
    recommendation = (
        "If this value is security-sensitive, use the `secrets` module "
        "(e.g. secrets.token_hex()) instead of `random`. If it is not "
        "security-sensitive (e.g. sampling test data), this finding can "
        "be safely dismissed."
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
                    confidence=Confidence.LOW,
                    category=self.category,
                    description=self.description,
                    recommendation=self.recommendation,
                    line=line_number,
                    column=column,
                )
            )

        return matches
