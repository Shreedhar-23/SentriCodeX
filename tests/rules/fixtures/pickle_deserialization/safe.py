import json


def load_user_session(data: str):
    # We used to use pickle.loads(data) here, but switched to json
    # because pickle.load() can execute arbitrary code.
    return json.loads(data)
