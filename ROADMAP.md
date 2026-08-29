# SentriCodeX Roadmap

## Development Phases (v1.0) — Complete

- [x] **Phase 1** — Planning & Setup
- [x] **Phase 2** — Extension Foundation (TypeScript, commands, Activity Bar, Sidebar)
- [x] **Phase 3** — Python Scanner (CLI, file collector, parser, finding model)
- [x] **Phase 4** — Rule Engine (13 security rules, severity model)
- [x] **Phase 5** — Dashboard (Security Score, Scanner Bridge, findings table)
- [x] **Phase 6** — Reports & History
- [x] **Phase 7** — Testing (Python + TypeScript, unit + integration)
- [x] **Phase 8** — Packaging (bundled VSIX, dual-mode engine resolution)
- [x] **Phase 9** — Marketplace assets (icon, banner, metadata, publishing guide)
- [x] **Phase 10** — Roadmap formalization, CI/CD, rule-authoring guide

## Post-v1.0 Improvements — Complete

- [x] Scan History redesign: full results per entry, View/Download
  Report, and Compare Selected (fingerprint-matched diff)
- [x] New rule: `SCX-UNSAFE-004`, Unsafe Deserialization (`pickle.loads()`)
- [x] AST-based detection for `SCX-UNSAFE-001` and `SCX-UNSAFE-004`
  (eliminates false positives from text mentions vs. real calls)
- [x] Multi-line detection fix for `SCX-INJECTION-001` and
  `SCX-INJECTION-002` (a vulnerable call split across lines was
  previously invisible to line-based matching)
- [x] Inline suppression comments (`# sentricodex: ignore <RULE_ID>`,
  `# sentricodex: ignore-file <RULE_ID>`)

## Future Roadmap (not yet started)

- **Dependency vulnerability scanning** — checking `requirements.txt`/
  `package.json` against known-vulnerable package versions.
  `Category.DEPENDENCY` has existed in the schema since Phase 3 but
  has no rules using it yet; this is the natural next capability to
  add.
- **v1.5** — Additional rules per category (see `rules/README.md` for
  how to contribute one)
- **v2.0** — Plugin architecture: the rule system already supports
  adding rules without engine changes; this formalizes it into
  installable third-party rule packs
- **v3.0** — Enterprise collaboration & advanced analytics: team-wide
  dashboards, shared policy configuration, compliance reporting — all
  while preserving the local-first scanning core

## Future Enhancement Areas (from the Future Roadmap & Enterprise
Features specification)

| Area | Planned Direction | Status |
|---|---|---|
| AI | Optional finding explanations and remediation guidance | Not started — must remain optional, local-only operation stays fully supported |
| Plugins | Custom analyzers and installable rule packs | Foundation complete (`RuleRegistry`); packaging as installable distributions is v2.0 |
| Enterprise | Team dashboards and shared policies | Not started |
| CI/CD | Automated repository scanning | Available today — see `docs/CI_INTEGRATION.md`; a dedicated reusable GitHub Action is a future item |
| Dependencies | Known-vulnerable package detection | Not started — see "Future Roadmap" above |
| Languages | Java, C, C++, C#, Go, Rust, PHP, Kotlin, Swift, Dart | Not started — v1 covers Python, JS/TS/React, HTML, CSS, JSON, YAML, Dockerfile |
| Performance | Incremental scanning, intelligent caching | Not started |
| Community | Open-source collaboration | Issue templates in place (`.github/ISSUE_TEMPLATE/`); contribution guide in `CONTRIBUTING.md` |

## Long-Term Maintenance Commitments

- Semantic Versioning for every release (`CHANGELOG.md` tracks changes)
- Dependencies reviewed and updated regularly
- Compatibility maintained with new VS Code releases
- `docs/TESTING.md`'s release checklist run before every version bump
