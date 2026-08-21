"""SCX-UNSAFE-004: Unsafe Deserialization via pickle.loads().

Detects use of Python's pickle.load()/loads(), which can execute
arbitrary code when deserializing untrusted data - a well-known
remote code execution vector.

This rule was added by following rules/README.md exactly, as a
verification that the contributor guide is accurate and the
extensibility mechanism genuinely requires no engine changes.
"""

from __future__ import annotations

import re

from rules._common import iter_line_matches
from sentricodex.models import Category, Confidence, Language, ParsedSource, RawMatch, Severity
from sentricodex.rule_base import Rule

_PATTERN = re.compile(r"pickle\.loads?\s*\(")


class PickleDeserializationRule(Rule):
    rule_id = "SCX-UNSAFE-004"
    title = "Unsafe Deserialization (pickle)"
    category = Category.UNSAFE_APIS
    severity = Severity.HIGH
    description = (
        "pickle.load()/loads() can execute arbitrary code when "
        "deserializing untrusted data."
    )
    recommendation = (
        "Use json or another safe serialization format for untrusted "
        "input. If pickle is unavoidable, never deserialize data from "
        "an untrusted source."
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
