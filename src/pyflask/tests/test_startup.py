from utils import get, get_converter_output_schema, post


def test_preload_imports(client):
    """Verify that the preload import endpoint returned good status."""
    result = get("startup/preload-imports", client)
    assert result == True
