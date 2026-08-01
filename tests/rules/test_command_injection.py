"""Tests for rules.injection.command_injection.CommandInjectionRule."""

from __future__ import annotations

from rules.injection.command_injection import CommandInjectionRule
from tests.rules._helpers import FIXTURES_DIR, run_rule_against_fixture

_RULE = CommandInjectionRule()
_DIR = FIXTURES_DIR / "command_injection"


def test_flags_python_dynamic_os_system() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "vulnerable_python.py")
    assert len(matches) == 1
    assert matches[0].rule_id == "SCX-INJECTION-002"


def test_does_not_flag_python_argument_list() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "safe_python.py")
    assert matches == []


def test_flags_js_dynamic_exec() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "vulnerable.js")
    assert len(matches) == 1


def test_does_not_flag_js_exec_file() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "safe.js")
    assert matches == []
