import json

def format_sse(data: str, event=None) -> str:
    msg = f"data: {json.dumps(data)}\n\n"
    if event is not None:
        msg = f"event: {event}\n{msg}"
    return msg