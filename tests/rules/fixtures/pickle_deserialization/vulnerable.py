import pickle


def load_user_session(data: bytes):
    return pickle.loads(data)
