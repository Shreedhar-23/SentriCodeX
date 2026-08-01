"""Tests for sentricodex.language_detector.LanguageDetector."""

from __future__ import annotations

from pathlib import Path

from sentricodex.language_detector import LanguageDetector
from sentricodex.models import Language


def test_detects_python() -> None:
    assert LanguageDetector.detect(Path("app.py")) == Language.PYTHON


def test_detects_javascript() -> None:
    assert LanguageDetector.detect(Path("script.js")) == Language.JAVASCRIPT


def test_detects_typescript() -> None:
    assert LanguageDetector.detect(Path("service.ts")) == Language.TYPESCRIPT


def test_detects_react_jsx() -> None:
    assert LanguageDetector.detect(Path("component.jsx")) == Language.REACT


def test_detects_react_tsx() -> None:
    assert LanguageDetector.detect(Path("component.tsx")) == Language.REACT


def test_detects_html() -> None:
    assert LanguageDetector.detect(Path("index.html")) == Language.HTML


def test_detects_css() -> None:
    assert LanguageDetector.detect(Path("styles.css")) == Language.CSS


def test_detects_json() -> None:
    assert LanguageDetector.detect(Path("config.json")) == Language.JSON


def test_detects_yaml_both_extensions() -> None:
    assert LanguageDetector.detect(Path("docker-compose.yaml")) == Language.YAML
    assert LanguageDetector.detect(Path("docker-compose.yml")) == Language.YAML


def test_detects_dockerfile_by_exact_name() -> None:
    assert LanguageDetector.detect(Path("Dockerfile")) == Language.DOCKERFILE


def test_detects_dockerfile_with_suffix() -> None:
    assert LanguageDetector.detect(Path("Dockerfile.prod")) == Language.DOCKERFILE


def test_is_case_insensitive_for_extensions() -> None:
    assert LanguageDetector.detect(Path("APP.PY")) == Language.PYTHON


def test_returns_none_for_unsupported_extension() -> None:
    assert LanguageDetector.detect(Path("notes.txt")) is None


def test_returns_none_for_no_extension() -> None:
    assert LanguageDetector.detect(Path("README")) is None
