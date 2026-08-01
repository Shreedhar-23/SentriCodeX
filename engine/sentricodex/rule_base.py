"""The Rule interface and registry — the extensibility contract that
Phase 4's actual security rules will implement and register against.

Responsibility:
    - Define the common interface every security rule must follow
      (PDF 5, Section 4: "Rules are independent modules with unique
      IDs, severity, description, recommendation, and detection
      logic").
    - Provide a registry rules can attach themselves to, so the Scanner
      and RuleExecutor never need to know about specific rule classes.

This phase intentionally registers zero concrete rules — that is
Phase 4's responsibility. The mechanism here is complete and fully
functional; it simply has nothing plugged into it yet.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from sentricodex.models import Category, Language, ParsedSource, RawMatch, Severity


class Rule(ABC):
    """Base class every SentriCodeX security rule must extend.

    Concrete rules (added in Phase 4) live in the top-level rules/
    folder, not inside engine/, so that new rules never require changes
    to the scanning engine itself.
    """

    rule_id: str
    title: str
    category: Category
    severity: Severity
    description: str
    recommendation: str
    supported_languages: frozenset[Language]

    @abstractmethod
    def check(self, source: ParsedSource) -> list[RawMatch]:
        """Analyzes a single parsed source file and returns zero or more
        RawMatch instances for any issues detected. Must not raise for
        expected "no issues found" cases — return an empty list instead.
        """
        raise NotImplementedError


class RuleRegistry:
    """Holds every Rule instance available to the scanner."""

    def __init__(self) -> None:
        self._rules: list[Rule] = []

    def register(self, rule: Rule) -> None:
        """Adds a rule instance to the registry. Rule modules call this
        (directly or via a discovery mechanism added in Phase 4) to make
        themselves available to the scanner.
        """
        self._rules.append(rule)

    def rules_for_language(self, language: Language) -> list[Rule]:
        """Returns every registered rule applicable to the given
        language, preserving registration order.
        """
        return [rule for rule in self._rules if language in rule.supported_languages]

    def all_rules(self) -> list[Rule]:
        """Returns every registered rule, regardless of language."""
        return list(self._rules)

    def __len__(self) -> int:
        return len(self._rules)
