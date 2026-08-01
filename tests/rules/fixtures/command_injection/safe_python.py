import subprocess


def ping_host(hostname):
    subprocess.run(["ping", "-c", "1", hostname], check=True)
