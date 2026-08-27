"""Tests for rules.unsafe_apis.pickle_deserialization.PickleDeserializationRule.

Upgraded alongside the rule's move to AST-based detection.
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


def test_does_not_flag_pickle_mentioned_in_comment() -> None:
    """The old regex-based version would have false-positived on the
    comment mentioning pickle.loads(data) and pickle.load(). This is
    the concrete regression test for the AST upgrade.
    """
    matches = run_rule_against_fixture(_RULE, _DIR / "safe.py")
    assert matches == []
