import ast


def run_expression(expr):
    # Do not use eval() here - literal_eval is the safe alternative.
    return ast.literal_eval(expr)


def describe_this_module():
    return "This module never calls eval(x) or exec(x) directly."
