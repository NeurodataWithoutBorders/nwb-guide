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


@neuroconv_api.route("/inspect_nwbfile")
class InspectNWBFile(Resource):
    @neuroconv_api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        try:
            from manageNeuroconv import inspect_nwbfile

            return inspect_nwbfile(**neuroconv_api.payload)

        except Exception as e:
            if notBadRequestException(e):
                neuroconv_api.abort(500, str(e))


@neuroconv_api.route("/inspect_folder")
class InspectNWBFolder(Resource):
    @neuroconv_api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        try:
            import json
            from nwbinspector import inspect_all
            from nwbinspector.nwbinspector import InspectorOutputJSONEncoder
            from nwbinspector.inspector_tools import get_report_header, format_messages

            messages = list(
                inspect_all(
                    n_jobs=-2,  # uses number of CPU - 1
                    **neuroconv_api.payload,
                )
            )
            json_report = dict(header=get_report_header(), messages=messages)
            # If you want to get the full JSON listing of all messages to render/organize yourself
            # json.dumps(obj=json_report, cls=InspectorOutputJSONEncoder)
            formatted_messages = format_messages(messages=messages)

            return formatted_messages
        except Exception as e:
            if notBadRequestException(e):
                neuroconv_api.abort(500, str(e))

        except Exception as e:
            if notBadRequestException(e):
                neuroconv_api.abort(500, str(e))


@neuroconv_api.route("/html")
class NWBToHTML(Resource):
    @neuroconv_api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        try:
            from manageNeuroconv import nwb_to_html

            return nwb_to_html(**neuroconv_api.payload)

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
