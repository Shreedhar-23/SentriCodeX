# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/), and this
project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Inline suppression comments: `# sentricodex: ignore <RULE_ID>` to
  suppress a specific rule on a line, `# sentricodex: ignore-file
  <RULE_ID>` to suppress it for an entire file.

### Changed
- `SCX-UNSAFE-001` (Python eval/exec) and `SCX-UNSAFE-004` (unsafe
  deserialization) upgraded from regex to AST-based detection,
  eliminating false positives from text that merely mentions
  eval/exec/pickle.loads in a comment or string rather than actually
  calling it.
- `SCX-INJECTION-001` (SQL injection) and `SCX-INJECTION-002` (command
  injection) fixed to detect vulnerabilities split across multiple
  lines (e.g. a `.execute()` call whose query argument is on the
  following line) — previously invisible to purely line-based
  matching.

## [1.1.0]

### Added
- Scan History redesign: every scan now stores its full results, not
  just metadata. Each entry supports View Report, Download Report,
  and Compare Selected (fingerprint-matched diff between two scans).
- New rule: `SCX-UNSAFE-004`, Unsafe Deserialization via
  `pickle.loads()`.

### Removed
- The standalone "Generate Report" sidebar action — superseded by
  per-scan actions in the History panel, since every scan is now
  recorded there automatically with its full findings.

## [1.0.0]

Initial stable release. Local-first static security analysis for VS
Code, with 13 built-in security rules, an interactive Dashboard,
HTML/JSON/Markdown report export, persistent scan history, and a fully
packaged, installable extension.

### Added
- Phase 1: Project repository structure, documentation skeleton,
  `.gitignore`, license, and planning artifacts.
- Phase 2: VS Code extension foundation — Activity Bar, Sidebar, 5
  commands, centralized logging.
- Phase 3: Python scanning engine — file collector, language detector,
  parser, rule engine scaffold, CLI.
- Phase 4: 13 security rules across all 6 categories (Secrets,
  Injection, Unsafe APIs, Cryptography, Configuration, Best Practices).
- Phase 5: Dashboard — Security Score, Scanner Bridge connecting the
  extension to the real engine, interactive findings table.
- Phase 6: HTML/JSON/Markdown report export; persistent local scan
  history.
- Phase 7: Automated test suites for both the Python engine and the
  TypeScript extension (unit + real VS Code integration tests).
- Phase 8: VSIX packaging — the Python engine bundles into the
  packaged extension automatically, with the Scanner Bridge resolving
  bundled vs. development engine locations at runtime.
- Phase 9: Marketplace assets — icon, banner, expanded keywords, and
  publishing documentation.
- Phase 10: CI/CD workflow, rule-authoring guide.

## [1.1.1] - 2026-09-05

### Added
- Added support for suppressed findings using SentriCodeX suppression comments.
- Added separate tracking of active and suppressed findings.
- Added suppressed findings to scan results and scan history.
- Added suppressed findings section to generated HTML security reports.
- Added suppressed findings information to Markdown reports.
- Added suppressed file count to security reports.
- Added total detected findings information to reports.
- Added suppressed findings count to the comparison panel.

### Improved
- Improved scan comparison so suppressed findings are not incorrectly reported as resolved.
- Improved comparison logic to distinguish between active, suppressed, new, resolved, and unchanged findings.
- Improved security score calculation to use active findings only.
- Improved HTML report table layout to prevent overlapping columns.
- Improved report readability and formatting for long file paths, descriptions, and recommendations.
- Improved handling of suppression information between the Python scanner and VS Code extension.
- Improved report summary with clearer active and suppressed finding statistics.

### Fixed
- Fixed suppressed findings being lost or incorrectly classified during scan comparison.
- Fixed report layout issues caused by long finding descriptions and file paths.
- Fixed HTML report markup/layout issues in the suppressed-files summary.
- Fixed dashboard/comparison handling of suppressed finding data.

### Security
- Suppressed findings remain recorded separately rather than being silently discarded.
- Security reports continue to avoid exposing sensitive secret values.
- Suppression affects active finding results and security scoring without removing the underlying detection information.

