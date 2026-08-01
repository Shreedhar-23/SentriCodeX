"""Tests for sentricodex.scoring.calculate_security_score."""

from __future__ import annotations

from sentricodex.models import Category, Confidence, Finding, Severity
from sentricodex.scoring import MAX_SCORE, MIN_SCORE, calculate_security_score


def _make_finding(severity: Severity, fingerprint: str = "abc123") -> Finding:
    return Finding(
        rule_id="TEST-001",
        title="Test Finding",
        severity=severity,
        confidence=Confidence.HIGH,
        category=Category.BEST_PRACTICES,
        file="app.py",
        line=1,
        column=0,
        description="Test description.",
        recommendation="Test recommendation.",
        fingerprint=fingerprint,
    )


def test_no_findings_gives_max_score() -> None:
    assert calculate_security_score([]) == MAX_SCORE


def test_score_is_deterministic_for_identical_findings() -> None:
    findings = [_make_finding(Severity.HIGH), _make_finding(Severity.CRITICAL)]

    first = calculate_security_score(findings)
    second = calculate_security_score(findings)

    assert first == second


def test_critical_finding_deducts_25_points() -> None:
    assert calculate_security_score([_make_finding(Severity.CRITICAL)]) == 75


def test_high_finding_deducts_15_points() -> None:
    assert calculate_security_score([_make_finding(Severity.HIGH)]) == 85


def test_medium_finding_deducts_7_points() -> None:
    assert calculate_security_score([_make_finding(Severity.MEDIUM)]) == 93


def test_low_finding_deducts_3_points() -> None:
    assert calculate_security_score([_make_finding(Severity.LOW)]) == 97


def test_informational_finding_deducts_nothing() -> None:
    assert calculate_security_score([_make_finding(Severity.INFORMATIONAL)]) == 100


def test_score_never_goes_below_zero() -> None:
    many_critical_findings = [_make_finding(Severity.CRITICAL) for _ in range(10)]
    assert calculate_security_score(many_critical_findings) == MIN_SCORE


def test_mixed_severities_accumulate_correctly() -> None:
    findings = [
        _make_finding(Severity.CRITICAL),  # -25
        _make_finding(Severity.HIGH),  # -15
        _make_finding(Severity.MEDIUM),  # -7
    ]
    assert calculate_security_score(findings) == 53
