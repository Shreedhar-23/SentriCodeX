"""Tests for rules.unsafe_apis.python_eval_exec.PythonEvalExecRule.

Upgraded alongside the rule's move to AST-based detection: the safe
fixture now includes text that would have false-positived under the
old regex (a comment and a string literal mentioning eval/exec),
specifically to prove the AST version correctly distinguishes real
calls from mere text mentions.
"""

from __future__ import annotations

from rules.unsafe_apis.python_eval_exec import PythonEvalExecRule
from tests.rules._helpers import FIXTURES_DIR, run_rule_against_fixture

_RULE = PythonEvalExecRule()
_DIR = FIXTURES_DIR / "eval_exec_python"


def test_flags_eval_usage() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "vulnerable.py")
    assert len(matches) == 1
    assert matches[0].rule_id == "SCX-UNSAFE-001"
    assert matches[0].line == 2


def test_does_not_flag_literal_eval() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "safe.py")
    assert matches == []


def test_does_not_flag_eval_mentioned_in_comment_or_string() -> None:
    """The old regex-based version of this rule would have false-
    positived on both of these lines - this is the concrete
    regression test for the AST upgrade.
    """
    matches = run_rule_against_fixture(_RULE, _DIR / "safe.py")
    assert matches == []
