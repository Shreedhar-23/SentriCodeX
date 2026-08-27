"""SCX-UNSAFE-004: Unsafe Deserialization via pickle.loads().

AST-based (upgraded from regex): matches real pickle.load()/loads()
calls - an ast.Call node shaped like `pickle.loads(...)` - rather than
the text substring "pickle.loads(", so a comment or string literal
mentioning it is correctly never flagged.
"""

from __future__ import annotations

from rules._ast_common import SourceSyntaxError, iter_module_attribute_calls, parse_python_ast
from sentricodex.models import Category, Confidence, Language, ParsedSource, RawMatch, Severity
from sentricodex.rule_base import Rule

_PICKLE_MODULE = "pickle"
_TARGET_FUNCTIONS = frozenset({"load", "loads"})


class PickleDeserializationRule(Rule):
    rule_id = "SCX-UNSAFE-004"
    title = "Unsafe Deserialization (pickle)"
    category = Category.UNSAFE_APIS
    severity = Severity.HIGH
    description = (
        "pickle.load()/loads() can execute arbitrary code when "
        "deserializing untrusted data."
    )
    recommendation = (
        "Use json or another safe serialization format for untrusted "
        "input. If pickle is unavoidable, never deserialize data from "
        "an untrusted source."
    )
    supported_languages = frozenset({Language.PYTHON})

    def check(self, source: ParsedSource) -> list[RawMatch]:
        try:
            tree = parse_python_ast(source.content)
        except SourceSyntaxError:
            return []

        matches: list[RawMatch] = []
        for call_node in iter_module_attribute_calls(tree, _PICKLE_MODULE, _TARGET_FUNCTIONS):
            matches.append(
                RawMatch(
                    rule_id=self.rule_id,
                    title=self.title,
                    severity=self.severity,
                    confidence=Confidence.HIGH,
                    category=self.category,
                    description=self.description,
                    recommendation=self.recommendation,
                    line=call_node.lineno,
                    column=call_node.col_offset + 1,
                )
            )
        return matches
