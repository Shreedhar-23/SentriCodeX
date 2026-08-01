import random


def generate_session_token():
    return str(random.randint(100000, 999999))
