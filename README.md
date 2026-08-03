# SentriCodeX

**A local-first Visual Studio Code extension for static security analysis.**

SentriCodeX scans your source code directly inside VS Code, detects
common security issues across 13 built-in rules, displays findings as
an interactive Dashboard, generates HTML/JSON/Markdown reports, and
keeps a local scan history — all without your code ever leaving your
machine.

## Features

- **Scan Current File** or **Scan Workspace** from the sidebar
- **13 security rules**: hardcoded secrets, SQL/command injection, XSS,
  unsafe `eval()`/`exec()`, weak cryptography, debug-mode
  misconfiguration, and more
- **Security Score** (0–100) with a transparent, auditable formula
- **Interactive Dashboard**: severity breakdown, chart, searchable and
  sortable findings table
- **Report export**: HTML, JSON, and Markdown
- **Local scan history**, persisted across sessions
- **100% local-first**: no network calls, no telemetry

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
├── rules/        # 13 pluggable security rule modules
├── tests/        # Python + TypeScript test suites
├── docs/         # Testing strategy and other documentation
├── assets/       # Icons, banners, screenshots
├── scripts/      # (see extension/scripts/ for the VSIX bundling script)
└── .github/      # Issue templates
```

## Architecture

```
VS Code Extension (TypeScript)
  └── Sidebar / Dashboard / History (Webviews)
       └── Scanner Bridge (spawns Python subprocess)
            └── Python Engine
                 ├── File Collector → Language Detector → Source Parser
                 ├── Rule Executor  → 13 rules in rules/
                 └── Finding Normalizer → Security Scorer
```

Every layer has a single responsibility (see `docs/` and each folder's
own README for details). New security rules can be added to `rules/`
without touching the engine or extension code at all.

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
Produces an installable `sentricodex-<version>.vsix`. This bundles the
Python engine and all rules into the package automatically — see
`extension/scripts/bundle-engine.js`.

## Testing

See [docs/TESTING.md](docs/TESTING.md) for the full strategy. Quick
version:
```bash
pytest -v                    # Python: engine + rules
cd extension
npm run test:unit            # TypeScript: pure logic
npm run test:integration     # TypeScript: real VS Code instance
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

See [SECURITY.md](SECURITY.md) for our vulnerability disclosure policy.

## License

Licensed under the [MIT License](LICENSE).
