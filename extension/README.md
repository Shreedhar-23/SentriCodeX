# SentriCodeX

**Local-first static security analysis for VS Code.** Scan your code, find real vulnerabilities, and get fix guidance — without your source ever leaving your machine.

## Features

- **Scan Current File** or **Scan Workspace** directly from the sidebar
- **14 security rules** across secrets, injection, unsafe APIs, cryptography, configuration, and best practices — some using AST-based detection for higher accuracy, not just pattern matching
- **Security Score** (0–100) with a clear, auditable formula
- **Interactive Dashboard** — severity breakdown, findings table with search/sort/filter
- **Scan History** — every scan recorded with full results; view, download a report, or compare any two scans (fingerprint-matched diff)
- **Export reports** as HTML, JSON, or Markdown
- **Inline suppression comments** for reviewed, accepted findings
- **100% local** — no network calls, no telemetry, nothing leaves your machine

## Supported Languages

Python, JavaScript, TypeScript, React (JSX/TSX), HTML, CSS, JSON, YAML, Dockerfile.

## Requirements

- Python 3.10+ installed and on your PATH (or configure `sentricodex.pythonPath` to point at your interpreter)

## Getting Started

1. Install the extension
2. Click the SentriCodeX icon in the Activity Bar
3. Open a file or folder you want to check
4. Click **Scan Current File** or **Scan Workspace**
5. Review results in the Dashboard that opens

## Viewing Past Scans

Click **View History** in the sidebar. Every past scan is listed with
its Security Score and finding count. Use the **⋮** menu on any row to
view its full report or download it. Check two rows and click
**Compare Selected** to see exactly what changed between two scans.

## Suppressing a Finding

Add an inline comment on the flagged line:
```
# sentricodex: ignore SCX-SECRET-001
```
Or suppress a rule for the whole file:
```
# sentricodex: ignore-file SCX-SECRET-001
```

## Settings

| Setting | Default | Description |
|---|---|---|
| `sentricodex.pythonPath` | `python` | Command/path used to invoke Python |
| `sentricodex.scanOnSave` | `false` | Automatically rescan on save |
| `sentricodex.excludedFolders` | `["node_modules", ".git", "dist", "out"]` | Folders skipped during workspace scans |
| `sentricodex.defaultReportFormat` | `html` | Pre-selected format when downloading a report |

## Known Limitations (v1)

- Most rules use pattern/regex-based detection, not full semantic
  analysis — very good at common, high-signal issues, but not a
  replacement for a full SAST platform. A few rules (`eval`/`exec`,
  unsafe deserialization) use real AST parsing for higher precision.
- Report generation and download require at least one scan recorded
  in History.

## Privacy & Security

SentriCodeX processes all source code locally. No file contents are ever transmitted anywhere. See [SECURITY.md](https://github.com/sentricodex/sentricodex/blob/main/SECURITY.md) for the full policy.

## License

MIT — see [LICENSE](LICENSE).
