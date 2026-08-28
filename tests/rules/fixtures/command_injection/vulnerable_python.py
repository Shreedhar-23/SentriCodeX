import os


def ping_host(hostname):
    os.system(f"ping -c 1 {hostname}")


def ping_host_multiline(hostname):
    os.system(
        f"ping -c 1 {hostname}"
    )
