import subprocess


def list_files(directory):
    subprocess.run(["ls", directory])
