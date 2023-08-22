import pytest
import app as flask
import sys
import subprocess
from pathlib import Path
import multiprocessing as mp
import os
import time
import traceback

PORT = 1234
executable_flag = "--executable"
use_executable = executable_flag in sys.argv
is_windows = sys.platform.startswith("win32")

exe_path = Path("build/flask/nwb-guide", "nwb-guide.exe" if is_windows else "nwb-guide")


class Process(mp.Process):
    def __init__(self, *args, **kwargs):
        mp.Process.__init__(self, *args, **kwargs)
        self._pconn, self._cconn = mp.Pipe()
        self._exception = None

    def run(self):
        try:
            mp.Process.run(self)
            self._cconn.send(None)
        except Exception as e:
            tb = traceback.format_exc()
            self._cconn.send((e, tb))
            raise e  # You can still rise this exception if you need to

    @property
    def exception(self):
        if self._pconn.poll():
            self._exception = self._pconn.recv()

        return self._exception


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
