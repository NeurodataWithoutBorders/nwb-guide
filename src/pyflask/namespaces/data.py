"""API endpoint definitions for interacting with NeuroConv."""

import traceback

from flask_restx import Namespace, Resource, reqparse
from manageNeuroconv import generate_dataset, generate_test_data

data_namespace = Namespace("data", description="API route for dataset generation in the NWB GUIDE.")


@data_namespace.errorhandler(Exception)
def exception_handler(error):
    exceptiondata = traceback.format_exception(type(error), error, error.__traceback__)
    return {"message": exceptiondata[-1], "traceback": "".join(exceptiondata)}


generate_test_data_parser = reqparse.RequestParser()
generate_test_data_parser.add_argument("output_path", type=str, required=True)


@data_namespace.route("/generate")
@data_namespace.expect(generate_test_data_parser)
class GeneratetestData(Resource):
    @data_namespace.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        try:
            arguments = generate_test_data_parser.parse_args()
            generate_test_data(output_path=arguments["output_path"])
        except Exception as exception:
            data_namespace.abort(500, str(exception))
            raise exception


generate_test_dataset_parser = reqparse.RequestParser()
generate_test_dataset_parser.add_argument("output_path", type=str, required=True)
generate_test_dataset_parser.add_argument("input_path", type=str, required=True)


@data_namespace.route("/generate/dataset")
@data_namespace.expect(generate_test_data_parser)
class GenerateDataset(Resource):
    @data_namespace.doc(responses={200: "Success", 400: "Bad Request", 500: "Internal server error"})
    def post(self):
        try:
            arguments = generate_test_dataset_parser.parse_args()
            return generate_dataset(input_path=arguments["input_path"], output_path=arguments["output_path"])

        except Exception as exception:
            data_namespace.abort(500, str(exception))
