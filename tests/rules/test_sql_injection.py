"""Tests for rules.injection.sql_injection.SqlInjectionRule."""

from __future__ import annotations

from rules.injection.sql_injection import SqlInjectionRule
from tests.rules._helpers import FIXTURES_DIR, run_rule_against_fixture

_RULE = SqlInjectionRule()
_DIR = FIXTURES_DIR / "sql_injection"


def test_flags_fstring_sql_query() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "vulnerable.py")
    assert len(matches) == 2
    assert all(m.rule_id == "SCX-INJECTION-001" for m in matches)


def test_flags_percent_operator_sql_query() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "vulnerable.py")
    assert matches[1].line == 7  # the %-operator formatted query


def test_does_not_flag_parameterized_query() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "safe.py")
    assert matches == []
