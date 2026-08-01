"""Tests for rules.secrets.private_key_in_source.PrivateKeyInSourceRule."""

from __future__ import annotations

from rules.secrets.private_key_in_source import PrivateKeyInSourceRule
from tests.rules._helpers import FIXTURES_DIR, run_rule_against_fixture

_RULE = PrivateKeyInSourceRule()
_DIR = FIXTURES_DIR / "private_key"


def test_flags_pem_private_key() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "vulnerable.py")
    assert len(matches) == 1
    assert matches[0].rule_id == "SCX-SECRET-003"
    assert matches[0].confidence.value == "high"


def test_does_not_flag_key_path_reference() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "safe.py")
    assert matches == []
