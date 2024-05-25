"""The primary Flask server for the Python backend."""

import json
import multiprocessing
import os
import sys
from datetime import datetime
from logging import DEBUG, Formatter
from logging.handlers import RotatingFileHandler
from pathlib import Path
from signal import SIGINT
from urllib.parse import unquote

# https://stackoverflow.com/questions/32672596/pyinstaller-loads-script-multiple-times#comment103216434_32677108
multiprocessing.freeze_support()

import flask
from apis import (
    dandi_api,
    data_api,
    neuroconv_api,
    neurosift_api,
    startup_api,
    system_api,
)
from apis.utils import catch_exception_and_abort, server_error_responses
from flask import Flask
from flask_cors import CORS
from flask_restx import Api, Resource
from manageNeuroconv.info import GUIDE_ROOT_FOLDER, get_project_root_path

all_apis = [data_api, neuroconv_api, startup_api, neurosift_api, dandi_api, system_api]

flask_app = Flask(__name__)

# Always enable CORS to allow distinct processes to handle frontend vs. backend
CORS(flask_app)
flask_app.config["CORS_HEADERS"] = "Content-Type"

# Create logger configuration
LOG_FOLDER = Path(GUIDE_ROOT_FOLDER) / "logs"
LOG_FOLDER.mkdir(exist_ok=True, parents=True)
timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
LOG_FILE_PATH = Path(LOG_FOLDER) / f"{timestamp}.log"

# Fetch version from package.json
package_json_file_path = get_project_root_path() / "package.json"
with open(file=package_json_file_path, mode="r") as fp:
    package_json = json.load(fp=fp)

# Initialize top-level API and set namespaces
flask_api = Api(
    version=package_json["version"],
    title="NWB GUIDE API",
    description="The REST API for the NWB GUIDE provided by the Python Flask Server.",
)
for api in all_apis:
    flask_api.add_namespace(api)
flask_api.init_app(flask_app)


@flask_api.route(rule="/log")
@flask_api.doc(
    description="Any exception that occurs on the Flask server will save a full traceback to a log file on disk.",
    responses=server_error_responses(codes=[200, 400, 500]),
)
class Log(Resource):
    @flask_api.doc(
        description="Nicely format the exception and the payload that caused it.",
        responses=server_error_responses(codes=[200, 400, 404, 500]),
    )
    @catch_exception_and_abort(api=flask_api, code=500)
    def post(self):
        payload = flask_api.payload
        type = payload["type"]
        header = payload["header"]
        inputs = payload["inputs"]
        exception_traceback = payload["traceback"]

        message = f"{header}\n{'-'*len(header)}\n\n{json.dumps(inputs, indent=2)}\n\n{exception_traceback}\n"
        selected_logger = getattr(flask_api.logger, type)
        selected_logger(message)


@flask_api.route("/server_shutdown", endpoint="shutdown")
@flask_api.doc(description="Close the Flask server.")
class Shutdown(Resource):

    @flask_api.doc(
        description="To trigger a shutdown, set a GET request to this endpoint. It will not return a response.",
        responses=server_error_responses(codes=[200, 500]),
    )
    def get(self) -> None:
        werkzeug_shutdown_function = flask.request.environ.get("werkzeug.server.shutdown")
        flask_api.logger.info("Shutting down server...")

        if werkzeug_shutdown_function is None:
            os.kill(os.getpid(), SIGINT)

            return

        werkzeug_shutdown_function()


if __name__ == "__main__":
    port = sys.argv[len(sys.argv) - 1]
    if port.isdigit():

        # Configure logger (avoid reinstantiation for processes)
        log_handler = RotatingFileHandler(LOG_FILE_PATH, maxBytes=5 * 1024 * 1024, backupCount=3)
        log_formatter = Formatter(
            fmt="%(asctime)s.%(msecs)03d %(levelname)s %(module)s - %(funcName)s: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        log_handler.setFormatter(log_formatter)

        flask_app.logger.addHandler(log_handler)
        flask_app.logger.setLevel(DEBUG)

        flask_app.logger.info(f"Logging to {LOG_FILE_PATH}")

        # Run the server
        flask_api.logger.info(f"Starting server on port {port}")
        flask_app.run(host="127.0.0.1", port=port)
    else:
        raise Exception("No port provided for the NWB GUIDE backend.")
