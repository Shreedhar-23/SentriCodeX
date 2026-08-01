"""Tests for sentricodex.normalizer.FindingNormalizer."""

from __future__ import annotations

from pathlib import Path

from sentricodex.models import Category, Confidence, RawMatch, Severity
from sentricodex.normalizer import FindingNormalizer


def _sample_match(line: int = 10, column: int = 4) -> RawMatch:
    return RawMatch(
        rule_id="SCX-SECRET-001",
        title="Hardcoded API Key",
        severity=Severity.CRITICAL,
        confidence=Confidence.HIGH,
        category=Category.SECRETS,
        description="A hardcoded API key was detected.",
        recommendation="Move the key to an environment variable.",
        line=line,
        column=column,
    )


def test_normalize_maps_all_fields_correctly() -> None:
    normalizer = FindingNormalizer()
    file_path = Path("app.py")

    findings = normalizer.normalize(file_path, [_sample_match()])

    assert len(findings) == 1
    finding = findings[0]
    assert finding.rule_id == "SCX-SECRET-001"
    assert finding.title == "Hardcoded API Key"
    assert finding.severity == Severity.CRITICAL
    assert finding.confidence == Confidence.HIGH
    assert finding.category == Category.SECRETS
    assert finding.file == str(file_path)
    assert finding.line == 10
    assert finding.column == 4


def test_fingerprint_is_deterministic() -> None:
    normalizer = FindingNormalizer()
    file_path = Path("app.py")

    first = normalizer.normalize(file_path, [_sample_match()])[0]
    second = normalizer.normalize(file_path, [_sample_match()])[0]

    assert first.fingerprint == second.fingerprint


def test_fingerprint_differs_by_line() -> None:
    normalizer = FindingNormalizer()
    file_path = Path("app.py")

    at_line_10 = normalizer.normalize(file_path, [_sample_match(line=10)])[0]
    at_line_20 = normalizer.normalize(file_path, [_sample_match(line=20)])[0]

    assert at_line_10.fingerprint != at_line_20.fingerprint


def test_fingerprint_differs_by_file() -> None:
    normalizer = FindingNormalizer()

    in_app = normalizer.normalize(Path("app.py"), [_sample_match()])[0]
    in_utils = normalizer.normalize(Path("utils.py"), [_sample_match()])[0]

    assert in_app.fingerprint != in_utils.fingerprint


def test_normalize_empty_matches_returns_empty_list() -> None:
    normalizer = FindingNormalizer()
    assert normalizer.normalize(Path("app.py"), []) == []


def test_finding_to_dict_uses_plain_string_values() -> None:
    normalizer = FindingNormalizer()
    finding = normalizer.normalize(Path("app.py"), [_sample_match()])[0]

    data = finding.to_dict()
    assert data["severity"] == "critical"
    assert data["confidence"] == "high"
    assert data["category"] == "secrets"
