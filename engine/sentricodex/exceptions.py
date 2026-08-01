"""Custom exceptions for the SentriCodeX scanning engine.

Using specific exception types (rather than bare Exception) lets callers
such as the CLI distinguish between user error (bad path), recoverable
per-file problems, and genuine internal engine failures, and respond to
each appropriately.
"""

from __future__ import annotations


class SentriCodeXError(Exception):
    """Base class for all SentriCodeX engine errors."""


class ScanTargetNotFoundError(SentriCodeXError):
    """Raised when the requested scan target does not exist on disk."""


class ScannerError(SentriCodeXError):
    """Raised for recoverable, per-file scanning failures (e.g. unreadable
    file). Callers may choose to log and continue scanning other files.
    """
