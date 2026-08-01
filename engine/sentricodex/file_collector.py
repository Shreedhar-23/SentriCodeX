"""File discovery for the scanning engine.

Responsibility:
    - Given a single file or a directory, collect every file that is a
      supported language, is not inside an excluded folder, is not
      binary, and is not larger than the configured size limit.

This implements the "Collect supported files" step of the Scanner
Workflow described in PDF 5, Section 2.
"""

from __future__ import annotations

import os
from pathlib import Path

from sentricodex.config import (
    BINARY_SNIFF_BYTES,
    DEFAULT_EXCLUDED_FOLDERS,
    MAX_FILE_SIZE_BYTES,
)
from sentricodex.exceptions import ScanTargetNotFoundError
from sentricodex.language_detector import LanguageDetector
from sentricodex.logger import get_logger
from sentricodex.models import ScannedFile

logger = get_logger()


class FileCollector:
    """Discovers scannable files under a given target path."""

    def __init__(
        self,
        excluded_folders: frozenset[str] | None = None,
        max_file_size_bytes: int = MAX_FILE_SIZE_BYTES,
    ) -> None:
        self._excluded_folders = excluded_folders or DEFAULT_EXCLUDED_FOLDERS
        self._max_file_size_bytes = max_file_size_bytes

    def collect(self, target: Path) -> list[ScannedFile]:
        """Returns every supported, scannable file under the target.

        If target is a single file, returns a list containing zero or
        one ScannedFile (zero if the file is unsupported, binary, or
        too large). If target is a directory, walks it recursively,
        pruning excluded folders during traversal for performance.
        """
        if not target.exists():
            raise ScanTargetNotFoundError(f"Scan target does not exist: {target}")

        if target.is_file():
            single = self._evaluate_file(target)
            return [single] if single is not None else []

        if target.is_dir():
            return self._collect_directory(target)

        raise ScanTargetNotFoundError(
            f"Scan target is neither a file nor a directory: {target}"
        )

    def _collect_directory(self, root: Path) -> list[ScannedFile]:
        collected: list[ScannedFile] = []

        for dirpath, dirnames, filenames in os.walk(root):
            # Prune excluded folders in-place so os.walk never descends
            # into them. This is far cheaper than filtering afterward on
            # large repositories.
            dirnames[:] = [d for d in dirnames if d not in self._excluded_folders]

            for filename in filenames:
                file_path = Path(dirpath) / filename
                scanned = self._evaluate_file(file_path)
                if scanned is not None:
                    collected.append(scanned)

        logger.info(f"Collected {len(collected)} scannable file(s) under {root}")
        return collected

    def _evaluate_file(self, path: Path) -> ScannedFile | None:
        """Applies every eligibility check to a single file. Returns a
        ScannedFile if it should be scanned, otherwise None.
        """
        language = LanguageDetector.detect(path)
        if language is None:
            return None

        try:
            if path.stat().st_size > self._max_file_size_bytes:
                logger.warning(f"Skipping oversized file: {path}")
                return None
        except OSError as exc:
            logger.warning(f"Skipping unreadable file (stat failed): {path} ({exc})")
            return None

        if self._looks_binary(path):
            logger.warning(f"Skipping binary-looking file: {path}")
            return None

        return ScannedFile(path=path, language=language)

    def _looks_binary(self, path: Path) -> bool:
        """Cheap heuristic: a null byte in the first chunk of a file
        almost always indicates binary content.
        """
        try:
            with path.open("rb") as handle:
                chunk = handle.read(BINARY_SNIFF_BYTES)
            return b"\x00" in chunk
        except OSError:
            # If we can't even open it, treat as not scannable.
            return True
