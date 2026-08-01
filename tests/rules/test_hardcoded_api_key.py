"""Tests for rules.secrets.hardcoded_api_key.HardcodedApiKeyRule."""

from __future__ import annotations

from rules.secrets.hardcoded_api_key import HardcodedApiKeyRule
from tests.rules._helpers import FIXTURES_DIR, run_rule_against_fixture

_RULE = HardcodedApiKeyRule()
_DIR = FIXTURES_DIR / "hardcoded_api_key"


def test_flags_hardcoded_api_key() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "vulnerable.py")
    assert len(matches) == 1
    assert matches[0].rule_id == "SCX-SECRET-002"


def test_does_not_flag_env_var_api_key() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "safe.py")
    assert matches == []
