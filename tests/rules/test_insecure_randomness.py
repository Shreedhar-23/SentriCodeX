"""Tests for rules.cryptography.insecure_randomness.InsecureRandomnessRule."""

from __future__ import annotations

from rules.cryptography.insecure_randomness import InsecureRandomnessRule
from tests.rules._helpers import FIXTURES_DIR, run_rule_against_fixture

_RULE = InsecureRandomnessRule()
_DIR = FIXTURES_DIR / "insecure_randomness"


def test_flags_random_randint_usage() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "vulnerable.py")
    assert len(matches) == 1
    assert matches[0].rule_id == "SCX-CRYPTO-002"
    assert matches[0].confidence.value == "low"


def test_does_not_flag_secrets_module_usage() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "safe.py")
    assert matches == []
