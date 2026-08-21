"""SentriCodeX security rules package.

This is the single source of truth for which rules are active in the
scanner. engine/sentricodex/rule_loader.py imports ALL_RULES (a list of
ready-to-use Rule instances) from here and registers each one - adding
a new rule means adding one import and one instance to this list, with
zero changes required anywhere in engine/.
"""
from rules.unsafe_apis.pickle_deserialization import PickleDeserializationRule
from rules.best_practices.security_todo_comment import SecurityTodoCommentRule
from rules.configuration.debug_mode_enabled import DebugModeEnabledRule
from rules.cryptography.insecure_randomness import InsecureRandomnessRule
from rules.cryptography.weak_hash_algorithm import WeakHashAlgorithmRule
from rules.injection.command_injection import CommandInjectionRule
from rules.injection.cross_site_scripting import CrossSiteScriptingRule
from rules.injection.sql_injection import SqlInjectionRule
from rules.secrets.hardcoded_api_key import HardcodedApiKeyRule
from rules.secrets.hardcoded_password import HardcodedPasswordRule
from rules.secrets.private_key_in_source import PrivateKeyInSourceRule
from rules.unsafe_apis.javascript_eval import JavaScriptEvalRule
from rules.unsafe_apis.python_eval_exec import PythonEvalExecRule
from rules.unsafe_apis.shell_true import ShellTrueRule
from sentricodex.rule_base import Rule

ALL_RULES: list[Rule] = [
    # Secrets
    HardcodedPasswordRule(),
    HardcodedApiKeyRule(),
    PrivateKeyInSourceRule(),
    # Injection
    SqlInjectionRule(),
    CommandInjectionRule(),
    CrossSiteScriptingRule(),
    # Unsafe APIs
    PickleDeserializationRule(),
    PythonEvalExecRule(),
    JavaScriptEvalRule(),
    ShellTrueRule(),
    # Cryptography
    WeakHashAlgorithmRule(),
    InsecureRandomnessRule(),
    # Configuration
    DebugModeEnabledRule(),
    # Best Practices
    SecurityTodoCommentRule(),
]
