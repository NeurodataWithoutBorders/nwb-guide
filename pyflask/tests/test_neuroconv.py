from jsonschema import validate
from utils import get, post, get_converter_output_schema

# --------------------- Tests ---------------------
# Accesses the dictionary of all interfaces and their metadata
def test_get_all_interfaces(client):
    validate(
        get('neuroconv', client),
        schema={
            "type": "object",
            "patternProperties": {
                "^.*Interface$": {
                    "type": "object",
                    "properties": {
                        "label": {"type": "string"},
                        "keywords": {"type": "array", "items": {"type": "string"}},
                    },
                    "required": ["label", "keywords"],
                }
            },
        },
    )


# Test single interface schema request
def test_single_schema_request(client):
    interfaces = {"myname": "SpikeGLXRecordingInterface"}
    validate(post('neuroconv/schema', interfaces, client), schema=get_converter_output_schema(interfaces))


# Uses the NWBConverter Class to combine multiple interfaces
def test_multiple_schema_request(client):
    interfaces = {"myname": "SpikeGLXRecordingInterface", "myphyinterface": "PhySortingInterface"}
    data = post("/neuroconv/schema", interfaces, client)
    validate(data, schema=get_converter_output_schema(interfaces))
