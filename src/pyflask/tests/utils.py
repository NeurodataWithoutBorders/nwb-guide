import requests


def get(path, client):
    if isinstance(client, str):
        r = requests.get(f"{client}/{path}", allow_redirects=True)
        r.raise_for_status()
        return r.json()
    else:
        return client.get(f"/{path}", follow_redirects=True).json


def post(path, json, client):
    if isinstance(client, str):
        r = requests.post(f"{client}/{path}", json=json, allow_redirects=True)
        r.raise_for_status()
        return r.json()
    else:
        return client.post(path, json=json, follow_redirects=True).json


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
