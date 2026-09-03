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

from re import match
import time
from datetime import datetime, timezone
from pathlib import Path

from sentricodex.exceptions import ScannerError
from sentricodex.file_collector import FileCollector
from sentricodex.logger import get_logger
from sentricodex.models import (
    Finding,
    ScanResult,
    ScanSummary,
    Severity,
    SuppressedFinding,
)
from sentricodex.normalizer import FindingNormalizer
from sentricodex.parser import SourceParser
from sentricodex.rule_executor import RuleExecutor
from sentricodex.rule_loader import load_default_registry
from sentricodex.scoring import calculate_security_score
from sentricodex.suppressions import get_suppression

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
        self._executor = executor or RuleExecutor(registry=load_default_registry())
        self._normalizer = normalizer or FindingNormalizer()

    def scan(self, target: Path) -> ScanResult:
        """Runs a complete scan of the given file or directory and
        returns a ScanResult ready to be serialized to JSON.
        """
        start_time = time.perf_counter()
        resolved_target = target.resolve()
        logger.info(f"Starting scan of: {resolved_target}")

        scanned_files = self._collector.collect(resolved_target)
        all_findings: list[Finding] = []
        suppressed_findings: list[SuppressedFinding] = []
        for scanned_file in scanned_files:
            try:
                parsed_source = self._parser.parse(scanned_file)
            except ScannerError as exc:
                # A single unreadable file must not abort the whole scan.
                logger.error(str(exc))
                continue

            raw_matches = self._executor.execute(parsed_source)

            unsuppressed_matches = []
            suppressed_matches = []

            for match in raw_matches:
                suppression = get_suppression(
                    parsed_source.lines,
                    match.line,
                    match.rule_id,
                )

                if suppression is not None:
                    suppressed_matches.append(
                        (match, suppression)
                    )
                else:
                    unsuppressed_matches.append(match)

            if suppressed_matches:
                logger.info(
                    f"Suppressed {len(suppressed_matches)} finding(s) "
                    f"in {scanned_file.path}"
                )

            all_findings.extend(
                self._normalizer.normalize(
                    scanned_file.path,
                    unsuppressed_matches,
                )
            )

            normalized_suppressed = self._normalizer.normalize(
                scanned_file.path,
                [match for match, _ in suppressed_matches],
            )

            for finding, (_, suppression) in zip(
                normalized_suppressed,
                suppressed_matches,
            ):
                suppression_type, suppression_comment = suppression

                suppressed_findings.append(
                    SuppressedFinding(
                        **finding.__dict__,
                        suppression_type=suppression_type,
                        suppression_comment=suppression_comment,
                    )
                )

        summary = self._build_summary(len(scanned_files), all_findings)
        duration_ms = round((time.perf_counter() - start_time) * 1000)

        result = ScanResult(
            schema_version=_SCHEMA_VERSION,
            scanned_at=datetime.now(timezone.utc).isoformat(),
            target=str(resolved_target),
            files_scanned=len(scanned_files),
            findings=all_findings,
            suppressed_findings=suppressed_findings,
            summary=summary,
            security_score=calculate_security_score(all_findings),
            duration_ms=duration_ms,
        )

        logger.info(
            f"Scan complete: {len(scanned_files)} file(s) scanned, "
            f"{len(all_findings)} active finding(s), "
            f"{len(suppressed_findings)} suppressed finding(s), "
            f"score {result.security_score}, "
            f"{duration_ms}ms."
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
