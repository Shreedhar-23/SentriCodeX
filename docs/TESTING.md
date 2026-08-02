# SentriCodeX Testing Strategy

This document describes how SentriCodeX is tested, mirroring the
categories defined in the Testing & Quality Assurance Specification.

## Test Tiers

### Python Engine (`engine/`, `rules/`)

| Tier | Location | Run with |
|---|---|---|
| Unit — scanner components | `tests/engine/` | `pytest` |
| Unit — rule detection (vulnerable + safe fixtures) | `tests/rules/` | `pytest` |
| Integration — real CLI subprocess | `tests/engine/test_cli.py` | `pytest` |
| Performance — smoke-level timing bounds | `tests/engine/test_performance.py` | `pytest` |

Run everything: `pytest -v` from the project root. As of this phase:
**88 tests pass, 1 intentionally skipped** (a root-permission edge case
that only applies to non-root users — see `test_parser.py`).

Type checking: `python -m mypy rules engine/sentricodex --ignore-missing-imports`

### TypeScript Extension (`extension/`)

| Tier | Location | Run with |
|---|---|---|
| Unit — pure logic, no VS Code required | `extension/test/unit/` | `npm run test:unit` |
| Integration — real VS Code instance | `extension/test/suite/` | `npm run test:integration` |

**Why two tiers?** Most of the extension's business logic (report
formatting, JSON parsing) has zero dependency on the `vscode` module
and can be tested instantly with Node's built-in test runner. Logic
that genuinely needs VS Code (command registration, webview creation,
configuration contributions) is tested with the official
`@vscode/test-electron` framework, which launches a real, headless VS
Code instance.

**A note on this repository's environment:** `npm run test:unit` runs
in any standard environment. `npm run test:integration` requires
network access (to download a VS Code test binary on first run) and a
display — it will not run inside a fully sandboxed CI runner without
additional setup (e.g. `xvfb` on Linux), but works normally on a
developer's own machine.

Compile check: `npm run compile` · Lint: `npm run lint`

## What Each Category Covers

- **Unit Testing** — individual rules (13, each with vulnerable/safe
  fixtures), scanner components (collector, parser, normalizer,
  scorer), and TypeScript utilities (`ReportGenerator`, `resultParser`).
- **Integration Testing** — the real CLI subprocess contract
  (`test_cli.py`, mirroring exactly how `ScannerBridge` invokes
  Python), and real VS Code activation/command registration
  (`extension.test.ts`).
- **Rule Validation** — every rule has a vulnerable fixture (must
  trigger) and a safe fixture (must stay silent), catching both false
  negatives and false positives.
- **Performance Testing** — smoke-level time bounds on scanning and
  file collection; not a full benchmark suite, but enough to catch a
  gross regression (e.g. an accidental quadratic loop).
- **Error Handling** — non-UTF-8 files, unreadable files, nonexistent
  scan targets, missing CLI arguments — all covered with tests
  asserting the *specific* failure mode (clean exit code, structured
  stderr) rather than just "doesn't crash."
- **Regression Testing** — the full suite (Python + TypeScript unit)
  runs in well under a second combined, so it's cheap to run after
  every change; there's no excuse not to.

## Release Checklist

Before considering a release-worthy state:

- [ ] `pytest -v` — all tests pass (or skip with a documented reason)
- [ ] `python -m mypy rules engine/sentricodex --ignore-missing-imports` — clean
- [ ] `npm run compile` — clean
- [ ] `npm run lint` — clean
- [ ] `npm run test:unit` — all tests pass
- [ ] `npm run test:integration` — all tests pass (run locally; requires network + display)
- [ ] Manual F5 smoke test: scan a real file, confirm Dashboard/Reports/History all work
- [ ] `README.md` and `engine/README.md` reflect current functionality
