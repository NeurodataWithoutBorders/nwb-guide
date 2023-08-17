"""The primary Flask server for the Python backend."""
import sys
import json
import multiprocessing
from pathlib import Path

from flask import Flask, request, send_from_directory
from flask_cors import CORS
from flask_restx import Api, Resource

from apis import startup_api, neuroconv_api
from setupUtils import configureLogger
from manageNeuroconv.info import STUB_SAVE_FOLDER_PATH, CONVERSION_SAVE_FOLDER_PATH

app = Flask(__name__)

# Always enable CORS to allow distinct processes to handle frontend vs. backend
CORS(app)
app.config["CORS_HEADERS"] = "Content-Type"

configureLogger(app)

package_json_file_path = Path(__file__).parent.parent / "package.json"
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
    # https://stackoverflow.com/questions/32672596/pyinstaller-loads-script-multiple-times#comment103216434_32677108
    multiprocessing.freeze_support()

    port = sys.argv[len(sys.argv) - 1]
    if port.isdigit():
        api.logger.info(f"Starting server on port {port}")
        app.run(host="127.0.0.1", port=port)
    else:
        raise Exception("No port provided for the NWB GUIDE backend.")
