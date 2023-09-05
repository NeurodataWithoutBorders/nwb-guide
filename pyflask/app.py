"""The primary Flask server for the Python backend."""
import sys
import json
import multiprocessing
from os.path import sep
from logging import Formatter, DEBUG
from logging.handlers import RotatingFileHandler
from pathlib import Path
from urllib.parse import unquote


# https://stackoverflow.com/questions/32672596/pyinstaller-loads-script-multiple-times#comment103216434_32677108
multiprocessing.freeze_support()


from flask import Flask, request, send_from_directory, send_file
from flask_cors import CORS
from flask_restx import Api, Resource

from apis import startup_api, neuroconv_api
from manageNeuroconv.info import resource_path, STUB_SAVE_FOLDER_PATH, CONVERSION_SAVE_FOLDER_PATH

app = Flask(__name__)

# Always enable CORS to allow distinct processes to handle frontend vs. backend
CORS(app)
app.config["CORS_HEADERS"] = "Content-Type"

# Configure logger
LOG_FILE_PATH = Path.home() / "NWB_GUIDE" / "logs" / "api.log"
LOG_FILE_PATH.parent.mkdir(parents=True, exist_ok=True)

log_handler = RotatingFileHandler(LOG_FILE_PATH, maxBytes=5 * 1024 * 1024, backupCount=3)
log_formatter = Formatter(
    fmt="%(asctime)s.%(msecs)03d %(levelname)s %(module)s - %(funcName)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log_handler.setFormatter(log_formatter)

app.logger.addHandler(log_handler)
app.logger.setLevel(DEBUG)


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
api.init_app(app)

registered = {}

@app.route("/files")
def get_all_files():
    return list(registered.keys())

@app.route("/files/<path:path>", methods=["GET", "POST"])
def handle_file_request(path):
    

    if request.method == 'GET':
        if registered[path]:
            return send_file(f"{sep}{unquote(path)}")
        else:
            app.abort(404, 'Resource is not accessible.')

    else:
        if ('.nwb' in path):
            registered[path] = True
            return request.base_url
        else:
            app.abort(400, str('Path does not point to an NWB file.'))

@app.route("/conversions/<path:path>")
def send_conversions(path):
    return send_from_directory(CONVERSION_SAVE_FOLDER_PATH, path)


@app.route("/stubs/<path:path>")
def send_stubs(path):
    return send_from_directory(STUB_SAVE_FOLDER_PATH, path)


@api.route("/server_shutdown", endpoint="shutdown")
class Shutdown(Resource):
    def get(self):
        func = request.environ.get("werkzeug.server.shutdown")
        api.logger.info("Shutting down server")

        if func is None:
            print("Not running with the Werkzeug Server")
            return

        func()


if __name__ == "__main__":
    port = sys.argv[len(sys.argv) - 1]
    if port.isdigit():
        api.logger.info(f"Starting server on port {port}")
        app.run(host="127.0.0.1", port=port)
    else:
        raise Exception("No port provided for the NWB GUIDE backend.")
