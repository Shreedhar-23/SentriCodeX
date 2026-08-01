import os


def call_external_service():
    api_key = os.environ.get("SERVICE_API_KEY")
    return api_key
