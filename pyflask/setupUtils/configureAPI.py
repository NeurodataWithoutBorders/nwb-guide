from os import getenv

from flask_restx import Api


def configureAPI():
    return Api(
        version=getenv("API_VERSION"),
        title="NWB GUIDE API",
        description="NWB GUIDE's API",
    )
