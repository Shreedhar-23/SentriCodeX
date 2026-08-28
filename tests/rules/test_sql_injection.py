"""Tests for rules.injection.sql_injection.SqlInjectionRule.

Includes multi-line cases (both vulnerable and safe) added alongside
the extract_call_text() fix - the concrete regression test proving a
call split across multiple lines is no longer invisible to this rule,
while a multi-line *parameterized* (safe) call still correctly stays
unflagged.
"""

from __future__ import annotations

from rules.injection.sql_injection import SqlInjectionRule
from tests.rules._helpers import FIXTURES_DIR, run_rule_against_fixture

_RULE = SqlInjectionRule()
_DIR = FIXTURES_DIR / "sql_injection"


def test_flags_fstring_sql_query() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "vulnerable.py")
    assert len(matches) == 3
    assert all(m.rule_id == "SCX-INJECTION-001" for m in matches)


def test_flags_percent_operator_sql_query() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "vulnerable.py")
    assert matches[1].line == 7  # the %-operator formatted query


def test_flags_multiline_sql_query() -> None:
    """Regression test: this vulnerability is split across 3 lines -
    the .execute( call on one line, the f-string query on the next.
    Before the extract_call_text() fix, this was invisible because the
    rule only checked the single anchor line for both confirmation
    conditions.
    """
    matches = run_rule_against_fixture(_RULE, _DIR / "vulnerable.py")
    assert matches[2].line == 12  # the cursor.execute( line
    assert matches[2].rule_id == "SCX-INJECTION-001"


def test_does_not_flag_parameterized_query() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "safe.py")
    assert matches == []


def test_does_not_flag_multiline_parameterized_query() -> None:
    """A safe, parameterized query split across multiple lines must
    NOT be falsely flagged just because the confirmation checks now
    look at a wider window of text.
    """
    matches = run_rule_against_fixture(_RULE, _DIR / "safe.py")
    assert matches == []
