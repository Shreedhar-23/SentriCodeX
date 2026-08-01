"""End-to-end tests for sentricodex.scanner.Scanner.

Includes a minimal test-only Rule implementation to verify that the full
pipeline (collect -> parse -> execute -> normalize) is wired correctly.
This rule is NOT part of the shipped engine — real rules arrive in
Phase 4 under the top-level rules/ folder.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from sentricodex.exceptions import ScanTargetNotFoundError
from sentricodex.models import (
    Category,
    Confidence,
    Language,
    ParsedSource,
    RawMatch,
    Severity,
)
from sentricodex.rule_base import Rule, RuleRegistry
from sentricodex.rule_executor import RuleExecutor
from sentricodex.scanner import Scanner

FIXTURES_DIR = Path(__file__).parent / "fixtures" / "sample_project"


class _AlwaysFlagsLineOneRule(Rule):
    """Test-only rule: flags line 1 of every Python file it sees."""

    rule_id = "TEST-001"
    title = "Test Finding"
    category = Category.BEST_PRACTICES
    severity = Severity.LOW
    description = "Test rule for pipeline verification."
    recommendation = "N/A - test rule."
    supported_languages = frozenset({Language.PYTHON})

    def check(self, source: ParsedSource) -> list[RawMatch]:
        return [
            RawMatch(
                rule_id=self.rule_id,
                title=self.title,
                severity=self.severity,
                confidence=Confidence.HIGH,
                category=self.category,
                description=self.description,
                recommendation=self.recommendation,
                line=1,
                column=0,
            )
        ]


class _AlwaysRaisesRule(Rule):
    """Test-only rule: always raises, to verify fault isolation."""

    rule_id = "TEST-002"
    title = "Broken Rule"
    category = Category.BEST_PRACTICES
    severity = Severity.LOW
    description = "Deliberately broken for testing."
    recommendation = "N/A - test rule."
    supported_languages = frozenset({Language.PYTHON})

    def check(self, source: ParsedSource) -> list[RawMatch]:
        raise RuntimeError("intentional test failure")


def test_scan_with_no_rules_returns_zero_findings() -> None:
    """With no rules registered (this phase's default state), the scan
    must still complete successfully and return well-formed, empty
    findings — proving the pipeline works independent of rule content.
    """
    scanner = Scanner()
    result = scanner.scan(FIXTURES_DIR)

    assert result.files_scanned > 0
    assert result.findings == []
    assert result.summary.findings_count == 0
    assert result.schema_version == "1.0"


def test_scan_with_registered_rule_returns_findings() -> None:
    registry = RuleRegistry()
    registry.register(_AlwaysFlagsLineOneRule())
    scanner = Scanner(executor=RuleExecutor(registry=registry))

    result = scanner.scan(FIXTURES_DIR)

    python_findings = [f for f in result.findings if f.rule_id == "TEST-001"]
    # app.py and nested/utils.py are both Python files in the fixture.
    assert len(python_findings) == 2
    assert all(f.line == 1 for f in python_findings)


def test_scan_continues_after_a_rule_raises() -> None:
    registry = RuleRegistry()
    registry.register(_AlwaysRaisesRule())
    registry.register(_AlwaysFlagsLineOneRule())
    scanner = Scanner(executor=RuleExecutor(registry=registry))

    result = scanner.scan(FIXTURES_DIR)

    # The broken rule must not prevent the working rule's findings.
    working_findings = [f for f in result.findings if f.rule_id == "TEST-001"]
    assert len(working_findings) == 2


def test_scan_severity_breakdown_counts_correctly() -> None:
    registry = RuleRegistry()
    registry.register(_AlwaysFlagsLineOneRule())
    scanner = Scanner(executor=RuleExecutor(registry=registry))

    result = scanner.scan(FIXTURES_DIR)

    assert result.summary.severity_breakdown["low"] == 2
    assert result.summary.severity_breakdown["critical"] == 0


def test_scan_raises_for_nonexistent_target() -> None:
    scanner = Scanner()
    with pytest.raises(ScanTargetNotFoundError):
        scanner.scan(FIXTURES_DIR / "does_not_exist")


def test_scan_result_is_json_serializable() -> None:
    import json

    scanner = Scanner()
    result = scanner.scan(FIXTURES_DIR)

    # Must not raise - proves every field is a plain JSON-safe type.
    serialized = json.dumps(result.to_dict())
    assert "schema_version" in serialized
