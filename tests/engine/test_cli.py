"""Integration tests for the sentricodex CLI (PDF 7, Section 3).

Unlike test_scanner.py, which tests the Scanner class directly in-
process, these tests invoke the actual `python -m sentricodex` command
as a real subprocess - exactly how the TypeScript ScannerBridge
invokes it. This is the real contract the extension depends on: if
stdout ever contains anything other than clean JSON, or exit codes
change, ScannerBridge breaks even if every unit test still passes.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

FIXTURES_DIR = Path(__file__).parent / "fixtures" / "sample_project"
ENGINE_DIR = Path(__file__).parent.parent.parent / "engine"


def run_cli(args: list[str]) -> subprocess.CompletedProcess[str]:
    """Runs the CLI as a real subprocess, mirroring exactly how
    ScannerBridge.ts spawns it (same module invocation, same PYTHONPATH
    mechanism).
    """
    import os

    env = {**os.environ, "PYTHONPATH": str(ENGINE_DIR)}
    return subprocess.run(
        [sys.executable, "-m", "sentricodex", *args],
        capture_output=True,
        text=True,
        env=env,
        timeout=30,
    )


def test_cli_scan_exits_zero_on_success() -> None:
    result = run_cli(["--path", str(FIXTURES_DIR)])

    assert result.returncode == 0


def test_cli_stdout_is_exclusively_valid_json() -> None:
    """This is the critical contract ScannerBridge relies on: stdout
    must be parseable as JSON with nothing else mixed in, since the
    bridge does exactly `JSON.parse(stdout)`.
    """
    result = run_cli(["--path", str(FIXTURES_DIR)])

    parsed = json.loads(result.stdout)  # Raises if stdout isn't pure JSON.
    assert parsed["files_scanned"] > 0
    assert "findings" in parsed
    assert "security_score" in parsed
    assert "duration_ms" in parsed


def test_cli_logs_go_to_stderr_not_stdout() -> None:
    result = run_cli(["--path", str(FIXTURES_DIR), "--verbose"])

    assert "[INFO]" in result.stderr
    assert "[INFO]" not in result.stdout


def test_cli_pretty_flag_produces_indented_json() -> None:
    compact = run_cli(["--path", str(FIXTURES_DIR)])
    pretty = run_cli(["--path", str(FIXTURES_DIR), "--pretty"])

    assert "\n  " in pretty.stdout
    assert "\n  " not in compact.stdout


def test_cli_nonexistent_path_exits_nonzero() -> None:
    result = run_cli(["--path", "/definitely/does/not/exist"])

    assert result.returncode != 0


def test_cli_nonexistent_path_reports_structured_error_on_stderr() -> None:
    """Mirrors exactly what ScannerBridge's extractErrorMessage() parses:
    the last line of stderr should be JSON with an "error" key.
    """
    result = run_cli(["--path", "/definitely/does/not/exist"])

    last_line = result.stderr.strip().split("\n")[-1]
    parsed = json.loads(last_line)
    assert "error" in parsed
    assert "does not exist" in parsed["error"]


def test_cli_single_file_target_works() -> None:
    result = run_cli(["--path", str(FIXTURES_DIR / "app.py")])

    parsed = json.loads(result.stdout)
    assert parsed["files_scanned"] == 1


def test_cli_missing_required_path_argument_exits_nonzero() -> None:
    result = run_cli([])

    assert result.returncode != 0
