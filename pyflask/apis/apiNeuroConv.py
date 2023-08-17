from flask_restx import Namespace, Resource, reqparse
from flask import Response
import traceback

from namespaces import get_namespace, NamespaceEnum
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

api = Namespace("neuroconv", description="Neuroconv API for NWB GUIDE")
api = get_namespace(NamespaceEnum.NEUROCONV)

parser = reqparse.RequestParser()
parser.add_argument("interfaces", type=str, action="split", help="Interfaces cannot be converted")


@api.errorhandler(Exception)
def exception_handler(error):
    exceptiondata = traceback.format_exception(type(error), error, error.__traceback__)
    return {"message": exceptiondata[-1], "traceback": "".join(exceptiondata)}


@api.route("/")
class AllInterfaces(Resource):
    @api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def get(self):
        try:
            return get_all_interface_info()
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e


@api.route("/schema")
class Schemas(Resource):
    @api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        try:
            return get_source_schema(api.payload)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))


@api.route("/locate")
class Locate(Resource):
    @api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        try:
            return locate_data(api.payload)
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))


@api.route("/metadata")
class Metadata(Resource):
    @api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        # try:
        return get_metadata_schema(api.payload.get("source_data"), api.payload.get("interfaces"))

    # except Exception as e:
    #     if notBadRequestException(e):
    #         api.abort(500, str(e))


@api.route("/convert")
class Convert(Resource):
    @api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        try:
            return convert_to_nwb(api.payload)

        except Exception as e:
            if notBadRequestException(e):
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
            args = validate_parser.parse_args()
            return validate_metadata(args.get("parent"), args.get("function_name"))

        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))


@api.route("/generate_dataset")
class GenerateDataset(Resource):
    @api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        try:
            return generate_dataset(**api.payload)

        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))


# Create an events endpoint
# announcer.announce('test', 'publish')
@api.route("/events", methods=["GET"])
class Events(Resource):
    @api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def get(self):
        try:
            return Response(listen_to_neuroconv_events(), mimetype="text/event-stream")

        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
