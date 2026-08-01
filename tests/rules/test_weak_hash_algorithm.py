"""Tests for rules.cryptography.weak_hash_algorithm.WeakHashAlgorithmRule."""

from __future__ import annotations

from rules.cryptography.weak_hash_algorithm import WeakHashAlgorithmRule
from tests.rules._helpers import FIXTURES_DIR, run_rule_against_fixture

_RULE = WeakHashAlgorithmRule()
_DIR = FIXTURES_DIR / "weak_hash"


def test_flags_md5_usage() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "vulnerable.py")
    assert len(matches) == 1
    assert matches[0].rule_id == "SCX-CRYPTO-001"


def test_does_not_flag_sha256_usage() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "safe.py")
    assert matches == []
