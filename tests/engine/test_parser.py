"""Tests for sentricodex.parser.SourceParser.

Covers the error-handling edge cases from PDF 7, Section 8: invalid
encodings and unreadable files. These are the paths that keep a single
malformed file from aborting an entire scan.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest

from sentricodex.exceptions import ScannerError
from sentricodex.models import Language, ScannedFile
from sentricodex.parser import SourceParser


def test_parses_normal_utf8_file(tmp_path: Path) -> None:
    file_path = tmp_path / "normal.py"
    file_path.write_text("def hello():\n    return 'world'\n", encoding="utf-8")

    result = SourceParser().parse(ScannedFile(path=file_path, language=Language.PYTHON))

    assert "def hello():" in result.content
    assert result.lines == ["def hello():", "    return 'world'"]


def test_falls_back_gracefully_on_invalid_utf8(tmp_path: Path) -> None:
    file_path = tmp_path / "bad_encoding.py"
    # Write raw bytes that are not valid UTF-8 (a lone continuation byte).
    file_path.write_bytes(b"x = 1\n\x80\x81 invalid bytes here\n")

    # Must not raise - falls back to lossy decoding instead.
    result = SourceParser().parse(ScannedFile(path=file_path, language=Language.PYTHON))

    assert "x = 1" in result.content
    assert len(result.lines) >= 1


def test_raises_scanner_error_for_nonexistent_file() -> None:
    missing_file = Path("/definitely/does/not/exist/app.py")

    with pytest.raises(ScannerError):
        SourceParser().parse(ScannedFile(path=missing_file, language=Language.PYTHON))


@pytest.mark.skipif(
    sys.platform.startswith("win") or (hasattr(os, "geteuid") and os.geteuid() == 0),
    reason="File permission bits do not reliably block reads on Windows "
    "(os.chmod there only toggles a read-only attribute), and are "
    "bypassed entirely when running as root on POSIX systems (e.g. in "
    "a container). This test is only meaningful as a non-root user on "
    "a POSIX system (Linux/macOS).",
)
def test_raises_scanner_error_for_unreadable_file(tmp_path: Path) -> None:
    file_path = tmp_path / "locked.py"
    file_path.write_text("secret = 1\n")
    file_path.chmod(0o000)

    try:
        with pytest.raises(ScannerError):
            SourceParser().parse(ScannedFile(path=file_path, language=Language.PYTHON))
    finally:
        # Restore permissions so pytest's tmp_path cleanup can delete it.
        file_path.chmod(0o644)


def test_empty_file_parses_to_empty_lines(tmp_path: Path) -> None:
    file_path = tmp_path / "empty.py"
    file_path.write_text("")

    result = SourceParser().parse(ScannedFile(path=file_path, language=Language.PYTHON))

    assert result.content == ""
    assert result.lines == []
