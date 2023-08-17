"""API endpoint definitions for interacting with NeuroConv."""
import traceback

from flask_restx import Namespace, Resource, reqparse
from flask import Response

from manageNeuroconv import (
    get_all_interface_info,
    locate_data,
    get_source_schema,
    get_metadata_schema,
    convert_to_nwb,
    validate_metadata,
    listen_to_neuroconv_events,
    generate_dataset,
)
from errorHandlers import notBadRequestException

neuroconv_api = Namespace("neuroconv", description="Neuroconv neuroconv_api for the NWB GUIDE.")

parser = reqparse.RequestParser()
parser.add_argument("interfaces", type=str, action="split", help="Interfaces cannot be converted")


@neuroconv_api.errorhandler(Exception)
def exception_handler(error):
    exceptiondata = traceback.format_exception(type(error), error, error.__traceback__)
    return {"message": exceptiondata[-1], "traceback": "".join(exceptiondata)}


@neuroconv_api.route("/")
class AllInterfaces(Resource):
    @neuroconv_api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def get(self):
        try:
            return get_all_interface_info()
        except Exception as e:
            if notBadRequestException(e):
                neuroconv_api.abort(500, str(e))
            raise e


@neuroconv_api.route("/schema")
class Schemas(Resource):
    @neuroconv_api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        try:
            return get_source_schema(neuroconv_api.payload)
        except Exception as e:
            if notBadRequestException(e):
                neuroconv_api.abort(500, str(e))


@neuroconv_api.route("/locate")
class Locate(Resource):
    @neuroconv_api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        try:
            return locate_data(neuroconv_api.payload)
        except Exception as e:
            if notBadRequestException(e):
                neuroconv_api.abort(500, str(e))


@neuroconv_api.route("/metadata")
class Metadata(Resource):
    @neuroconv_api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        # try:
        return get_metadata_schema(neuroconv_api.payload.get("source_data"), neuroconv_api.payload.get("interfaces"))

    # except Exception as e:
    #     if notBadRequestException(e):
    #         neuroconv_api.abort(500, str(e))


@neuroconv_api.route("/convert")
class Convert(Resource):
    @neuroconv_api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        try:
            return convert_to_nwb(neuroconv_api.payload)

        except Exception as e:
            if notBadRequestException(e):
                neuroconv_api.abort(500, str(e))


validate_parser = neuroconv_api.parser()
validate_parser.add_argument("parent", type=dict, required=True)
validate_parser.add_argument("function_name", type=str, required=True)


# await fetch('neuroconv/validate', {method:"POST", body: JSON.stringify({nwb_file_object: {related_publications: ['name']}, function: 'check_doi_publications'}), headers: {
#     "Content-Type": "application/json",
#   }}).then(res => res.text())
@neuroconv_api.route("/validate")
@neuroconv_api.expect(validate_parser)
class Validate(Resource):
    @neuroconv_api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        try:
            args = validate_parser.parse_args()
            return validate_metadata(args.get("parent"), args.get("function_name"))

        except Exception as e:
            if notBadRequestException(e):
                neuroconv_api.abort(500, str(e))


@neuroconv_api.route("/upload")
class Upload(Resource):
    @neuroconv_api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        try:
            from manageNeuroconv import upload_to_dandi

            return upload_to_dandi(**neuroconv_api.payload)

        except Exception as e:
            if notBadRequestException(e):
                neuroconv_api.abort(500, str(e))


@neuroconv_api.route("/generate_dataset")
class GenerateDataset(Resource):
    @neuroconv_api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        try:
            return generate_dataset(**neuroconv_api.payload)

        except Exception as e:
            if notBadRequestException(e):
                neuroconv_api.abort(500, str(e))


# Create an events endpoint
# announcer.announce('test', 'publish')
@neuroconv_api.route("/events", methods=["GET"])
class Events(Resource):
    @neuroconv_api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def get(self):
        try:
            return Response(listen_to_neuroconv_events(), mimetype="text/event-stream")

        except Exception as e:
            if notBadRequestException(e):
                neuroconv_api.abort(500, str(e))


@neuroconv_api.route("/test-custom-install/<string:package_name>")
class TestCustomInstall(Resource):
    @neuroconv_api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self, package_name: str):
        try:
            import os

            return os.system(f"pip install {package_name}")
        except Exception as e:
            if notBadRequestException(e):
                neuroconv_api.abort(500, str(e))


@neuroconv_api.route("/test-dynamic-import/<string:package_name>")
class TestDynamicImport(Resource):
    @neuroconv_api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self, package_name: str):
        try:
            from importlib import import_module

            remfile = import_module(name=package_name)

            return 0
        except Exception as e:
            if notBadRequestException(e):
                neuroconv_api.abort(500, str(e))
