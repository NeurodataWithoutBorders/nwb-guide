import pytest
import app as flask
import sys
import subprocess
from pathlib import Path
from multiprocessing import Process
import multiprocessing as mp
import os
import time

PORT = 1234
executable_flag = "--executable"
use_executable = executable_flag in sys.argv
is_windows = os.name == "nt"

exe_path = Path("build/flask/nwb-guide", "nwb-guide.exe" if is_windows else "nwb-guide")


def runExecutable(port):
    subprocess.run([exe_path, str(port)])


def pytest_addoption(parser):
    parser.addoption("--executable", action="store_true", help="Run the executable instead of the standard Flask app")


@pytest.fixture(scope="session")
def client(request):
    if use_executable and exe_path.is_file():
        if not is_windows:
            mp.set_start_method("fork")

        exe_process = Process(target=runExecutable, args=(PORT,))
        exe_process.start()
        time.sleep(1)  # Give time to start

        def stop():
            exe_process.kill()

        request.addfinalizer(stop)

        return PORT

    else:
        if use_executable:
            print("The executable could not be found. Using the standard Flask test server instead...")

        app = flask.app
        app.config.update(
            {
                "TESTING": True,
            }
        )

        return app.test_client()


@pytest.fixture()
def runner(app):
    return app.test_cli_runner()


# @pytest.fixture()
# def all_interfaces(client):
#     response = client.get("/neuroconv", follow_redirects=True)
#     return response.json
