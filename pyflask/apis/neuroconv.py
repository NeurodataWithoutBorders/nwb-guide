"""API endpoint definitions for interacting with NeuroConv."""

import traceback

from flask_restx import Namespace, Resource, reqparse
from flask import Response

from manageNeuroconv import (
    get_all_interface_info,
    get_all_converter_info,
    locate_data,
    autocomplete_format_string,
    get_source_schema,
    get_metadata_schema,
    convert_to_nwb,
    validate_metadata,
    listen_to_neuroconv_events,
    inspect_nwb_file,
    inspect_nwb_folder,
    inspect_multiple_filesystem_objects,
    upload_project_to_dandi,
    upload_folder_to_dandi,
    upload_multiple_filesystem_objects_to_dandi,
    get_interface_alignment,
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
            # return get_all_interface_info()
            # return get_all_converter_info()

            return {
                **get_all_interface_info(),
                **get_all_converter_info(),
            }
        except Exception as exception:
            if notBadRequestException(exception):
                neuroconv_api.abort(500, str(exception))
            raise exception


@neuroconv_api.route("/schema")
class Schemas(Resource):
    @neuroconv_api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        try:
            return get_source_schema(neuroconv_api.payload)
        except Exception as exception:
            if notBadRequestException(exception):
                neuroconv_api.abort(500, str(exception))


@neuroconv_api.route("/locate")
class Locate(Resource):
    @neuroconv_api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        try:
            return locate_data(neuroconv_api.payload)
        except Exception as exception:
            if notBadRequestException(exception):
                neuroconv_api.abort(500, str(exception))


@neuroconv_api.route("/locate/autocomplete")
class Locate(Resource):
    @neuroconv_api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        try:
            return autocomplete_format_string(neuroconv_api.payload)
        except Exception as exception:
            if notBadRequestException(exception):
                neuroconv_api.abort(500, str(exception))


@neuroconv_api.route("/metadata")
class Metadata(Resource):
    @neuroconv_api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        # try:
        return get_metadata_schema(neuroconv_api.payload.get("source_data"), neuroconv_api.payload.get("interfaces"))

    # except Exception as exception:
    #     if notBadRequestException(exception):
    #         neuroconv_api.abort(500, str(exception))


@neuroconv_api.route("/convert")
class Convert(Resource):
    @neuroconv_api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        try:
            return convert_to_nwb(neuroconv_api.payload)

        except Exception as exception:
            if notBadRequestException(exception):
                neuroconv_api.abort(500, str(exception))


@neuroconv_api.route("/alignment")
class Alignment(Resource):
    @neuroconv_api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        try:
            return get_interface_alignment(neuroconv_api.payload)

        except Exception as exception:
            if notBadRequestException(exception):
                neuroconv_api.abort(500, str(exception))


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

        except Exception as exception:
            if notBadRequestException(exception):
                neuroconv_api.abort(500, str(exception))


@neuroconv_api.route("/upload/project")
class UploadProject(Resource):
    @neuroconv_api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        try:
            import psutil

            upload_options = neuroconv_api.payload
            if "number_of_jobs" not in upload_options:
                upload_options.update(number_of_jobs=1)
            if "number_of_threads" not in upload_options:
                upload_options.update(number_of_threads=1)

            return upload_project_to_dandi(**upload_options)

        except Exception as exception:
            if notBadRequestException(exception):
                neuroconv_api.abort(500, str(exception))


@neuroconv_api.route("/upload/folder")
class UploadFolder(Resource):
    @neuroconv_api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        try:
            import psutil

            upload_options = neuroconv_api.payload
            if "number_of_jobs" not in upload_options:
                upload_options.update(number_of_jobs=1)
            if "number_of_threads" not in upload_options:
                upload_options.update(number_of_threads=1)

            return upload_folder_to_dandi(**upload_options)

        except Exception as exception:
            if notBadRequestException(exception):
                neuroconv_api.abort(500, str(exception))


@neuroconv_api.route("/upload")
class Upload(Resource):
    @neuroconv_api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        from os.path import isdir

        try:
            paths = neuroconv_api.payload["filesystem_paths"]

            if len(paths) == 1 and isdir(paths[0]):
                kwargs = {**neuroconv_api.payload}
                del kwargs["filesystem_paths"]
                kwargs["nwb_folder_path"] = paths[0]
                return upload_folder_to_dandi(**kwargs)

            else:
                return upload_multiple_filesystem_objects_to_dandi(**neuroconv_api.payload)

        except Exception as exception:
            if notBadRequestException(exception):
                neuroconv_api.abort(500, str(exception))


@neuroconv_api.route("/inspect_file")
class InspectNWBFile(Resource):
    @neuroconv_api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        try:
            return inspect_nwb_file(neuroconv_api.payload)
        except Exception as exception:
            if notBadRequestException(exception):
                neuroconv_api.abort(500, str(exception))


@neuroconv_api.route("/inspect_folder")
class InspectNWBFolder(Resource):
    @neuroconv_api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        try:
            return inspect_nwb_folder(neuroconv_api.payload)

        except Exception as exception:
            if notBadRequestException(exception):
                neuroconv_api.abort(500, str(exception))


@neuroconv_api.route("/inspect")
class InspectNWBFolder(Resource):
    @neuroconv_api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        from os.path import isfile

        try:
            paths = neuroconv_api.payload["paths"]

            kwargs = {**neuroconv_api.payload}
            del kwargs["paths"]

            if len(paths) == 1:
                if isfile(paths[0]):
                    return inspect_nwb_file({"nwbfile_path": paths[0], **kwargs})
                else:
                    return inspect_nwb_folder({"path": paths[0], **kwargs})

            else:
                return inspect_multiple_filesystem_objects(paths, **kwargs)

        except Exception as exception:
            if notBadRequestException(exception):
                neuroconv_api.abort(500, str(exception))


@neuroconv_api.route("/html")
class NWBToHTML(Resource):
    @neuroconv_api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        try:
            from pynwb import NWBHDF5IO

            with NWBHDF5IO(neuroconv_api.payload.nwbfile_path, mode="r") as io:
                html = io.read()._repr_html_()
            return html

        except Exception as exception:
            if notBadRequestException(exception):
                neuroconv_api.abort(500, str(exception))


# Create an events endpoint
# announcer.announce('test', 'publish')
@neuroconv_api.route("/events", methods=["GET"])
class Events(Resource):
    @neuroconv_api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def get(self):
        try:
            return Response(listen_to_neuroconv_events(), mimetype="text/event-stream")

        except Exception as exception:
            if notBadRequestException(exception):
                neuroconv_api.abort(500, str(exception))
