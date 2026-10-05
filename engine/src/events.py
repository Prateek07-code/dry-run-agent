import json

from .errors import EngineError


def sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


def error_event(err: EngineError) -> str:
    return sse("error", {
        "stage": err.stage,
        "message": err.message,
        "recoverable": err.recoverable,
    })