"""Tests for rules.unsafe_apis.python_eval_exec.PythonEvalExecRule."""

from __future__ import annotations

from rules.unsafe_apis.python_eval_exec import PythonEvalExecRule
from tests.rules._helpers import FIXTURES_DIR, run_rule_against_fixture

_RULE = PythonEvalExecRule()
_DIR = FIXTURES_DIR / "eval_exec_python"


def test_flags_eval_usage() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "vulnerable.py")
    assert len(matches) == 1
    assert matches[0].rule_id == "SCX-UNSAFE-001"


def test_does_not_flag_literal_eval() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "safe.py")
    assert matches == []
