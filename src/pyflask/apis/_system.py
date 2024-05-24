"""An API for handling general system information."""

from typing import Dict, Union

import flask.restx

from ..utils import catch_exception_and_abort, server_error_responses

system_api = flask_restx.Namespace(name="system", description="Request various system specific information.")


@system_api.route("/cpus")
class SupportedSpecies(flask_restx.Resource):

    @system_api.doc(
        description="Request the number of physical and logical cores on the system.",
        responses=server_error_responses(codes=[200, 500]),
    )
    @catch_exception_and_abort(api=system_api, code=500)
    def get(self) -> Union[Dict[str, int], None]:
        from psutil import cpu_count

        physical = cpu_count(logical=False)
        logical = cpu_count()

        return dict(physical=physical, logical=logical)
