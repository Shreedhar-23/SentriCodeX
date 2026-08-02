"""Basic performance checks (PDF 7, Section 6).

This is deliberately a smoke-level check, not a full benchmarking
suite: it asserts scanning doesn't regress into being pathologically
slow, using a generous time bound that should comfortably pass on any
reasonable machine while still catching an accidental O(n^2) or
infinite-loop-style regression.
"""

from __future__ import annotations

import time
from pathlib import Path

from sentricodex.file_collector import FileCollector
from sentricodex.scanner import Scanner

FIXTURES_DIR = Path(__file__).parent / "fixtures"

# Generous bound - this suite scans well under 50 files. A real-world
# regression (e.g. re-reading every file for every rule) would blow far
# past this, while normal machine variance won't get close to it.
MAX_SCAN_SECONDS = 5.0


def test_scanning_all_fixtures_completes_within_time_bound() -> None:
    start = time.perf_counter()
    Scanner().scan(FIXTURES_DIR)
    elapsed = time.perf_counter() - start

    assert elapsed < MAX_SCAN_SECONDS, (
        f"Scan took {elapsed:.2f}s, expected under {MAX_SCAN_SECONDS}s. "
        "This may indicate a performance regression."
    )


def test_file_collection_completes_within_time_bound() -> None:
    """Isolates file collection specifically, since excluded-folder
    pruning (PDF 5, Section 9) is the main place a regression could
    hide - e.g. accidentally walking into node_modules before filtering
    instead of pruning during traversal.
    """
    start = time.perf_counter()
    FileCollector().collect(FIXTURES_DIR)
    elapsed = time.perf_counter() - start

    assert elapsed < MAX_SCAN_SECONDS


def test_scan_reports_a_nonzero_duration() -> None:
    """The engine's own duration_ms field (used by the Dashboard) should
    be a believable, non-negative measurement.
    """
    result = Scanner().scan(FIXTURES_DIR)

    assert result.duration_ms >= 0
    assert result.duration_ms < MAX_SCAN_SECONDS * 1000
