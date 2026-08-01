"""Tests for rules.secrets.hardcoded_password.HardcodedPasswordRule."""

from __future__ import annotations

from rules.secrets.hardcoded_password import HardcodedPasswordRule
from tests.rules._helpers import FIXTURES_DIR, run_rule_against_fixture

_RULE = HardcodedPasswordRule()
_DIR = FIXTURES_DIR / "hardcoded_password"


def test_flags_hardcoded_password() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "vulnerable.py")
    assert len(matches) == 1
    assert matches[0].rule_id == "SCX-SECRET-001"
    assert matches[0].line == 2


def test_does_not_flag_env_var_password() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "safe.py")
    assert matches == []
