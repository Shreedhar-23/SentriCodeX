"""SCX-CRYPTO-001: Weak Hash Algorithm.

Detects use of MD5 or SHA-1, both of which are cryptographically broken
for security purposes (collision attacks are practical) even though
they remain fine for non-security checksums.
"""

from __future__ import annotations

import re

from rules._common import iter_line_matches
from sentricodex.models import Category, Confidence, Language, ParsedSource, RawMatch, Severity
from sentricodex.rule_base import Rule

_PYTHON_PATTERN = re.compile(r"hashlib\.(md5|sha1)\s*\(")
_JS_PATTERN = re.compile(r"""createHash\s*\(\s*["'](md5|sha1)["']\s*\)""")


class WeakHashAlgorithmRule(Rule):
    rule_id = "SCX-CRYPTO-001"
    title = "Weak Hash Algorithm"
    category = Category.CRYPTOGRAPHY
    severity = Severity.MEDIUM
    description = (
        "MD5 and SHA-1 are cryptographically broken and unsuitable for "
        "security purposes such as password hashing, digital signatures, "
        "or integrity verification against a malicious actor."
    )
    recommendation = (
        "Use SHA-256 or SHA-3 for general hashing, or a dedicated "
        "password-hashing algorithm (bcrypt, scrypt, or Argon2) for "
        "storing passwords."
    )
    supported_languages = frozenset(
        {Language.PYTHON, Language.JAVASCRIPT, Language.TYPESCRIPT}
    )

    def check(self, source: ParsedSource) -> list[RawMatch]:
        pattern = (
            _PYTHON_PATTERN if source.language is Language.PYTHON else _JS_PATTERN
        )
        matches: list[RawMatch] = []

        for line_number, column, _match in iter_line_matches(source.lines, pattern):
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
