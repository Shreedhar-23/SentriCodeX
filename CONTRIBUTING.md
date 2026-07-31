# Contributing to SentriCodeX

Thank you for your interest in contributing! This document will grow as the
project matures through its development phases.

## Development Philosophy

- Build incrementally, keep modules independent.
- Write readable, maintainable code over clever shortcuts.
- Every change should include tests where applicable.

## Branching Strategy

- `main` — stable, always-working code.
- `feature/<name>` — new features, branched from `main`.
- Pull requests require review before merging.

## Coding Standards

- **Python:** PEP 8, type hints, `pytest` for tests.
- **TypeScript/JavaScript:** ESLint + Prettier, strict mode.

## Commit Messages

Use clear, descriptive commit messages (e.g. `feat: add SQL injection rule`,
`fix: correct severity scoring for secrets`).

## Code Review Checklist

Before submitting a PR, confirm:

- [ ] Code is readable and follows project style
- [ ] Security implications considered
- [ ] Tests added/updated and passing
- [ ] Documentation updated if behavior changed

## Getting Started

Setup instructions will be added once Phase 1 (Planning & Setup) tooling is
finalized.
