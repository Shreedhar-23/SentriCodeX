"""Tests for rules.configuration.debug_mode_enabled.DebugModeEnabledRule."""

from __future__ import annotations

from rules.configuration.debug_mode_enabled import DebugModeEnabledRule
from tests.rules._helpers import FIXTURES_DIR, run_rule_against_fixture

_RULE = DebugModeEnabledRule()
_DIR = FIXTURES_DIR / "debug_mode"


def test_flags_debug_true() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "vulnerable.py")
    assert len(matches) == 2  # "DEBUG = True" and "app.run(debug=True)"
    assert all(m.rule_id == "SCX-CONFIG-001" for m in matches)


def test_does_not_flag_env_controlled_debug() -> None:
    matches = run_rule_against_fixture(_RULE, _DIR / "safe.py")
    assert matches == []
