# SentriCodeX

**A local-first Visual Studio Code extension for static security analysis.**

SentriCodeX scans your source code directly inside VS Code, detects common
security issues, displays findings as native diagnostics, generates
professional reports, and keeps a local scan history — without ever
uploading your code to an external server.

> ⚠️ **Project status:** Under active development (Phase 1 — Planning &
> Setup). Not yet functional. This README will be updated as each phase is
> completed.

## Why SentriCodeX?

Many developers discover security problems late in the development
lifecycle — often only when a scanner runs in CI, or worse, in production.
SentriCodeX aims to surface common security issues **earlier**, right where
code is written, while keeping everything 100% local for privacy.

## Key Goals

- Detect common security issues (secrets, injection, unsafe APIs, weak
  crypto, misconfiguration, and more).
- Provide real-time, in-editor feedback via VS Code diagnostics.
- Generate professional HTML, JSON, and Markdown reports.
- Maintain local scan history — nothing leaves your machine.
- Stay modular and extensible for future languages and rules.

## Supported Languages (v1 target)

Python, JavaScript, TypeScript, React (JSX/TSX), HTML, CSS, JSON, YAML,
Dockerfile.

## Project Structure

```
SentriCodeX/
├── extension/    # VS Code extension (TypeScript) — UI, commands, diagnostics
├── engine/       # Python static analysis engine
├── rules/        # Individual, pluggable security rule modules
├── dashboard/    # Webview dashboard (HTML/CSS/JS)
├── reports/      # Generated HTML/JSON/Markdown reports
├── storage/      # Local scan history & settings (JSON)
├── tests/        # Unit, integration, and regression tests
├── docs/         # Architecture notes and developer documentation
├── assets/       # Icons, banners, screenshots
├── scripts/      # Build and packaging helper scripts
└── .github/      # Issue templates, PR templates, CI workflows
```

## Technology Stack

| Layer | Technology |
|---|---|
| Extension | TypeScript + VS Code Extension API |
| Security Engine | Python 3.14 |
| Dashboard | HTML / CSS / JavaScript (Webview) |
| Packaging | VSIX / VS Code Marketplace |

## Getting Started

Setup and build instructions will be added as each development phase is
completed (see [ROADMAP.md](ROADMAP.md)).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

See [SECURITY.md](SECURITY.md) for our vulnerability disclosure policy.

## License

Licensed under the [MIT License](LICENSE).
