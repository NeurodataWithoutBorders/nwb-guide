import contextlib
from typing import Dict, List, Union

import flask_restx


def server_error_responses(*, codes: List[str]) -> Dict[int, str]:
    all_server_error_responses = {
        200: "Success",
        400: "Bad request",
        404: "Resource is not accessible.",
        500: "Internal server error",
    }

    selected_responses = {code: all_server_error_responses[code] for code in codes}
    return selected_responses


@contextlib.contextmanager
def catch_exception_and_abort(*, api: Union[flask_restx.Api, flask_restx.Namespace], code: int) -> None:
    try:
        yield
    except Exception as exception:
        exception_type = type(exception)
        exception_message = str(exception)
        api.abort(code=code, message=f"{exception_type}: {exception_message}")
        raise exception


def abort_if_not_nwb_file(file_path: str, api: flask_restx.Api) -> None:
    """Check if the file path has a .nwb extension; otherwise, aport the API with code 400."""
    if ".nwb" not in file_path:
        code = 400
        base_message = server_error_responses(codes=[code])[code]
        message = f"{base_message}: Path does not point to an NWB file."
        api.abort(code=code, message=message)
