"""Tests for rules.injection.cross_site_scripting.CrossSiteScriptingRule."""

from __future__ import annotations

from rules.injection.cross_site_scripting import CrossSiteScriptingRule
from tests.rules._helpers import FIXTURES_DIR, run_rule_against_fixture

_RULE = CrossSiteScriptingRule()
_DIR = FIXTURES_DIR / "xss"


def test_flags_inner_html_and_dangerously_set_inner_html() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "vulnerable.jsx")
    assert len(matches) == 2
    assert all(m.rule_id == "SCX-INJECTION-003" for m in matches)


def test_does_not_flag_text_content_and_plain_jsx() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "safe.jsx")
    assert matches == []
