from jsonschema import validate
from utils import get, post, get_converter_output_schema


def test_get_all_interfaces(client):
    """Accesses the dictionary of all interfaces and their metadata."""
    validate(
        get("neuroconv", client),
        schema={
            "type": "object",
            "patternProperties": {
                "^.*Interface$": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "label": {"type": "string"},
                        "description": {"type": "string"},
                        "keywords": {"type": "array", "items": {"type": "string"}},
                    },
                    "additionalProperties": False,
                    "required": ["name", "keywords"],
                }
            },
        },
    )


def test_single_schema_request(client):
    """Test single interface schema request."""
    interfaces = {"myname": "SpikeGLXRecordingInterface"}
    validate(post("neuroconv/schema", interfaces, client), schema=get_converter_output_schema(interfaces))


def test_multiple_schema_request(client):
    """Uses the NWBConverter Class to combine multiple interfaces."""
    interfaces = {"myname": "SpikeGLXRecordingInterface", "myphyinterface": "PhySortingInterface"}
    data = post("/neuroconv/schema", interfaces, client)
    validate(data, schema=get_converter_output_schema(interfaces))
