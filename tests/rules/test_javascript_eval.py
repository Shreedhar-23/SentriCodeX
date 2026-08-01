"""Tests for rules.unsafe_apis.javascript_eval.JavaScriptEvalRule."""

from __future__ import annotations

from rules.unsafe_apis.javascript_eval import JavaScriptEvalRule
from tests.rules._helpers import FIXTURES_DIR, run_rule_against_fixture

_RULE = JavaScriptEvalRule()
_DIR = FIXTURES_DIR / "eval_js"


def test_flags_eval_usage() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "vulnerable.js")
    assert len(matches) == 1
    assert matches[0].rule_id == "SCX-UNSAFE-002"


def test_does_not_flag_json_parse() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "safe.js")
    assert matches == []
