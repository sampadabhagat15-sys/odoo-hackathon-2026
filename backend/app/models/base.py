"""
Shared columns every table needs, per spec: id (UUID), created_at, updated_at.
UUIDs stored as strings (36 chars) so this works identically on SQLite
and Postgres with zero migration pain.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime


def generate_uuid() -> str:
    return str(uuid.uuid4())


class BaseModelMixin:
    id = Column(String(36), primary_key=True, default=generate_uuid)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
