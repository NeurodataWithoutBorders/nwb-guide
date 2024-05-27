"""An API for handling requests to the DANDI Python API."""

from typing import List, Tuple, Union

import flask_restx

dandi_api = flask_restx.Namespace(
    name="dandi", description="Request various static listings from the DANDI Python API."
)


@dandi_api.route(rule="/get-recommended-species")
class SupportedSpecies(flask_restx.Resource):

    @dandi_api.doc(
        description="Request the list of currently supported species (by Latin Binomial name) for DANDI. Note that any "
        "explicit NCBI taxonomy link is also supported.",
    )
    def get(self) -> Union[List[Tuple[List[str], str, str, str]], None]:
        from dandi.metadata.util import species_map

        return species_map
