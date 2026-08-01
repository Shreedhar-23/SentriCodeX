"""Tests for rules.best_practices.security_todo_comment.SecurityTodoCommentRule."""

from __future__ import annotations

from rules.best_practices.security_todo_comment import SecurityTodoCommentRule
from tests.rules._helpers import FIXTURES_DIR, run_rule_against_fixture

_RULE = SecurityTodoCommentRule()
_DIR = FIXTURES_DIR / "security_todo"


def test_flags_security_related_todo() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "vulnerable.py")
    assert len(matches) == 1
    assert matches[0].rule_id == "SCX-BESTPRACTICE-001"
    assert matches[0].severity.value == "informational"


def test_does_not_flag_ordinary_todo() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "safe.py")
    assert matches == []
