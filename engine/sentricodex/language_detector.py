"""Language detection for individual files.

Responsibility:
    - Given a file path, determine which supported Language (if any) it
      represents, by extension or, for Dockerfiles, by filename.

This module has exactly one job, per the single-responsibility principle
in PDF 4 Section 4 — it does not read file contents or make any decision
about whether a file should be scanned (that's FileCollector's job).
"""

from __future__ import annotations

from pathlib import Path

from sentricodex.config import (
    DOCKERFILE_FILENAMES,
    DOCKERFILE_PREFIX,
    EXTENSION_LANGUAGE_MAP,
)
from sentricodex.models import Language


class LanguageDetector:
    """Maps file paths to supported Languages."""

    @staticmethod
    def detect(path: Path) -> Language | None:
        """Returns the detected Language for the given path, or None if
        the file is not a supported type.
        """
        if LanguageDetector._is_dockerfile(path):
            return Language.DOCKERFILE

        return EXTENSION_LANGUAGE_MAP.get(path.suffix.lower())

    @staticmethod
    def _is_dockerfile(path: Path) -> bool:
        name = path.name
        return name in DOCKERFILE_FILENAMES or name.startswith(DOCKERFILE_PREFIX)
