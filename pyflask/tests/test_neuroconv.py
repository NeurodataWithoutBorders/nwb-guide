# --------------------- Helper Functions ---------------------
def check_schema(data):
    assert isinstance(data, dict)
    assert isinstance(data['required'], list)
    assert isinstance(data['properties'], dict)


def check_converter(data, interfaces):
    check_schema(data)
    for interface in interfaces:
        assert isinstance(data['properties'][interface], dict)
        check_schema(data)
    assert isinstance(data['title'], str)
    assert isinstance(data['description'], str)
    assert isinstance(data['version'], str)

# --------------------- Tests ---------------------
# Accesses the dictionary of all interfaces and their metadata
def test_get_all_interfaces(client):
    # def test_get_all_interfaces(client, all_interfaces):
    all_interfaces = client.get("/neuroconv", follow_redirects=True).json
    for key, value in all_interfaces.items():
        assert isinstance(key, str)
        assert isinstance(value["modality"], str)
        assert isinstance(value["name"], str)
        assert isinstance(value["technique"], str)

# Uses the NWBConverter Class to combine multiple interfaces
def test_multiple_schema_request(client):
    interfaces = ["SpikeGLXRecordingInterface", "PhySortingInterface"][:1]
    response = client.get(f"/neuroconv/schema?interfaces={','.join(interfaces)}", follow_redirects=True)
    check_converter(response.json, interfaces)