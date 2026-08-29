# SentriCodeX

**A local-first Visual Studio Code extension for static security analysis.**

SentriCodeX scans your source code directly inside VS Code, detects
common security issues across 14 built-in rules, displays findings as
an interactive Dashboard, generates HTML/JSON/Markdown reports, and
keeps a local scan history with the ability to view, download, and
compare past scans — all without your code ever leaving your machine.

## Features

- **Scan Current File** or **Scan Workspace** from the sidebar
- **14 security rules** across secrets, injection, unsafe APIs,
  cryptography, configuration, and best practices — including
  AST-based detection (not just regex) for the rules where that
  matters most (`eval`/`exec` usage, unsafe deserialization)
- **Security Score** (0–100) with a transparent, auditable formula
- **Interactive Dashboard**: severity breakdown, chart, searchable and
  sortable findings table
- **Scan History**: every scan is recorded with its full results —
  view, download a report, or compare any two scans against each
  other (fingerprint-matched diff showing new/resolved findings)
- **Report export**: HTML, JSON, and Markdown
- **Inline suppression comments** for accepted findings (see below)
- **100% local-first**: no network calls, no telemetry

## Suppressing a Finding

Sometimes a finding is a deliberate, accepted exception. Suppress it
inline with a comment:

```python
password = "test-fixture-value"  # sentricodex: ignore SCX-SECRET-001
```

To suppress a rule for an entire file, add anywhere in the file:

```python
# sentricodex: ignore-file SCX-SECRET-001
```

Always suppress by the specific rule ID shown in the finding (e.g.
`SCX-SECRET-001`), not blanket-suppress everything — that keeps the
suppression narrowly scoped to the exact issue you've reviewed and
accepted, rather than silencing the rule everywhere.

## Supported Languages

Python, JavaScript, TypeScript, React (JSX/TSX), HTML, CSS, JSON, YAML,
Dockerfile.

## Requirements

- Python 3.10+, installed and on your PATH (or set `sentricodex.pythonPath`)
- Node.js (development only, not required to use the packaged extension)

## Project Structure

```
SentriCodeX/
├── extension/    # VS Code extension (TypeScript) — UI, commands, dashboard
├── engine/       # Python static analysis engine
├── rules/        # 14 pluggable security rule modules
├── tests/        # Python + TypeScript test suites
├── docs/         # Testing strategy, publishing guide, CI integration
├── assets/       # Icons, banners, screenshots
└── .github/      # Issue templates, CI workflow
```

## Architecture

```
VS Code Extension (TypeScript)
  └── Sidebar / Dashboard / History (Webviews)
       └── Scanner Bridge (spawns Python subprocess)
            └── Python Engine
                 ├── File Collector → Language Detector → Source Parser
                 ├── Rule Executor (with inline suppression filtering)
                 │    └── 14 rules in rules/
                 └── Finding Normalizer → Security Scorer
```

Every layer has a single responsibility. New security rules can be
added to `rules/` without touching the engine or extension code at
all — see `rules/README.md` for a complete worked example, including
when to prefer AST-based detection over regex.

## The 14 Rules

| Category | Rules |
|---|---|
| Secrets | Hardcoded Password, Hardcoded API Key, Private Key in Source |
| Injection | SQL Injection, Command Injection, Cross-Site Scripting |
| Unsafe APIs | Python `eval`/`exec` *(AST-based)*, JS `eval`, `shell=True`, Unsafe Deserialization *(AST-based)* |
| Cryptography | Weak Hash Algorithm, Insecure Randomness |
| Configuration | Debug Mode Enabled |
| Best Practices | Security-Related TODO/FIXME |

## Getting Started (Development)

```bash
git clone https://github.com/sentricodex/sentricodex.git
cd sentricodex

# Python engine
pip install -r engine/requirements-dev.txt
pytest -v

# Extension
cd extension
npm install
npm run compile
```
Then press **F5** in VS Code (with `extension/` open as the workspace
root) to launch a development instance with SentriCodeX loaded.

## Building a Packaged Extension

```bash
cd extension
npm run package
```
Produces an installable `sentricodex-<version>.vsix`, with the Python
engine bundled automatically — see `extension/scripts/bundle-engine.js`.

## Testing

See [docs/TESTING.md](docs/TESTING.md) for the full strategy.
```bash
pytest -v                    # Python: engine + rules
cd extension
npm run test:unit            # TypeScript: pure logic
npm run test:integration     # TypeScript: real VS Code instance
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). To add a new security rule,
see [rules/README.md](rules/README.md).

## Publishing

See [docs/PUBLISHING.md](docs/PUBLISHING.md) for the Marketplace
publishing process.

## Security

See [SECURITY.md](SECURITY.md) for our vulnerability disclosure policy.

## License

Licensed under the [MIT License](LICENSE).
