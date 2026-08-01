"""The Scanner: orchestrates the full scanning workflow end to end.

Implements the workflow from PDF 5, Section 2:
    Collect supported files -> Select analyzer -> Parse source ->
    Execute rules -> Normalize findings -> Return results.

This is the only class in the engine that knows about the full
pipeline; every other module (FileCollector, SourceParser, RuleExecutor,
FindingNormalizer) has exactly one responsibility and knows nothing
about the others.
"""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from sentricodex.exceptions import ScannerError
from sentricodex.file_collector import FileCollector
from sentricodex.logger import get_logger
from sentricodex.models import Finding, ScanResult, ScanSummary, Severity
from sentricodex.normalizer import FindingNormalizer
from sentricodex.parser import SourceParser
from sentricodex.rule_executor import RuleExecutor

logger = get_logger()

_SCHEMA_VERSION = "1.0"


class Scanner:
    """Coordinates a full scan of a file or directory."""

    def __init__(
        self,
        collector: FileCollector | None = None,
        parser: SourceParser | None = None,
        executor: RuleExecutor | None = None,
        normalizer: FindingNormalizer | None = None,
    ) -> None:
        self._collector = collector or FileCollector()
        self._parser = parser or SourceParser()
        self._executor = executor or RuleExecutor()
        self._normalizer = normalizer or FindingNormalizer()

    def scan(self, target: Path) -> ScanResult:
        """Runs a complete scan of the given file or directory and
        returns a ScanResult ready to be serialized to JSON.
        """
        resolved_target = target.resolve()
        logger.info(f"Starting scan of: {resolved_target}")

        scanned_files = self._collector.collect(resolved_target)
        all_findings: list[Finding] = []

        for scanned_file in scanned_files:
            try:
                parsed_source = self._parser.parse(scanned_file)
            except ScannerError as exc:
                # A single unreadable file must not abort the whole scan.
                logger.error(str(exc))
                continue

            raw_matches = self._executor.execute(parsed_source)
            all_findings.extend(
                self._normalizer.normalize(scanned_file.path, raw_matches)
            )

        summary = self._build_summary(len(scanned_files), all_findings)

        result = ScanResult(
            schema_version=_SCHEMA_VERSION,
            scanned_at=datetime.now(timezone.utc).isoformat(),
            target=str(resolved_target),
            files_scanned=len(scanned_files),
            findings=all_findings,
            summary=summary,
        )

        logger.info(
            f"Scan complete: {len(scanned_files)} file(s) scanned, "
            f"{len(all_findings)} finding(s)."
        )
        return result

    @staticmethod
    def _build_summary(files_scanned: int, findings: list[Finding]) -> ScanSummary:
        breakdown: dict[str, int] = {severity.value: 0 for severity in Severity}
        for finding in findings:
            breakdown[finding.severity.value] += 1

        return ScanSummary(
            files_scanned=files_scanned,
            findings_count=len(findings),
            severity_breakdown=breakdown,
        )
