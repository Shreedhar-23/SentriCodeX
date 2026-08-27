"""Shared AST helpers for rules that inspect Python's real syntax tree
instead of matching text.

Complements rules/_common.py's regex-based iter_line_matches. See
rules/README.md's "AST-Based Rules" section for when to prefer this
approach over regex: primarily when a rule needs to distinguish an
actual function call from mere text that happens to mention a
function's name (in a comment, string literal, or as a substring of
another identifier) - a distinction regex fundamentally cannot make,
since it only ever sees text, never syntax.
"""

from __future__ import annotations

import ast
from collections.abc import Iterator


class SourceSyntaxError(Exception):
    """Raised when Python source cannot be parsed into an AST.

    Rules should catch this and return an empty match list rather than
    letting a syntax error in the SCANNED file (not a bug in
    SentriCodeX) abort analysis of that file - a file with invalid
    Python syntax has bigger problems than any one rule can usefully
    report on.
    """


def parse_python_ast(source_code: str) -> ast.Module:
    """Parses Python source into an AST, raising SourceSyntaxError
    (not the built-in SyntaxError) on invalid syntax, so callers have
    one exception type to catch regardless of the underlying cause.
    """
    try:
        return ast.parse(source_code)
    except SyntaxError as exc:
        raise SourceSyntaxError(f"Could not parse Python source: {exc}") from exc


def iter_direct_call_nodes(
    tree: ast.AST, function_names: frozenset[str]
) -> Iterator[ast.Call]:
    """Yields Call nodes for direct function calls by bare name, e.g.
    eval(...) or exec(...) - not attribute calls like ast.literal_eval(...).

    This is what makes AST detection precise where regex could not be:
    a call to a function literally named "eval" is structurally
    distinct from an attribute named "eval" on some other object
    (e.g. "namespace.eval(...)" would NOT match here, matching
    Python's own scoping rules rather than a text pattern).
    """
    for node in ast.walk(tree):
        if (
            isinstance(node, ast.Call)
            and isinstance(node.func, ast.Name)
            and node.func.id in function_names
        ):
            yield node


def iter_module_attribute_calls(
    tree: ast.AST, module_name: str, function_names: frozenset[str]
) -> Iterator[ast.Call]:
    """Yields Call nodes shaped like `<module_name>.<function>(...)`,
    e.g. pickle.loads(...).

    Does not attempt to resolve import aliases (e.g. `import pickle as
    pk` would not be matched) - this matches the same scope as the
    regex pattern it replaces, trading some coverage of aliased
    imports for zero false positives on text that merely mentions the
    pattern without calling it.
    """
    for node in ast.walk(tree):
        if (
            isinstance(node, ast.Call)
            and isinstance(node.func, ast.Attribute)
            and isinstance(node.func.value, ast.Name)
            and node.func.value.id == module_name
            and node.func.attr in function_names
        ):
            yield node
