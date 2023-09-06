from utils import get, post, get_converter_output_schema


def test_preload_imports(client):
    """Verify that the preload import endpoint returned good status."""
    result = get("startup", client)
    assert result == True
