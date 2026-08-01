"""Configuration constants for the SentriCodeX scanning engine.

Centralizing these values here (rather than scattering them through the
codebase) means the future Settings screen (PDF 3, Section 9) can
override them from user preferences without touching scanner logic.
"""

from __future__ import annotations

from sentricodex.models import Language

# Folders that are never walked into, regardless of their contents.
# Pruned during traversal (not filtered after) for performance.
DEFAULT_EXCLUDED_FOLDERS: frozenset[str] = frozenset(
    {
        "node_modules",
        ".git",
        "dist",
        "out",
        "build",
        "__pycache__",
        ".venv",
        "venv",
        "env",
        ".mypy_cache",
        ".pytest_cache",
        ".vscode-test",
    }
)

# Maps file extensions (lowercase, including the leading dot) to the
# Language they represent. Filenames without a mapped extension are
# skipped unless matched by DOCKERFILE_FILENAMES below.
EXTENSION_LANGUAGE_MAP: dict[str, Language] = {
    ".py": Language.PYTHON,
    ".js": Language.JAVASCRIPT,
    ".jsx": Language.REACT,
    ".ts": Language.TYPESCRIPT,
    ".tsx": Language.REACT,
    ".html": Language.HTML,
    ".htm": Language.HTML,
    ".css": Language.CSS,
    ".json": Language.JSON,
    ".yml": Language.YAML,
    ".yaml": Language.YAML,
}

# Dockerfiles are matched by filename, not extension.
DOCKERFILE_FILENAMES: frozenset[str] = frozenset({"Dockerfile"})
DOCKERFILE_PREFIX = "Dockerfile."

# Files larger than this are skipped entirely (performance guard, per
# PDF 5 Section 9).
MAX_FILE_SIZE_BYTES: int = 2 * 1024 * 1024  # 2 MB

# Number of leading bytes inspected to heuristically detect binary files.
BINARY_SNIFF_BYTES: int = 1024
