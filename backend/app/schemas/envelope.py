"""
Every endpoint must return this exact shape:
    Success: {"success": true, "message": "...", "data": {...}}
    Error:   {"success": false, "message": "..."}

APIResponse[T] wraps success responses (use as response_model).
Error responses are produced globally by the exception handlers in
main.py, so individual routers never need to build an error envelope
by hand — just raise HTTPException as usual.
"""

from typing import Generic, TypeVar, Optional

from pydantic import BaseModel

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = ""
    data: Optional[T] = None


def ok(data=None, message: str = "") -> dict:
    """Helper for building a success envelope inline when not using
    response_model=APIResponse[...] (e.g. for List responses)."""
    return {"success": True, "message": message, "data": data}
