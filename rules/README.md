# Adding a New Security Rule to SentriCodeX

SentriCodeX's rule system was built from Phase 4 onward to let new
rules be added **without changing any code in `engine/`**. This guide
walks through adding one, using a real (simplified) example.

## 1. Pick a category folder

Rules live under `rules/<category>/`, matching the six categories from
the Scanner & Rule Engine Specification:

| Folder | Category |
|---|---|
| `rules/secrets/` | Hardcoded credentials |
| `rules/injection/` | SQL/command injection, XSS |
| `rules/unsafe_apis/` | Dangerous language/library APIs |
| `rules/cryptography/` | Weak hashes, insecure randomness |
| `rules/configuration/` | Insecure settings |
| `rules/best_practices/` | Risky patterns, flagged TODOs |

## 2. Write the rule

Every rule extends `Rule` from `engine/sentricodex/rule_base.py` and
implements one method: `check()`. Here's a real example detecting
Python's `pickle.loads()` (unsafe deserialization) — see
`rules/unsafe_apis/pickle_deserialization.py` for the full working
version:

```python
# rules/unsafe_apis/pickle_deserialization.py
"""SCX-UNSAFE-004: Unsafe Deserialization via pickle.loads()."""

from __future__ import annotations

import re

from rules._common import iter_line_matches
from sentricodex.models import Category, Confidence, Language, ParsedSource, RawMatch, Severity
from sentricodex.rule_base import Rule

_PATTERN = re.compile(r"pickle\.loads?\s*\(")


class PickleDeserializationRule(Rule):
    rule_id = "SCX-UNSAFE-004"
    title = "Unsafe Deserialization (pickle)"
    category = Category.UNSAFE_APIS
    severity = Severity.HIGH
    description = (
        "pickle.load()/loads() can execute arbitrary code when "
        "deserializing untrusted data."
    )
    recommendation = "Use json or another safe serialization format for untrusted input."
    supported_languages = frozenset({Language.PYTHON})

    def check(self, source: ParsedSource) -> list[RawMatch]:
        matches = []
        for line_number, column, _match in iter_line_matches(source.lines, _PATTERN):
            matches.append(
                RawMatch(
                    rule_id=self.rule_id,
                    title=self.title,
                    severity=self.severity,
                    confidence=Confidence.HIGH,
                    category=self.category,
                    description=self.description,
                    recommendation=self.recommendation,
                    line=line_number,
                    column=column,
                )
            )
        return matches
```

**Rule ID convention:** `SCX-<CATEGORY>-<NNN>`, incrementing within
that category (check existing rules in the same folder for the next
number).

## 3. Register it

Add two lines to `rules/__init__.py`:
```python
from rules.unsafe_apis.pickle_deserialization import PickleDeserializationRule
# ...
ALL_RULES: list[Rule] = [
    # ...
    PickleDeserializationRule(),
]
```
That's the **only** file outside your new rule's own file that needs
editing. `engine/sentricodex/rule_loader.py`, `scanner.py`, and
everything else picks it up automatically.

## 4. Add vulnerable + safe fixtures

Per the Scanner & Rule Engine Specification, every rule needs both:
```
tests/rules/fixtures/pickle_deserialization/vulnerable.py
tests/rules/fixtures/pickle_deserialization/safe.py
```

## 5. Write the test

```python
# tests/rules/test_pickle_deserialization.py
from rules.unsafe_apis.pickle_deserialization import PickleDeserializationRule
from tests.rules._helpers import FIXTURES_DIR, run_rule_against_fixture

_RULE = PickleDeserializationRule()
_DIR = FIXTURES_DIR / "pickle_deserialization"

def test_flags_pickle_loads():
    matches = run_rule_against_fixture(_RULE, _DIR / "vulnerable.py")
    assert len(matches) == 1

def test_does_not_flag_json_loads():
    matches = run_rule_against_fixture(_RULE, _DIR / "safe.py")
    assert matches == []
```

## 6. Verify

```bash
pytest tests/rules/test_pickle_deserialization.py -v
python -m mypy rules engine/sentricodex --ignore-missing-imports
```

That's the complete cycle for a regex-based rule. No changes to
`Scanner`, `RuleExecutor`, `FileCollector`, or any TypeScript code —
the extensibility mechanism built in Phase 4 is exactly what makes
that true.

## AST-Based Rules (an alternative to regex)

`Rule.check()`'s contract is just "return `RawMatch` objects" — it
never mandates *how*. Regex is simple and works well for most
patterns, but it has one structural blind spot: it cannot distinguish
"this code actually calls `eval()`" from "this comment/string merely
*mentions* eval()". Two rules — `SCX-UNSAFE-001` (Python eval/exec)
and `SCX-UNSAFE-004` (pickle deserialization) — were upgraded from
regex to AST-based detection specifically to close that gap.

### When to prefer AST over regex

- The pattern is a genuine function/method **call**, not just text
  (eval/exec, pickle.loads, etc.) — this is the main case
- False positives from comments, strings, or similar identifiers are a
  real problem for the pattern in question
- The language has a standard library AST module (Python: `ast`).
  SentriCodeX has no equivalent built-in parser for JS/TS — an AST
  rule for those languages would need a real parser dependency, a
  bigger decision than adding one Python rule

### How it works

`rules/_ast_common.py` provides two helpers:

- `iter_direct_call_nodes(tree, {"eval", "exec"})` — bare-name calls
- `iter_module_attribute_calls(tree, "pickle", {"load", "loads"})` —
  `module.function(...)` calls

A rule using either looks like:

```python
from rules._ast_common import SourceSyntaxError, iter_direct_call_nodes, parse_python_ast

def check(self, source: ParsedSource) -> list[RawMatch]:
    try:
        tree = parse_python_ast(source.content)
    except SourceSyntaxError:
        return []  # Invalid syntax in the scanned file, not our bug.

    matches = []
    for call_node in iter_direct_call_nodes(tree, _TARGET_FUNCTIONS):
        matches.append(RawMatch(..., line=call_node.lineno, column=call_node.col_offset + 1))
    return matches
```

See `rules/unsafe_apis/python_eval_exec.py` for the complete working
example, and `tests/rules/test_python_eval_exec.py` for how to write a
regression test proving a specific false positive is gone — the most
convincing test for an AST upgrade is a fixture containing exactly the
text that used to fool the regex version.
