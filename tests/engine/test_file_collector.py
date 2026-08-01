"""Tests for sentricodex.file_collector.FileCollector."""

from __future__ import annotations

from pathlib import Path

import pytest

from sentricodex.exceptions import ScanTargetNotFoundError
from sentricodex.file_collector import FileCollector
from sentricodex.models import Language

FIXTURES_DIR = Path(__file__).parent / "fixtures" / "sample_project"


def test_collects_every_supported_file_in_directory() -> None:
    collector = FileCollector()
    results = collector.collect(FIXTURES_DIR)
    collected_names = {scanned.path.name for scanned in results}

    expected = {
        "app.py",
        "script.js",
        "component.tsx",
        "index.html",
        "styles.css",
        "config.json",
        "docker-compose.yaml",
        "Dockerfile",
        "utils.py",
    }
    assert expected.issubset(collected_names)


def test_excludes_node_modules_folder() -> None:
    collector = FileCollector()
    results = collector.collect(FIXTURES_DIR)
    collected_names = {scanned.path.name for scanned in results}

    assert "ignored.js" not in collected_names


def test_skips_unsupported_extensions() -> None:
    collector = FileCollector()
    results = collector.collect(FIXTURES_DIR)
    collected_names = {scanned.path.name for scanned in results}

    assert "notes.txt" not in collected_names


def test_walks_nested_directories() -> None:
    collector = FileCollector()
    results = collector.collect(FIXTURES_DIR)
    collected_names = {scanned.path.name for scanned in results}

    assert "utils.py" in collected_names


def test_assigns_correct_language_to_each_file() -> None:
    collector = FileCollector()
    results = collector.collect(FIXTURES_DIR)
    by_name = {scanned.path.name: scanned.language for scanned in results}

    assert by_name["app.py"] == Language.PYTHON
    assert by_name["script.js"] == Language.JAVASCRIPT
    assert by_name["Dockerfile"] == Language.DOCKERFILE


def test_single_file_target_returns_one_result() -> None:
    collector = FileCollector()
    results = collector.collect(FIXTURES_DIR / "app.py")

    assert len(results) == 1
    assert results[0].language == Language.PYTHON


def test_single_unsupported_file_returns_empty() -> None:
    collector = FileCollector()
    results = collector.collect(FIXTURES_DIR / "notes.txt")

    assert results == []


def test_raises_for_nonexistent_target() -> None:
    collector = FileCollector()
    with pytest.raises(ScanTargetNotFoundError):
        collector.collect(FIXTURES_DIR / "does_not_exist")


def test_respects_max_file_size(tmp_path: Path) -> None:
    large_file = tmp_path / "large.py"
    large_file.write_text("x = 1\n" * 500_000)  # comfortably over 2MB

    collector = FileCollector(max_file_size_bytes=1024)
    results = collector.collect(large_file)

    assert results == []
