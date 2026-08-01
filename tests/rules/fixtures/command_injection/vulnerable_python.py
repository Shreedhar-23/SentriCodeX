import os


def ping_host(hostname):
    os.system(f"ping -c 1 {hostname}")
