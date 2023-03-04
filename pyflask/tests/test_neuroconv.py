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
def test_get_all_interfaces(client, all_interfaces):
    for key, value in all_interfaces.items():
        assert isinstance(key, str)
        assert isinstance(value['tags'], list)
        assert isinstance(value['name'], str)
        assert isinstance(value['category'], str)

# Accesses the schema for a single interface directly
def test_single_schema_request(client, all_interfaces):
    response = client.get(f"/neuroconv/schema/{list(all_interfaces.keys())[0]}", follow_redirects=True)
    data = response.json
    assert isinstance(data, dict)
    assert isinstance(data['required'], list)
    assert isinstance(data['properties'], dict)

# Uses the NWBConverter Class to combine multiple interfaces
def test_multiple_schema_request(client, all_interfaces):
    interfaces = list(all_interfaces.keys()) #[:2]
    response = client.get(f"/neuroconv/schema?interfaces={','.join(interfaces)}", follow_redirects=True)
    check_converter(response.json, interfaces)


# Uses the NWBConverter Class to combine all interfaces
def test_all_schema_request(client, all_interfaces):
    response = client.get("/neuroconv/schema", follow_redirects=True)
    check_converter(response.json, all_interfaces)

