"""An API for handling general system information."""

import os
from typing import Dict, Union

import flask_restx

nwb_inspector_namespace = flask_restx.Namespace(
    name="nwb_inspector", description="Handles interactions with the NWB " "Inspector."
)


# TODO: reroute all frontend calls to the new namespace


@nwb_inspector_namespace.route("/inspect")
class InspectRouter(Resource):
    @nwb_inspector_namespace.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        progress_url = f"{request.url_root}neuroconv/announce/progress"

        paths = nwb_inspector_namespace.payload["paths"]
        kwargs = {**nwb_inspector_namespace.payload}
        del kwargs["paths"]

        if len(paths) == 1:
            if os.path.isfile(paths[0]):
                return inspect_nwb_file({"nwbfile_path": paths[0], **kwargs})
            else:
                return inspect_nwb_folder(url, {"path": paths[0], **kwargs})
        else:
            return inspect_multiple_filesystem_objects(progress_url, paths, **kwargs)


@nwb_inspector_namespace.route("/inspect_file")
class InspectNWBFile(Resource):
    @nwb_inspector_namespace.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        return inspect_nwb_file(neuroconv_namespace.payload)


@nwb_inspector_namespace.route("/inspect_folder")
class InspectNWBFolder(Resource):
    @nwb_inspector_namespace.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        url = f"{request.url_root}neuroconv/announce/progress"
        return inspect_nwb_folder(url, neuroconv_namespace.payload)
