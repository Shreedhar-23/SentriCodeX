# SentriCodeX Engine

The Python static analysis engine that powers SentriCodeX. Runs
completely standalone from the command line — no VS Code required — and
prints scan results as JSON.

## Requirements

- Python 3.14
- No runtime dependencies (standard library only)

## Usage

```bash
# Scan a single file
python -m sentricodex --path path/to/file.py

# Scan an entire directory
python -m sentricodex --path path/to/project

# Pretty-printed output
python -m sentricodex --path path/to/project --pretty

# Verbose logging (to stderr)
python -m sentricodex --path path/to/project --verbose
```

## Output Format

```json
{
  "schema_version": "1.0",
  "scanned_at": "2026-08-01T12:00:00+00:00",
  "target": "/absolute/path/to/project",
  "files_scanned": 42,
  "findings": [],
  "summary": {
    "files_scanned": 42,
    "findings_count": 0,
    "severity_breakdown": {
      "critical": 0,
      "high": 0,
      "medium": 0,
      "low": 0,
      "informational": 0
    }
  }
}
```

> **Note:** `findings` will be empty until Phase 4 (Rule Engine) adds
> concrete security rules. This phase validates that the scanning
> pipeline itself — file collection, language detection, parsing, rule
> execution, normalization — is correct and returns well-formed JSON.

## Architecture

```
FileCollector -> LanguageDetector -> SourceParser -> RuleExecutor -> FindingNormalizer -> Scanner -> CLI
```

Each module has exactly one responsibility (see PDF 4, Section 4). New
rules are added as independent modules in the top-level `rules/` folder
and registered into the `RuleRegistry` (`sentricodex/rule_base.py`) —
adding a rule never requires modifying the scanner itself.

## Running Tests

From the project root:

```bash
pip install -r engine/requirements-dev.txt --break-system-packages
pytest
```

## Development Standards

- PEP 8 style, full type hints (see PDF 9, Developer Handbook).
- Every module logs through `sentricodex.logger` — never `print()` for
  diagnostics, and never logs raw file contents or secrets.
