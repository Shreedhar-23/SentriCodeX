from sentricodex.suppressions import is_suppressed


def test_inline_rule_specific_suppression():
    lines = [
        'password = "demo"  # sentricodex: ignore SCX-SECRET-003',
    ]
    assert is_suppressed(lines, 1, "SCX-SECRET-003")
    assert not is_suppressed(lines, 1, "SCX-SECRET-004")


def test_inline_bare_suppression_hides_all_rules_on_line():
    lines = ['eval(user_input)  # sentricodex: ignore']
    assert is_suppressed(lines, 1, "SCX-UNSAFE-001")
    assert is_suppressed(lines, 1, "SCX-INJECTION-001")


def test_file_suppression_applies_to_matching_rule_only():
    lines = [
        '# sentricodex: ignore-file SCX-SECRET-003',
        'password = "demo"',
    ]
    assert is_suppressed(lines, 2, "SCX-SECRET-003")
    assert not is_suppressed(lines, 2, "SCX-SECRET-004")


def test_file_suppression_can_be_anywhere_in_file():
    lines = ['x = 1', '# sentricodex: ignore-file SCX-SECRET-003', 'password = "demo"']
    assert is_suppressed(lines, 3, "SCX-SECRET-003")


def test_no_marker_does_not_suppress():
    lines = ['password = "demo"']
    assert not is_suppressed(lines, 1, "SCX-SECRET-003")


def test_case_insensitive_rule_id_and_marker():
    lines = ['password = "demo"  # SENTRICODEX: IGNORE scx-secret-003']
    assert is_suppressed(lines, 1, "SCX-SECRET-003")
