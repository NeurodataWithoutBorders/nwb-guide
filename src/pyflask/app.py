"""The primary Flask server for the Python backend."""

import json
import multiprocessing
import os
import sys
from datetime import datetime
from logging import DEBUG, Formatter
from logging.handlers import RotatingFileHandler
from os import getpid, kill
from os.path import isabs
from pathlib import Path
from signal import SIGINT
from typing import Dict, Union
from urllib.parse import unquote

# https://stackoverflow.com/questions/32672596/pyinstaller-loads-script-multiple-times#comment103216434_32677108
multiprocessing.freeze_support()

from flask import Flask, request, send_file, send_from_directory
from flask_cors import CORS
from flask_restx import Api, Resource
from manageNeuroconv.info import (
    GUIDE_ROOT_FOLDER,
    STUB_SAVE_FOLDER_PATH,
    is_packaged,
    resource_path,
)
from namespaces import (  # neurosift_namespace,
    ai_namespace,
    dandi_namespace,
    data_namespace,
    neuroconv_namespace,
    startup_namespace,
    system_namespace,
)

# Dictionary to store file paths with their IDs
neurosift_file_registry = dict()

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
package_json_file_path = resource_path("package.json" if is_packaged() else "../package.json")
with open(file=package_json_file_path) as fp:
    package_json = json.load(fp=fp)

api = Api(
    version=package_json["version"],
    title="NWB GUIDE API",
    description="The REST API for the NWB GUIDE provided by the Python Flask Server.",
)
api.add_namespace(startup_namespace)
api.add_namespace(neuroconv_namespace)
api.add_namespace(data_namespace)
api.add_namespace(system_namespace)
api.add_namespace(dandi_namespace)
api.add_namespace(ai_namespace)
# api.add_namespace(neurosift_namespace)  # TODO: enable later
api.init_app(flask_app)


@api.errorhandler(Exception)
def exception_handler(error: Exception) -> Dict[str, str]:
    return {"message": str(error), "type": type(error).__name__}


@flask_app.route("/files/<string:file_id>")
def handle_get_file_request(file_id) -> Union[str, None]:
    """
    This endpoint is used to access a file that has been registered with the Neurosift service.
    """
    if request.method == "GET" and file_id not in neurosift_file_registry:
        raise KeyError(f"File with internal id {file_id} is not accessible.")

    file_path = neurosift_file_registry[file_id]
    if not isabs(file_path):
        file_path = f"/{file_path}"

    return send_file(path_or_file=file_path)


@flask_app.route("/files/<path:file_path>", methods=["POST"])
def handle_file_request(file_path) -> Union[str, None]:
    """
    This endpoint is used to register a new file with the Neurosift service.
    It will return a URL that can be used to access the file.
    """
    if not file_path.endswith(".nwb"):
        raise ValueError("This endpoint must be called on an NWB file that ends with '.nwb'!")

    # Get the last modified time of the file
    try:
        last_modified = os.path.getmtime(file_path)
        last_modified_str = datetime.fromtimestamp(last_modified).strftime("%Y%m%d%H%M%S")
    except (OSError, ValueError):
        # If we can't get the last modified time, use current time
        last_modified_str = datetime.now().strftime("%Y%m%d%H%M%S")

    # Use the number of items in the dictionary as the index
    index = len(neurosift_file_registry) + 1

    # Create a file_id that combines the index and last modified date
    file_id = f"{index}_{last_modified_str}"
    neurosift_file_registry[file_id] = file_path

    # files/<file_id> is the URL that can be used to access the file
    # NOTE: We use an index joined with the last modified date to ensure uniqueness for
    # each request (avoiding Neurosift caching issues) and avoid issues with URL-decoding
    # by the external Neurosift app, while providing somewhat meaningful IDs that include
    # file modification information.
    return request.host_url + "/files/" + file_id


@api.route("/log")
class Log(Resource):
    def post(self):
        payload = api.payload
        type = payload["type"]
        header = payload["header"]
        inputs = payload["inputs"]
        traceback = payload.get("traceback", "")

        message = f"{header}\n{'-'*len(header)}\n\n{json.dumps(inputs, indent=2)}\n"

        if traceback:
            message += f"\n{traceback}\n"

        selected_logger = getattr(api.logger, type)
        api.logger.info(f"Logging {type} message: {header}")
        selected_logger(message)


@api.route("/server_shutdown", endpoint="shutdown")
class Shutdown(Resource):
    def get(self):
        func = request.environ.get("werkzeug.server.shutdown")
        api.logger.info("Shutting down server")

        if func is None:
            kill(getpid(), SIGINT)
            return

        func()


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

        api.logger.addHandler(log_handler)
        api.logger.setLevel(DEBUG)

        api.logger.info(f"Logging to {LOG_FILE_PATH}")

        # Run the server
        api.logger.info(f"Starting server on port {port}")
        flask_app.run(host="127.0.0.1", port=port)
    else:
        raise Exception("No port provided for the NWB GUIDE backend.")
