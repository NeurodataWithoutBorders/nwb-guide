from flask_restx import Namespace, Resource, reqparse
from namespaces import get_namespace, NamespaceEnum
from manageNeuroconv import get_all_interface_info
from errorHandlers import notBadRequestException

api = Namespace("neuroconv", description="Neuroconv API for NWB GUIDE")
api = get_namespace(NamespaceEnum.NEUROCONV)

parser = reqparse.RequestParser()
parser.add_argument("interfaces", type=str, action="split", help="Interfaces cannot be converted")


@api.route("/")
class AllInterfaces(Resource):
    @api.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def get(self):

        try:
            return get_all_interface_info()
        except Exception as e:
            if notBadRequestException(e):
                api.abort(500, str(e))
            raise e
