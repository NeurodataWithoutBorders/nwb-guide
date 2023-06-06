from __future__ import print_function

# import config
from flask import Flask, request, send_from_directory
from flask_cors import CORS

# from flask_cors import CORS
from namespaces import configure_namespaces
from flask_restx import Resource
import sys

configure_namespaces()

from setupUtils import configureLogger, configureRouteHandlers, configureAPI

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
    return send_from_directory(conversion_save_path, path)


@app.route("/stubs/<path:path>")
def send_stubs(path):
    return send_from_directory(stub_save_path, path)


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
    port = sys.argv[1]
    api.logger.info(f"Starting server on port {port}")
    app.run(host="127.0.0.1", port=port)

# app.run(host="127.0.0.1", port='4242')
