"""Shared test utilities for rule unit tests.

Provides a small helper that mirrors what the real Scanner pipeline
does (detect language, parse source) but scoped to a single rule and a
single fixture file, so each rule test stays focused on the rule's own
detection logic.
"""

from __future__ import annotations

from pathlib import Path

from sentricodex.language_detector import LanguageDetector
from sentricodex.models import RawMatch, ScannedFile
from sentricodex.parser import SourceParser
from sentricodex.rule_base import Rule

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def run_rule_against_fixture(rule: Rule, fixture_path: Path) -> list[RawMatch]:
    """Detects the fixture's language, parses it, and runs the given
    rule against it - exactly as the real Scanner pipeline would, but
    isolated to one rule for focused testing.
    """
    language = LanguageDetector.detect(fixture_path)
    assert language is not None, f"Fixture has unsupported extension: {fixture_path}"

    scanned_file = ScannedFile(path=fixture_path, language=language)
    parsed_source = SourceParser().parse(scanned_file)
    return rule.check(parsed_source)
