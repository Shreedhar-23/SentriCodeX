"""Domain models shared across the SentriCodeX scanning engine.

These types define the contracts every other module (file collector,
parser, rule executor, normalizer, scanner, CLI) communicates through.
The Finding schema mirrors PDF 5 (Scanner & Rule Engine Specification),
Section 8 exactly: Rule ID, Title, Severity, Confidence, Category, File,
Line, Column, Description, Recommendation, Fingerprint.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Any


class Severity(str, Enum):
    """Finding severity levels, per PDF 5 Section 7."""

    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFORMATIONAL = "informational"


class Confidence(str, Enum):
    """How confident a rule is that a match is a true positive."""

    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Category(str, Enum):
    """Rule categories, per PDF 5 Section 6."""

    SECRETS = "secrets"
    AUTHENTICATION = "authentication"
    INJECTION = "injection"
    CRYPTOGRAPHY = "cryptography"
    UNSAFE_APIS = "unsafe_apis"
    CONFIGURATION = "configuration"
    DEPENDENCY = "dependency"
    BEST_PRACTICES = "best_practices"


class Language(str, Enum):
    """Supported languages, per PDF 1 Section 5 and PDF 5 Section 5."""

    PYTHON = "python"
    JAVASCRIPT = "javascript"
    TYPESCRIPT = "typescript"
    REACT = "react"
    HTML = "html"
    CSS = "css"
    JSON = "json"
    YAML = "yaml"
    DOCKERFILE = "dockerfile"


@dataclass(frozen=True)
class RawMatch:
    """An unrefined detection produced by a single Rule, before it has
    been normalized into a full Finding (which adds file path and
    fingerprint, known only to the orchestrating Scanner).
    """

    rule_id: str
    title: str
    severity: Severity
    confidence: Confidence
    category: Category
    description: str
    recommendation: str
    line: int
    column: int = 0


@dataclass(frozen=True)
class Finding:
    """A fully normalized, reportable security finding."""

    rule_id: str
    title: str
    severity: Severity
    confidence: Confidence
    category: Category
    file: str
    line: int
    column: int
    description: str
    recommendation: str
    fingerprint: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "title": self.title,
            "severity": self.severity.value,
            "confidence": self.confidence.value,
            "category": self.category.value,
            "file": self.file,
            "line": self.line,
            "column": self.column,
            "description": self.description,
            "recommendation": self.recommendation,
            "fingerprint": self.fingerprint,
        }


@dataclass(frozen=True)
class ScannedFile:
    """A file selected by the FileCollector, tagged with its detected
    language, ready to be handed to the SourceParser.
    """

    path: Path
    language: Language


@dataclass(frozen=True)
class ParsedSource:
    """A file's text content, prepared for rule execution."""

    path: Path
    language: Language
    content: str
    lines: list[str]


@dataclass(frozen=True)
class ScanSummary:
    """Aggregate statistics about a completed scan."""

    files_scanned: int
    findings_count: int
    severity_breakdown: dict[str, int]

    def to_dict(self) -> dict[str, Any]:
        return {
            "files_scanned": self.files_scanned,
            "findings_count": self.findings_count,
            "severity_breakdown": self.severity_breakdown,
        }


@dataclass(frozen=True)
class ScanResult:
    """The complete, top-level result of a scan — what the CLI prints as
    JSON and what the future Scanner Bridge (extension side) will parse.
    """

    schema_version: str
    scanned_at: str
    target: str
    files_scanned: int
    findings: list[Finding]
    summary: ScanSummary

    def to_dict(self) -> dict[str, Any]:
        return {
            "schema_version": self.schema_version,
            "scanned_at": self.scanned_at,
            "target": self.target,
            "files_scanned": self.files_scanned,
            "findings": [finding.to_dict() for finding in self.findings],
            "summary": self.summary.to_dict(),
        }
