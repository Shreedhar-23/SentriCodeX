"""SCX-SECRET-003: Private Key in Source.

Detects PEM-format private key headers (RSA, EC, OpenSSH, or generic
PKCS#8) committed directly into a source file. This is one of the
highest-confidence, highest-severity findings possible: there is no
legitimate reason for private key material to live in a source
repository.
"""

from __future__ import annotations

import re

from rules._common import iter_line_matches
from sentricodex.models import Category, Confidence, Language, ParsedSource, RawMatch, Severity
from sentricodex.rule_base import Rule

_PATTERN = re.compile(r"-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----")


class PrivateKeyInSourceRule(Rule):
    rule_id = "SCX-SECRET-003"
    title = "Private Key Committed to Source"
    category = Category.SECRETS
    severity = Severity.CRITICAL
    description = (
        "A PEM-format private key appears to be committed directly into "
        "source code."
    )
    recommendation = (
        "Remove the private key from source control immediately, rotate "
        "the key, and load key material from a secure secrets manager or "
        "mounted volume instead."
    )
    supported_languages = frozenset(
        {
            Language.PYTHON,
            Language.JAVASCRIPT,
            Language.TYPESCRIPT,
            Language.REACT,
            Language.HTML,
            Language.CSS,
            Language.JSON,
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
                    confidence=Confidence.HIGH,
                    category=self.category,
                    description=self.description,
                    recommendation=self.recommendation,
                    line=line_number,
                    column=column,
                )
            )

        return matches
