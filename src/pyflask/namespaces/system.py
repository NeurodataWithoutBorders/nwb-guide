"""An API for handling general system information."""

from typing import Dict, Union

import flask_restx

system_namespace = flask_restx.Namespace(name="system", description="Request various system specific information.")


@system_namespace.route("/cpus")
class GetCPUInfo(flask_restx.Resource):

    @system_namespace.doc(
        description="Request the number of physical and logical cores on the system.",
    )
    def get(self) -> Union[Dict[str, int], None]:
        from psutil import cpu_count

        physical = cpu_count(logical=False)
        logical = cpu_count()

        return dict(physical=physical, logical=logical)