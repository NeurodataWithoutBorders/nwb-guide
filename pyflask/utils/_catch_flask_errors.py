import contextlib

import flask_restx
from typing import List, Union, Dict


def server_error_responses(*, codes: List[str]) -> Dict[int, str]:
    all_server_error_responses = {
        200: "Success",
        400: "Bad request",
        404: "Resource is not accessible.",
        500: ("Internalerver error"),
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
