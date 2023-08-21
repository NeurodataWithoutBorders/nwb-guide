"""API endpoint definitions for startup operations."""
from flask_restx import Namespace, Resource

startup_api = Namespace("startup", description="API for startup commands related to the NWB GUIDE.")

parser = startup_api.parser()
parser.add_argument(
    "arg",
    type=str,
    required=True,
    help="Argument that will be echoed back to the caller",
    location="args",
)


@startup_api.route("/echo")
class Echo(Resource):
    @startup_api.expect(parser)
    def get(self):
        args = parser.parse_args()
        return args["arg"]
