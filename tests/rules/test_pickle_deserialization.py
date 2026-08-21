"""Tests for rules.unsafe_apis.pickle_deserialization.PickleDeserializationRule.

Written by following rules/README.md exactly - itself a verification
that the contributor guide is accurate.
"""

from __future__ import annotations

from rules.unsafe_apis.pickle_deserialization import PickleDeserializationRule
from tests.rules._helpers import FIXTURES_DIR, run_rule_against_fixture

_RULE = PickleDeserializationRule()
_DIR = FIXTURES_DIR / "pickle_deserialization"


def test_flags_pickle_loads() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "vulnerable.py")
    assert len(matches) == 1
    assert matches[0].rule_id == "SCX-UNSAFE-004"


def test_does_not_flag_json_loads() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "safe.py")
    assert matches == []
