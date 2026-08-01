import subprocess


def list_files(directory):
    subprocess.run(f"ls {directory}", shell=True)
