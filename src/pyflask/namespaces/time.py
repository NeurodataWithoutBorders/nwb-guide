"""An API for handling general time information."""

from typing import Dict, Union

import flask_restx

time_namespace = flask_restx.Namespace(name="time", description="Request time-related information.")


@time_namespace.route("/timezones")
class GetTimezones(flask_restx.Resource):

    @time_namespace.doc(
        description="Request the available timezones on the system.",
    )
    def get(self) -> Union[Dict[str, int], None]:
        from zoneinfo import available_timezones
        return list(available_timezones())
    

@time_namespace.route("/timezone")
class GetTimezones(flask_restx.Resource):

    @time_namespace.doc(
        description="Request the current timezone on the system.",
    )
    def get(self) -> Union[Dict[str, int], None]:
        from tzlocal import get_localzone
        return str(get_localzone())
