"""Rule execution against parsed source files.

Responsibility:
    - Run every rule applicable to a ParsedSource's language and collect
      their RawMatch results.
    - Isolate failures: if one rule raises an exception, log it and
      continue with the remaining rules, per PDF 4 Section 9 ("continue
      scanning unaffected files where possible").
"""

from __future__ import annotations

from sentricodex.logger import get_logger
from sentricodex.models import ParsedSource, RawMatch
from sentricodex.rule_base import RuleRegistry

logger = get_logger()


class RuleExecutor:
    """Runs applicable rules from a RuleRegistry against parsed source."""

    def __init__(self, registry: RuleRegistry | None = None) -> None:
        # Defaults to an empty registry. In this phase no rules are
        # registered yet (that begins in Phase 4), so execute() will
        # correctly and legitimately return an empty list.
        self._registry = registry if registry is not None else RuleRegistry()

    def execute(self, source: ParsedSource) -> list[RawMatch]:
        matches: list[RawMatch] = []
        applicable_rules = self._registry.rules_for_language(source.language)

        for rule in applicable_rules:
            try:
                matches.extend(rule.check(source))
            except Exception as exc:  # noqa: BLE001 - intentional: one bad
                # rule must never abort the whole scan.
                logger.error(
                    f"Rule '{rule.rule_id}' raised an error on "
                    f"{source.path}: {exc}"
                )
                continue

        return matches
