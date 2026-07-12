"""
Shared schema base. Spec requires all timestamps in ISO format like
2026-07-12T14:30:00Z — Pydantic v2's default is a +00:00 offset, not
a literal 'Z'. ISODateTime is a drop-in replacement for `datetime`
that every schema should use for created_at/updated_at/etc so the
API always emits the Z-suffixed format FastAPI will actually render.
"""

from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, PlainSerializer


def _iso_z(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


ISODateTime = Annotated[datetime, PlainSerializer(_iso_z, return_type=str)]


class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
