"""The primary Flask server for the Python backend."""
import sys
import traceback
import multiprocessing
from logging import Formatter, DEBUG
from logging.handlers import RotatingFileHandler
from pathlib import Path

from flask import Flask, Response, request, send_from_directory
from flask_cors import CORS
from flask_restx import Api, Resource, reqparse

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


# Define REST API and endpoints
api = Api(app)

echo_parser = api.parser()
echo_parser.add_argument(
    "arg",
    type=str,
    required=True,
    help="Argument that will be echoed back to the caller",
    location="args",
)


@api.route("/echo")
class Echo(Resource):
    @api.expect(echo_parser)
    def get(self):
        args = echo_parser.parse_args()
        return args["arg"]


@api.route("/conversions/<path:path>")
class SendConversions(Resource):
    def get(path: str):
        from .tools.info import CONVERSION_SAVE_FOLDER_PATH

        return send_from_directory(CONVERSION_SAVE_FOLDER_PATH, path)


@api.route("/stubs/<path:path>")
class SendStubs(Resource):
    def get(path: str):
        from .tools.info import STUB_SAVE_FOLDER_PATH

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


interface_parser = reqparse.RequestParser()
interface_parser.add_argument("interfaces", type=str, action="split", help="Interfaces cannot be converted")


def is_bad_request(exception):
    """Check if the exception is a generic exception."""
    return type(exception).__name__ in ["BadRequest", "Forbidden", "Unauthorized"]


@api.errorhandler(Exception)
def exception_handler(error):
    exceptiondata = traceback.format_exception(type(error), error, error.__traceback__)
    return {"message": exceptiondata[-1], "traceback": "".join(exceptiondata)}


@api.route("/")
class AllInterfaces(Resource):
    @api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def get(self):
        try:
            from .tools import get_all_interface_info

            return get_all_interface_info()
        except Exception as e:
            if not is_bad_request(e):
                api.abort(500, str(e))
            raise e


@api.route("/schema")
class Schemas(Resource):
    @api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        try:
            from .tools import get_source_schema

            return get_source_schema(api.payload)
        except Exception as e:
            if not is_bad_request(e):
                api.abort(500, str(e))


@api.route("/locate")
class Locate(Resource):
    @api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        try:
            from .tools import locate_data

            return locate_data(api.payload)
        except Exception as e:
            if not is_bad_request(e):
                api.abort(500, str(e))


@api.route("/metadata")
class Metadata(Resource):
    @api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        # try:
        from .tools import get_metadata_schema

        return get_metadata_schema(api.payload.get("source_data"), api.payload.get("interfaces"))

    # except Exception as e:
    #     if not is_bad_request(e):
    #         api.abort(500, str(e))


@api.route("/convert")
class Convert(Resource):
    @api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        try:
            from .tools import convert_to_nwb

            return convert_to_nwb(api.payload)

        except Exception as e:
            if not is_bad_request(e):
                api.abort(500, str(e))


validate_parser = api.parser()
validate_parser.add_argument("parent", type=dict, required=True)
validate_parser.add_argument("function_name", type=str, required=True)


# await fetch('neuroconv/validate', {method:"POST", body: JSON.stringify({nwb_file_object: {related_publications: ['name']}, function: 'check_doi_publications'}), headers: {
#     "Content-Type": "application/json",
#   }}).then(res => res.text())
@api.route("/validate")
@api.expect(validate_parser)
class Validate(Resource):
    @api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        try:
            from .tools import validate_metadata

            args = validate_parser.parse_args()
            return validate_metadata(args.get("parent"), args.get("function_name"))

        except Exception as e:
            if not is_bad_request(e):
                api.abort(500, str(e))


@api.route("/upload")
class Upload(Resource):
    @api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        try:
            from .tools import upload_to_dandi

            return upload_to_dandi(**api.payload)

        except Exception as e:
            if not is_bad_request(e):
                api.abort(500, str(e))


@api.route("/generate_dataset")
class GenerateDataset(Resource):
    @api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        try:
            from .tools import generate_dataset

            return generate_dataset(**api.payload)

        except Exception as e:
            if not is_bad_request(e):
                api.abort(500, str(e))


# Create an events endpoint
# announcer.announce('test', 'publish')
@api.route("/events", methods=["GET"])
class Events(Resource):
    @api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def get(self):
        try:
            from .tools import listen_to_neuroconv_events

            return Response(listen_to_neuroconv_events(), mimetype="text/event-stream")

        except Exception as e:
            if not is_bad_request(e):
                api.abort(500, str(e))


if __name__ == "__main__":
    # https://stackoverflow.com/questions/32672596/pyinstaller-loads-script-multiple-times#comment103216434_32677108
    multiprocessing.freeze_support()

    port = sys.argv[len(sys.argv) - 1]
    if port.isdigit():
        api.logger.info(f"Starting server on port {port}")
        app.run(host="127.0.0.1", port=port)
    else:
        raise Exception("No port provided for the NWB GUIDE backend.")
