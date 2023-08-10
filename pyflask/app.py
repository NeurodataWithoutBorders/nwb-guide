from __future__ import print_function

# import config
from flask import Flask, request, send_from_directory
from flask_cors import CORS

# from flask_cors import CORS
from namespaces import configure_namespaces
from flask_restx import Resource
import sys

import multiprocessing

configure_namespaces()

from setupUtils import configureLogger, configureRouteHandlers, configureAPI

# get urls to serve files
from manageNeuroconv.info import STUB_SAVE_FOLDER_PATH, CONVERSION_SAVE_FOLDER_PATH


app = Flask(__name__)

# Always enable CORS
CORS(app)
app.config["CORS_HEADERS"] = "Content-Type"

configureLogger(app)

api = configureAPI()

configureRouteHandlers(api)

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
    multiprocessing.freeze_support() # https://stackoverflow.com/questions/32672596/pyinstaller-loads-script-multiple-times#comment103216434_32677108

    port = sys.argv[len(sys.argv) - 1]
    if port.isdigit():
        api.logger.info(f"Starting server on port {port}")
        app.run(host="127.0.0.1", port=port)
    else:
        raise Exception("No port provided for the NWB GUIDE backend.")

# app.run(host="127.0.0.1", port='4242')
