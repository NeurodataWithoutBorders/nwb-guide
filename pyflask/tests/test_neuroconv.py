from jsonschema import validate


all_interfaces_schema = {
    "type": "object",
    "patternProperties": {
        "^.*Interface$": {
            "type": "object",
            "properties": {
                "modality": {"type": "string"},
                "name": {"type": "string"},
                "technique": {"type": "string"},
            },
        }
    },
}


# --------------------- Tests ---------------------
# Accesses the dictionary of all interfaces and their metadata
def test_get_all_interfaces(client):
    all_interfaces = client.get("/neuroconv", follow_redirects=True).json
    validate(all_interfaces, schema=all_interfaces_schema)


# Uses the NWBConverter Class to combine multiple interfaces
def test_multiple_schema_request(client):

    interfaces = ["SpikeGLXRecordingInterface", "PhySortingInterface"]

    data = client.get(f"/neuroconv/schema?interfaces={','.join(interfaces)}", follow_redirects=True).json

    converter_output_schema = {
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
                    for interface in interfaces
                },
                "additionalProperties": False,
            },
        },
    }

    validate(data, schema=converter_output_schema)
