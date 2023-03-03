from flask_restx import Namespace, Resource, reqparse # , request
from namespaces import get_namespace, NamespaceEnum
from manageNeuroconv import (
    get_all_interfaces,
    get_schema,
)
from errorHandlers import notBadRequestException

api = Namespace('neuroconv', description='Neuroconv API for NWB GUIDE') 
api = get_namespace(NamespaceEnum.NEUROCONV)
 
parser = reqparse.RequestParser()
parser.add_argument('interfaces', type=str, action='split', help='Interfaces cannot be converted')

@api.route('/')
class AllInterfaces(Resource):
  @api.doc(responses={200: 'Success', 400: 'Bad Request', 500: "Internal server error"})
  def get(self):

    try:
      return get_all_interfaces()
    except Exception as e:
        if notBadRequestException(e):
            api.abort(500, str(e))
        raise e


@api.route('/schema/<string:interface>')
class Schema(Resource):
  @api.doc(responses={200: 'Success', 400: 'Bad Request', 500: "Internal server error"})
  def get(self, interface):

    try:
      return get_schema(interface)
    except Exception as e:
        if notBadRequestException(e):
            api.abort(500, str(e))
        raise e
    

@api.route('/schema')
class Schemas(Resource):
  @api.doc(responses={200: 'Success', 400: 'Bad Request', 500: "Internal server error"})
  def get(self):
      args = parser.parse_args()
      interfaces = args['interfaces']
      try:
        return get_schema(interfaces)
      except Exception as e:
          if notBadRequestException(e):
              api.abort(500, str(e))
          raise e
