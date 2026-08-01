"""Loads the concrete security rules from the top-level rules/ package
into a RuleRegistry.

This module is the one deliberate coupling point between the engine and
the rules package. It exists so that:
    - The Scanner and RuleExecutor never need to know about specific
      rule classes (they only depend on the abstract Rule/RuleRegistry
      contracts from rule_base.py).
    - rules/ can be extended with new rule modules without any changes
      to engine/ code — only rules/__init__.py's ALL_RULES list needs
      to grow.
"""

from __future__ import annotations

import sys
from pathlib import Path

from sentricodex.logger import get_logger
from sentricodex.rule_base import RuleRegistry

logger = get_logger()


def _ensure_repo_root_on_path() -> Path:
    """rules/ lives at the project root, as a sibling of engine/ - not
    inside the sentricodex package. To import it regardless of the
    current working directory, we locate the repository root relative
    to this file and add it (and engine/, so rule modules can import
    sentricodex) to sys.path if not already present.
    """
    # This file is at: <repo_root>/engine/sentricodex/rule_loader.py
    engine_dir = Path(__file__).resolve().parents[1]
    repo_root = engine_dir.parent

    for path in (repo_root, engine_dir):
        if str(path) not in sys.path:
            sys.path.insert(0, str(path))

    return repo_root


def load_default_registry() -> RuleRegistry:
    """Builds a RuleRegistry populated with every rule declared in the
    rules/ package's ALL_RULES list.

    If the rules package cannot be found or imported (e.g. it was
    removed, or a rule module has a bug), this logs a warning and
    returns an empty registry rather than crashing the scanner - a
    scan with zero rules is still a valid, if less useful, outcome.
    """
    _ensure_repo_root_on_path()
    registry = RuleRegistry()

    try:
        from rules import ALL_RULES
    except ImportError as exc:
        logger.warning(f"Could not load rules package: {exc}")
        return registry

    for rule in ALL_RULES:
        registry.register(rule)

    logger.info(f"Loaded {len(registry)} security rule(s).")
    return registry
