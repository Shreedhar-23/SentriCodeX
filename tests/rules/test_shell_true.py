"""Tests for rules.unsafe_apis.shell_true.ShellTrueRule."""

from __future__ import annotations

from rules.unsafe_apis.shell_true import ShellTrueRule
from tests.rules._helpers import FIXTURES_DIR, run_rule_against_fixture

_RULE = ShellTrueRule()
_DIR = FIXTURES_DIR / "shell_true"


def test_flags_shell_true() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "vulnerable.py")
    assert len(matches) == 1
    assert matches[0].rule_id == "SCX-UNSAFE-003"


def test_does_not_flag_argument_list() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "safe.py")
    assert matches == []
