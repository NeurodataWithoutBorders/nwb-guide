"""The primary Flask server for the Python backend."""

import json
import multiprocessing
import sys
from datetime import datetime
from logging import DEBUG, Formatter
from logging.handlers import RotatingFileHandler
from os import getpid, kill
from os.path import isabs
from pathlib import Path
from signal import SIGINT
from typing import Union
from urllib.parse import unquote

# https://stackoverflow.com/questions/32672596/pyinstaller-loads-script-multiple-times#comment103216434_32677108
multiprocessing.freeze_support()


from apis import data_api, neuroconv_api, startup_api
from flask import Flask, Response, request, send_file, send_from_directory
from flask_cors import CORS
from flask_restx import Api, Resource
from manageNeuroconv.info import (
    CONVERSION_SAVE_FOLDER_PATH,
    GUIDE_ROOT_FOLDER,
    STUB_SAVE_FOLDER_PATH,
    resource_path,
)
from utils import catch_exception_and_abort, server_error_responses

flask_app = Flask(__name__)

# Always enable CORS to allow distinct processes to handle frontend vs. backend
CORS(flask_app)
flask_app.config["CORS_HEADERS"] = "Content-Type"

# Create logger configuration
LOG_FOLDER = Path(GUIDE_ROOT_FOLDER, "logs")
LOG_FOLDER.mkdir(exist_ok=True, parents=True)
timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
LOG_FILE_PATH = Path(LOG_FOLDER, f"{timestamp}.log")

# Initialize API
package_json_file_path = resource_path("package.json")
with open(file=package_json_file_path) as fp:
    package_json = json.load(fp=fp)

api = Api(
    version=package_json["version"],
    title="NWB GUIDE API",
    description="The REST API for the NWB GUIDE provided by the Python Flask Server.",
)
api.add_namespace(startup_api)
api.add_namespace(neuroconv_api)
api.add_namespace(data_api)
api.init_app(flask_app)

# 'nwbfile_registry' is a global list that keeps track of all NWB files that have been registered with the server
nwbfile_registry = []


# TODO: is there any advantage to using the api.route instead of app for resources added in this file?
@api.route(rule="/log")
@api.doc(
    description="Any exception that occurs on the Flask server will save a full traceback to a log file on disk.",
    responses=server_error_responses(codes=[200, 400, 500]),
)
class Log(Resource):
    @api.doc(
        description="Nicely format the exception and the payload that caused it.",
        responses=server_error_responses(codes=[200, 400, 404, 500]),
    )
    @catch_exception_and_abort(api=api, code=500)
    def post(self):
        payload = api.payload
        type = payload["type"]
        header = payload["header"]
        inputs = payload["inputs"]
        exception_traceback = payload["traceback"]

        message = f"{header}\n{'-'*len(header)}\n\n{json.dumps(inputs, indent=2)}\n\n{exception_traceback}\n"
        selected_logger = getattr(api.logger, type)
        selected_logger(message)


# Used for the standalone preview page
@flask_app.route(rule="/files/<path:file_path>", methods=["GET", "POST"])
@api.doc(
    description="Handle adding and fetching NWB files from the global file registry.",
    responses=server_error_responses(codes=[200, 400, 404, 500]),
)
def handle_file_request(file_path: str) -> Union[str, Response, None]:
    """Used by the PreviewPage to serve the URL to Neurosift."""
    if ".nwb" not in file_path:
        code = 400
        base_message = server_error_responses(codes=[code])[code]
        message = f"{base_message}: Path does not point to an NWB file."
        api.abort(code=code, message=message)
        return

    if request.method == "GET" and file_path not in nwbfile_registry:
        code = 404
        base_message = server_error_responses(codes=[code])[code]
        message = f"{base_message}: Path does not point to an NWB file."
        api.abort(code=code, message=message)
        return

    if request.method == "GET":
        parsed_file_path = unquote(file_path)  # Decode any URL encoding applied to the file path
        is_file_relative = not isabs(parsed_file_path)  # Check if the file path is relative
        if is_file_relative:
            parsed_file_path = f"/{parsed_file_path}"
        return send_file(path_or_file=parsed_file_path)

    # Register access to the provided file path
    elif request.method == "POST":
        nwbfile_registry.append(file_path)
        return request.base_url  # Return the URL of the newly added file


@flask_app.route("/cpus")
def get_cpu_count():
    from psutil import cpu_count

    physical = cpu_count(logical=False)
    logical = cpu_count()

    return dict(physical=physical, logical=logical)


@flask_app.route("/get-recommended-species")
def get_species():
    from dandi.metadata.util import species_map

    return species_map


@api.route("/server_shutdown", endpoint="shutdown")
class Shutdown(Resource):
    def get(self) -> None:
        werkzeug_shutdown_function = request.environ.get("werkzeug.server.shutdown")
        api.logger.info("Shutting down server...")

        if werkzeug_shutdown_function is None:
            kill(getpid(), SIGINT)
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
        api.logger.info(f"Starting server on port {port}")
        flask_app.run(host="127.0.0.1", port=port)
    else:
        raise Exception("No port provided for the NWB GUIDE backend.")
