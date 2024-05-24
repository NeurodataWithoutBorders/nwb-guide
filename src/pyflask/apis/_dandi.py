"""An API for handling requests to the DANDI Python API."""

from typing import List, Tuple, Union

import flask.restx

from ..utils import catch_exception_and_abort, server_error_responses

dandi_api = flask_restx.Namespace(
    name="dandi", description="Request various static listings from the DANDI Python API."
)


@dandi_api.route(rule="/get-recommended-species")
class SupportedSpecies(flask_restx.Resource):

    @neurosift_api.doc(
        description="Request the list of currently supported species (by Latin Binomial name) for DANDI. Note that any "
        "explicit NCBI taxonomy link is also supported.",
        responses=server_error_responses(codes=[200, 500]),
    )
    @catch_exception_and_abort(api=dandi_api, code=500)
    def get(self) -> Union[List[Tuple[List[str], str, str, str]], None]:
        from dandi.metadata.util import species_map

        return species_map
