"""Allows invocation as `python -m sentricodex --path <target>`."""

from __future__ import annotations

import sys

from sentricodex.cli import main

if __name__ == "__main__":
    sys.exit(main())
