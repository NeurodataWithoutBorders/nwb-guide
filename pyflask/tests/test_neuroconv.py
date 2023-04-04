from jsonschema import validate


def get_converter_output_schema(interfaces: dict):
    return {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "description": {"type": "string"},
            "version": {"type": "string"},
            "properties": {
                "type": "object",
                "properties": {
                    interface: {
                        "type": "object",
                        "properties": {
                            "properties": {"type": "object"},
                            "required": {"type": "array"},
                        },
                    }
                    for interface in interfaces.keys()
                },
                "additionalProperties": False,
            },
        },
    }


# --------------------- Tests ---------------------
# Accesses the dictionary of all interfaces and their metadata
def test_get_all_interfaces(client):
    all_interfaces = client.get("/neuroconv", follow_redirects=True).json
    validate(
        all_interfaces,
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
    data = client.post("/neuroconv/schema", json=interfaces, follow_redirects=True).json
    validate(data, schema=get_converter_output_schema(interfaces))


# Uses the NWBConverter Class to combine multiple interfaces
def test_multiple_schema_request(client):
    interfaces = {"myname": "SpikeGLXRecordingInterface", "myphyinterface": "PhySortingInterface"}
    data = client.post("/neuroconv/schema", json=interfaces, follow_redirects=True).json
    validate(data, schema=get_converter_output_schema(interfaces))
