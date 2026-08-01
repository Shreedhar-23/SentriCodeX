import os


def connect_to_database():
    password = os.environ.get("DB_PASSWORD")
    return password
