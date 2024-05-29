"""API endpoint definitions for startup operations."""

from flask_restx import Namespace, Resource

startup_namespace = Namespace("startup", description="API for startup commands related to the NWB GUIDE.")

parser = startup_namespace.parser()
parser.add_argument(
    "arg",
    type=str,
    required=True,
    help="Argument that will be echoed back to the caller",
    location="args",
)


@startup_namespace.route("/echo")
class Echo(Resource):
    @startup_namespace.expect(parser)
    def get(self):
        args = parser.parse_args()
        return args["arg"]


@startup_namespace.route("/preload-imports")
class PreloadImports(Resource):
    """
    Preload various imports on startup instead of waiting for them later on.

    Python caches all modules that have been imported at least once in the same kernel,
    even if their namespace is not always exposed to a given scope. This means that later imports
    simply expose the cached namespaces to their scope instead of retriggering the entire import.
    """

    @startup_namespace.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def get(self):
        import neuroconv

        return True
