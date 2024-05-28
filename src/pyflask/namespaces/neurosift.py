"""
An API for handling file system communication with the standalone Neurosift preview page.

NOTE: not currently used due to ongoing issues
"""

import collections
import os
import urllib
from typing import Union

import flask
import flask_restx
from manageNeuroconv.info import STUB_SAVE_FOLDER_PATH

neurosift_namespace = flask_restx.Namespace(
    name="neurosift", description="Handle file system communication with the " "standalone Neurosift preview page."
)

# A global in-memory registry of NWB files - much faster than asking if file is in a global list
# Keys are NWB files; values are booleans indicating if the base URL has been exposed for that file
neurosift_file_registry = collections.defaultdict(bool)


def _error_if_not_nwb_file(file_path: str) -> None:
    if ".nwb" not in file_path:
        raise ValueError("This endpoint must be called on an NWB file!")

    return


@neurosift_namespace.route("/files/<path:file_path>")
@neurosift_namespace.doc(
    description="Handle adding and fetching NWB files from the global file registry.",
)
class NeurosiftFileManager(flask_restx.Resource):

    @neurosift_namespace.doc(
        description="If the file path has been added to the registry (and therefore sent its base "
        "URL), return the absolute file path. This is implicitly called by Neurosift.",
    )
    def get(self, file_path: str) -> Union[flask.Response, None]:
        _error_if_not_nwb_file(file_path=file_path)

        if not neurosift_file_registry[file_path]:
            code = 404
            base_message = server_error_responses(codes=[code])[code]
            message = f"{base_message}: The base URL has not been exposed for this NWB file."
            api.abort(code=code, message=message)

            return

        # Decode any URL encoding applied to the file path
        parsed_file_path = urllib.parse.unquote(file_path)

        # Check if the file path is relative
        is_file_relative = not os.path.isabs(parsed_file_path)
        if is_file_relative:
            parsed_file_path = f"/{parsed_file_path}"

        return flask.send_file(path_or_file=parsed_file_path)

    @neurosift_namespace.doc(
        description=(
            "Add the file to a global in-memory registry (refreshes on App restart) and return "
            "the base URL of the newly added file.",
        )
    )
    def post(self, file_path: str) -> Union[str, None]:
        _error_if_not_nwb_file(file_path=file_path)

        neurosift_file_registry[file_path] = True
        # if neurosift_file_registry[file_path] = True:
        #     raise ValueError(flask.request.base_url)
        return flask.request.base_url
