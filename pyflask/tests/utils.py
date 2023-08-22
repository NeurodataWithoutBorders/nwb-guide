import requests


def get(path, client):
    return (
        (requests.get(f"http://localhost:{client}/{path}", allow_redirects=True)).json()
        if isinstance(client, int)
        else client.get(f"/{path}", follow_redirects=True).json
    )


def post(path, json, client):
    return (
        (requests.post(f"http://localhost:{client}/{path}", json=json, allow_redirects=True)).json()
        if isinstance(client, int)
        else client.post(path, json=json, follow_redirects=True).json
    )


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
