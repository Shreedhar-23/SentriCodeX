"""Centralized logging utility for the SentriCodeX scanning engine.

Responsibility:
    - Provide one consistent place to configure and emit log messages.
    - Write to stderr so log output never contaminates the JSON scan
      result printed to stdout (the CLI's actual product).

Security note:
    - Callers must NEVER pass raw file contents, secrets, or matched
      source snippets into these functions. Only file paths, counts,
      rule IDs, and status messages belong in logs. This mirrors the
      "never log sensitive source code or secrets" requirement from the
      architecture specification.
"""

from __future__ import annotations

import logging
import sys

_LOGGER_NAME = "sentricodex"
_configured = False


def configure_logging(verbose: bool = False) -> None:
    """Configures the shared logger. Safe to call multiple times; only
    the first call has any effect.
    """
    global _configured
    if _configured:
        return

    logger = logging.getLogger(_LOGGER_NAME)
    logger.setLevel(logging.DEBUG if verbose else logging.INFO)

    handler = logging.StreamHandler(stream=sys.stderr)
    handler.setFormatter(
        logging.Formatter(
            fmt="[%(asctime)s] [%(levelname)s] %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%S",
        )
    )
    logger.addHandler(handler)
    _configured = True


def get_logger() -> logging.Logger:
    """Returns the shared SentriCodeX logger. Configures it with default
    settings if configure_logging() has not yet been called.
    """
    if not _configured:
        configure_logging()
    return logging.getLogger(_LOGGER_NAME)
