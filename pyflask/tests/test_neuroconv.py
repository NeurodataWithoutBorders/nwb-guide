# --------------------- Helper Functions ---------------------

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
