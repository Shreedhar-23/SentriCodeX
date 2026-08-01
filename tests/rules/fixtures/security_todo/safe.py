def authenticate(user, token):
    # TODO: add rate limiting for repeated failed attempts
    return verify_token(user, token)
