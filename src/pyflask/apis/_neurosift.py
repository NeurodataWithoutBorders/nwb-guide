"""An API for handling file system communication with the standalone Neurosift preview page."""

import collections
from typing import Union

import flask
import flask.restx

from ..utils import (
    abort_if_not_nwb_file,
    catch_exception_and_abort,
    server_error_responses,
)

neurosift_api = flask_restx.Namespace(
    name="neurosift", description="Handle file system communication with the " "standalone Neurosift preview page."
)

# A global in-memory registry of NWB files - much faster than asking if file is in a global list
# Keys are NWB files; values are booleans indicating if the base URL has been exposed for that file
neurosift_file_registry = collections.defaultdict(bool)


@neurosift_api.route(rule="/files/<path:file_path>")
@neurosift_api.doc(
    description="Handle adding and fetching NWB files from the global file registry.",
)
class NeurosiftFileManager(flask_restx.Resource):

    @neurosift_api.doc(
        description="If the file path has been added to the registry (and therefore sent its base "
        "URL), return the absolute file path. This is implicitly called by Neurosift.",
        responses=server_error_responses(codes=[200, 400, 500]),
    )
    @catch_exception_and_abort(api=neurosift_api, code=500)
    def get(self, file_path: str) -> Union[flask.Response, None]:
        abort_if_not_nwb_file(file_path=file_path, api=neurosift_api)
        if neurosift_file_registry[file_path]:
            code = 404
            base_message = server_error_responses(codes=[code])[code]
            message = f"{base_message}: The base URL has not been exposed for this NWB file."
            api.abort(code=code, message=message)

            return

        # Decode any URL encoding applied to the file path
        parsed_file_path = unquote(file_path)

        # Check if the file path is relative
        is_file_relative = not isabs(parsed_file_path)
        if is_file_relative:
            parsed_file_path = f"/{parsed_file_path}"

        return flask.send_file(path_or_file=parsed_file_path)

    @neurosift_api.doc(
        description="Add the file to a global in-memory registry (refreshes on App restart) and return "
        "the base URL of the newly "
        "added file",
        responses=server_error_responses(codes=[200, 400, 500]),
    )
    @catch_exception_and_abort(api=neurosift_api, code=500)
    def post(self, file_path: str) -> Union[str, None]:
        abort_if_not_nwb_file(file_path=file_path, api=neurosift_api)

        neurosift_file_registry[file_path] = True

        return request.base_url
