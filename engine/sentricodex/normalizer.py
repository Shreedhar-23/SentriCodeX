"""Finding normalization.

Responsibility:
    - Convert a rule's raw, file-agnostic RawMatch results into complete
      Finding objects that include the file path and a stable
      fingerprint hash.

The fingerprint is derived from (rule_id, file, line, column) so that
future phases (scan history, diffing between scans) can reliably tell
whether a finding on a later scan is "the same issue" as one seen
before, even if unrelated findings elsewhere in the file shifted.
"""

from __future__ import annotations

import hashlib
from pathlib import Path

from sentricodex.models import Finding, RawMatch

_FINGERPRINT_LENGTH = 16


class FindingNormalizer:
    """Normalizes RawMatch results into reportable Findings."""

    def normalize(self, file_path: Path, raw_matches: list[RawMatch]) -> list[Finding]:
        return [self._to_finding(file_path, match) for match in raw_matches]

    def _to_finding(self, file_path: Path, match: RawMatch) -> Finding:
        fingerprint = self._fingerprint(
            match.rule_id, file_path, match.line, match.column
        )
        return Finding(
            rule_id=match.rule_id,
            title=match.title,
            severity=match.severity,
            confidence=match.confidence,
            category=match.category,
            file=str(file_path),
            line=match.line,
            column=match.column,
            description=match.description,
            recommendation=match.recommendation,
            fingerprint=fingerprint,
        )

    @staticmethod
    def _fingerprint(rule_id: str, file_path: Path, line: int, column: int) -> str:
        raw = f"{rule_id}:{file_path}:{line}:{column}"
        digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()
        return digest[:_FINGERPRINT_LENGTH]
