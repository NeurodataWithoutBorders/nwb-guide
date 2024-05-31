"""API endpoint definitions for interacting with NeuroConv."""

from flask import Response, request
from flask_restx import Namespace, Resource, reqparse
from manageNeuroconv import (
    autocomplete_format_string,
    convert_to_nwb,
    get_all_converter_info,
    get_all_interface_info,
    get_backend_configuration,
    get_interface_alignment,
    get_metadata_schema,
    get_source_schema,
    inspect_multiple_filesystem_objects,
    inspect_nwb_file,
    inspect_nwb_folder,
    listen_to_neuroconv_progress_events,
    locate_data,
    progress_handler,
    upload_folder_to_dandi,
    upload_multiple_filesystem_objects_to_dandi,
    upload_project_to_dandi,
    validate_metadata,
)

neuroconv_namespace = Namespace("neuroconv", description="Neuroconv neuroconv_namespace for the NWB GUIDE.")

parser = reqparse.RequestParser()
parser.add_argument("interfaces", type=str, action="split", help="Interfaces cannot be converted")


@neuroconv_namespace.route("/")
class AllInterfaces(Resource):
    @neuroconv_namespace.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def get(self):
        # return get_all_interface_info()
        # return get_all_converter_info()

        return {
            **get_all_interface_info(),
            **get_all_converter_info(),
        }


@neuroconv_namespace.route("/schema")
class Schemas(Resource):
    @neuroconv_namespace.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        return get_source_schema(neuroconv_namespace.payload)


@neuroconv_namespace.route("/locate")
class LocateData(Resource):
    @neuroconv_namespace.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        return locate_data(neuroconv_namespace.payload)


@neuroconv_namespace.route("/locate/autocomplete")
class AutoCompleteFormatString(Resource):
    @neuroconv_namespace.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        return autocomplete_format_string(neuroconv_namespace.payload)


@neuroconv_namespace.route("/metadata")
class Metadata(Resource):
    @neuroconv_namespace.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        return get_metadata_schema(
            neuroconv_namespace.payload.get("source_data"), neuroconv_namespace.payload.get("interfaces")
        )


@neuroconv_namespace.route("/convert")
class Convert(Resource):
    @neuroconv_namespace.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        return convert_to_nwb(neuroconv_namespace.payload)


@neuroconv_namespace.route("/alignment")
class Alignment(Resource):
    @neuroconv_namespace.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        return get_interface_alignment(neuroconv_namespace.payload)


@neuroconv_namespace.route("/configuration")
class GetBackendConfiguration(Resource):
    @neuroconv_namespace.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        return get_backend_configuration(neuroconv_namespace.payload)


validate_parser = neuroconv_namespace.parser()
validate_parser.add_argument("parent", type=dict, required=True)
validate_parser.add_argument("function_name", type=str, required=True)


@neuroconv_namespace.route("/validate")
@neuroconv_namespace.expect(validate_parser)
class Validate(Resource):
    @neuroconv_namespace.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        args = validate_parser.parse_args()
        return validate_metadata(args.get("parent"), args.get("function_name"))


@neuroconv_namespace.route("/upload/project")
class UploadProject(Resource):
    @neuroconv_namespace.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        import psutil

        upload_options = neuroconv_namespace.payload
        if "number_of_jobs" not in upload_options:
            upload_options.update(number_of_jobs=1)
        if "number_of_threads" not in upload_options:
            upload_options.update(number_of_threads=1)

        return upload_project_to_dandi(**upload_options)


@neuroconv_namespace.route("/upload/folder")
class UploadFolder(Resource):
    @neuroconv_namespace.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        import psutil

        upload_options = neuroconv_namespace.payload
        if "number_of_jobs" not in upload_options:
            upload_options.update(number_of_jobs=1)
        if "number_of_threads" not in upload_options:
            upload_options.update(number_of_threads=1)

        return upload_folder_to_dandi(**upload_options)


@neuroconv_namespace.route("/upload")
class Upload(Resource):
    @neuroconv_namespace.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        from os.path import isdir

        paths = neuroconv_namespace.payload["filesystem_paths"]

        if len(paths) == 1 and isdir(paths[0]):
            kwargs = {**neuroconv_namespace.payload}
            del kwargs["filesystem_paths"]
            kwargs["nwb_folder_path"] = paths[0]
            return upload_folder_to_dandi(**kwargs)

        else:
            return upload_multiple_filesystem_objects_to_dandi(**neuroconv_namespace.payload)


@neuroconv_namespace.route("/inspect_file")
class InspectNWBFile(Resource):
    @neuroconv_namespace.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        return inspect_nwb_file(neuroconv_namespace.payload)


@neuroconv_namespace.route("/inspect_folder")
class InspectNWBFolder(Resource):
    @neuroconv_namespace.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        url = f"{request.url_root}neuroconv/announce/progress"
        return inspect_nwb_folder(url, neuroconv_namespace.payload)


@neuroconv_namespace.route("/announce/progress")
class InspectNWBFolder(Resource):
    @neuroconv_namespace.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        data = neuroconv_namespace.payload
        progress_handler.announce(data)
        return True


@neuroconv_namespace.route("/inspect")
class InspectNWBFolder(Resource):
    @neuroconv_namespace.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        from os.path import isfile

        url = f"{request.url_root}neuroconv/announce/progress"

        paths = neuroconv_namespace.payload["paths"]

        kwargs = {**neuroconv_namespace.payload}
        del kwargs["paths"]

        if len(paths) == 1:
            if isfile(paths[0]):
                return inspect_nwb_file({"nwbfile_path": paths[0], **kwargs})
            else:
                return inspect_nwb_folder(url, {"path": paths[0], **kwargs})

        else:
            return inspect_multiple_filesystem_objects(url, paths, **kwargs)


@neuroconv_namespace.route("/html")
class NWBToHTML(Resource):
    @neuroconv_namespace.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        from pynwb import NWBHDF5IO

        with NWBHDF5IO(neuroconv_namespace.payload.nwbfile_path, mode="r") as io:
            html = io.read()._repr_html_()
        return html


# Create an events endpoint
@neuroconv_namespace.route("/events/progress", methods=["GET"])
class ProgressEvents(Resource):
    @neuroconv_namespace.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def get(self):
        return Response(listen_to_neuroconv_progress_events(), mimetype="text/event-stream")
