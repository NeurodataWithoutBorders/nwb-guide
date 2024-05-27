"""API endpoint definitions for interacting with NeuroConv."""

import traceback

from apis.utils import catch_exception_and_abort
from flask_restx import Namespace, Resource, reqparse
from manageNeuroconv import generate_dataset, generate_test_data

data_api = Namespace(name="example-data", description="API route for dataset generation in the NWB GUIDE.")


generate_test_data_parser = reqparse.RequestParser()
generate_test_data_parser.add_argument("output_path", type=str, required=True)


@data_api.route("/generate/single-session")
@data_api.expect(generate_test_data_parser)
class GenerateSingleSessions(Resource):
    @data_api.doc(description="Generate synthetic data for a single session.")
    def post(self):
        arguments = generate_test_data_parser.parse_args()

        generate_test_data(output_path=arguments["output_path"])


generate_test_dataset_parser = reqparse.RequestParser()
generate_test_dataset_parser.add_argument("output_path", type=str, required=True)
generate_test_dataset_parser.add_argument("input_path", type=str, required=True)


@data_api.route("/generate/dataset")
@data_api.expect(generate_test_data_parser)
class GenerateDataset(Resource):
    @data_api.doc(
        description=(
            "Copy the data from /generate/single-session into a folder structure "
            "representing a multi-session experiment."
        )
    )
    def post(self):
        arguments = generate_test_dataset_parser.parse_args()

        return generate_dataset(input_path=arguments["input_path"], output_path=arguments["output_path"])
