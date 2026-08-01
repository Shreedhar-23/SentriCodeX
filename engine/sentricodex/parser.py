"""Source file reading and preparation for rule execution.

Responsibility:
    - Safely read a ScannedFile's text content, handling encoding
      problems gracefully rather than crashing the entire scan.

Scope note: this phase keeps parsing at the text level (content + line
list). Future rule work (Phase 4 onward) may extend this with
language-specific structural parsing for rules that need it, without
requiring changes to the Scanner orchestration itself.
"""

from __future__ import annotations

from sentricodex.exceptions import ScannerError
from sentricodex.logger import get_logger
from sentricodex.models import ParsedSource, ScannedFile

logger = get_logger()


class SourceParser:
    """Reads a ScannedFile's contents into a ParsedSource."""

    def parse(self, scanned_file: ScannedFile) -> ParsedSource:
        """Reads the file at scanned_file.path as UTF-8 text.

        If the file contains invalid UTF-8 sequences, falls back to a
        lossy decode (replacing invalid bytes) rather than aborting the
        whole scan over a single malformed file — consistent with the
        "continue scanning unaffected files where possible" principle
        from PDF 4, Section 9.

        Raises:
            ScannerError: if the file cannot be opened at all (e.g. a
                permissions error or the file vanished mid-scan).
        """
        try:
            content = scanned_file.path.read_text(encoding="utf-8", errors="strict")
        except UnicodeDecodeError:
            logger.warning(
                f"Non-UTF-8 content in {scanned_file.path}; "
                "decoding with replacement characters."
            )
            content = scanned_file.path.read_text(encoding="utf-8", errors="replace")
        except OSError as exc:
            raise ScannerError(
                f"Unable to read file: {scanned_file.path} ({exc})"
            ) from exc

        return ParsedSource(
            path=scanned_file.path,
            language=scanned_file.language,
            content=content,
            lines=content.splitlines(),
        )
