"""Security Score calculation (PDF 2, FR-05).

Responsibility:
    - Convert a set of findings into a single 0-100 score representing
      overall code security health.

The formula is a deliberately simple, deterministic weighted deduction:
start at 100 and subtract a fixed penalty per finding based on its
severity, floored at 0. This satisfies FR-05's acceptance criterion of
a "stable score" - identical findings always produce an identical
score - and is simple enough to explain to a user asking "why is my
score X?"

This is intentionally NOT machine-learned or otherwise opaque: a
security tool's own scoring logic should be as auditable as the issues
it reports.
"""

from __future__ import annotations

from sentricodex.models import Finding, Severity

MAX_SCORE = 100
MIN_SCORE = 0

# Points deducted per finding, by severity. Chosen so that a handful of
# Critical findings meaningfully tank the score, while Informational
# findings (e.g. security TODO comments) don't affect it at all - they
# are visibility aids, not health problems.
_SEVERITY_PENALTIES: dict[Severity, int] = {
    Severity.CRITICAL: 25,
    Severity.HIGH: 15,
    Severity.MEDIUM: 7,
    Severity.LOW: 3,
    Severity.INFORMATIONAL: 0,
}


def calculate_security_score(findings: list[Finding]) -> int:
    """Returns a 0-100 security score for the given findings.

    Starts at MAX_SCORE and subtracts each finding's severity penalty,
    floored at MIN_SCORE so the score never goes negative.
    """
    score = MAX_SCORE
    for finding in findings:
        score -= _SEVERITY_PENALTIES[finding.severity]

    return max(MIN_SCORE, score)
