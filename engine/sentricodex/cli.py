"""Command-line entry point for the SentriCodeX scanning engine.

This is the interface the future Scanner Bridge (VS Code extension side)
will invoke as a subprocess. It is designed to be script-friendly:
    - The scan result JSON is printed exclusively to stdout.
    - All logging and error messages go to stderr.
    - Exit code 0 means the scan ran successfully (even with 0 or many
      findings); non-zero means the scan itself could not be completed.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from sentricodex.exceptions import ScanTargetNotFoundError, SentriCodeXError
from sentricodex.logger import configure_logging, get_logger
from sentricodex.scanner import Scanner

logger = get_logger()


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="sentricodex",
        description="SentriCodeX local-first static security scanner.",
    )
    parser.add_argument(
        "--path",
        required=True,
        help="File or directory to scan.",
    )
    parser.add_argument(
        "--pretty",
        action="store_true",
        help="Pretty-print the JSON output (default: compact single line).",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose (debug-level) logging to stderr.",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_arg_parser()
    args = parser.parse_args(argv)

    configure_logging(verbose=args.verbose)

    try:
        target = Path(args.path)
        result = Scanner().scan(target)
    except ScanTargetNotFoundError as exc:
        logger.error(str(exc))
        _print_error(str(exc))
        return 1
    except SentriCodeXError as exc:
        logger.error(f"Scan failed: {exc}")
        _print_error(str(exc))
        return 1

    indent = 2 if args.pretty else None
    print(json.dumps(result.to_dict(), indent=indent))
    return 0


def _print_error(message: str) -> None:
    print(json.dumps({"error": message}), file=sys.stderr)


if __name__ == "__main__":
    sys.exit(main())
