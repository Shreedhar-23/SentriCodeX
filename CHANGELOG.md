# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/), and this
project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
- Phase 7: Automated test suites for both the Python engine (89 tests)
  and the TypeScript extension (unit + real VS Code integration tests).
- Phase 8: VSIX packaging — the Python engine now bundles into the
  packaged extension via `scripts/bundle-engine.js`, with the Scanner
  Bridge resolving bundled vs. development engine locations
  automatically. GitHub issue templates added.

