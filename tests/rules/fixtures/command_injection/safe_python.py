import subprocess


def ping_host(hostname):
    subprocess.run(["ping", "-c", "1", hostname], check=True)


def ping_host_multiline(hostname):
    subprocess.run(
        ["ping", "-c", "1", hostname],
        check=True,
    )
