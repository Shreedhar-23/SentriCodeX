# SentriCodeX Roadmap

## Development Phases (v1.0) — Complete

- [x] **Phase 1** — Planning & Setup
- [x] **Phase 2** — Extension Foundation (TypeScript, commands, Activity Bar, Sidebar)
- [x] **Phase 3** — Python Scanner (CLI, file collector, parser, finding model)
- [x] **Phase 4** — Rule Engine (13 security rules, severity model)
- [x] **Phase 5** — Dashboard (Security Score, Scanner Bridge, findings table)
- [x] **Phase 6** — Reports & History
- [x] **Phase 7** — Testing (Python: 89 tests; TypeScript: unit + integration)
- [x] **Phase 8** — Packaging (bundled VSIX, dual-mode engine resolution)
- [x] **Phase 9** — Marketplace assets (icon, banner, metadata, publishing guide)
- [x] **Phase 10** — Roadmap formalization, CI/CD, rule-authoring guide

## Post-v1.0 Roadmap

- **v1.5** — Improved rules and reports
  - Additional rules per category (see `rules/README.md` for how to contribute one)
  - Report format refinements based on real-world usage feedback
- **v2.0** — Plugin architecture
  - The rule system (`rules/` + `RuleRegistry`) already supports adding
    rules without engine changes; v2.0 formalizes this into installable
    third-party rule packs (e.g. `pip install sentricodex-rules-django`)
- **v3.0** — Enterprise collaboration & advanced analytics
  - Team-wide dashboards, shared policy configuration, compliance
    reporting — all while preserving the local-first scanning core

## Future Enhancement Areas (from the Future Roadmap & Enterprise
Features specification)

| Area | Planned Direction | Status |
|---|---|---|
| AI | Optional finding explanations and remediation guidance | Not started — must remain optional, local-only operation stays fully supported |
| Plugins | Custom analyzers and installable rule packs | Foundation complete (Phase 4's `RuleRegistry`); packaging as installable distributions is v2.0 |
| Enterprise | Team dashboards and shared policies | Not started |
| CI/CD | Automated repository scanning | **Available today** — see `docs/CI_INTEGRATION.md`; a dedicated reusable GitHub Action is tracked for a future release |
| Languages | Java, C, C++, C#, Go, Rust, PHP, Kotlin, Swift, Dart | Not started — v1 covers Python, JS/TS/React, HTML, CSS, JSON, YAML, Dockerfile |
| Performance | Incremental scanning, intelligent caching | Not started — current scans are fast enough for v1's rule count, but this matters as rule count grows |
| Community | Open-source collaboration | Issue templates in place (`.github/ISSUE_TEMPLATE/`); contribution guide in `CONTRIBUTING.md` |

## Long-Term Maintenance Commitments

- Semantic Versioning for every release (`CHANGELOG.md` tracks changes)
- Dependencies reviewed and updated regularly
- Compatibility maintained with new VS Code releases
- `docs/TESTING.md`'s release checklist run before every version bump
