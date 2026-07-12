from datetime import date
from typing import Optional

from pydantic import BaseModel, Field

from app.models.enums import DriverStatus
from app.schemas.base import ORMBase, ISODateTime


class DriverCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    license_number: str = Field(..., min_length=1, max_length=50)
    license_category: str = Field(..., min_length=1, max_length=50)
    license_expiry_date: date
    contact_number: str = Field(..., min_length=1, max_length=20)
    safety_score: float = Field(100.0, ge=0, le=100)
    # Status omitted on create, same reasoning as Vehicle — starts Available.


class DriverUpdate(BaseModel):
    """Partial update. Status is NOT editable here for Available/On Trip
    (controlled by trip workflows), but Safety Officers do need to be
    able to Suspend a driver directly — that's exposed via a separate
    dedicated endpoint, not this generic update, to keep the action
    auditable and role-gated on its own."""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    license_category: Optional[str] = Field(None, min_length=1, max_length=50)
    license_expiry_date: Optional[date] = None
    contact_number: Optional[str] = Field(None, min_length=1, max_length=20)
    safety_score: Optional[float] = Field(None, ge=0, le=100)


class DriverOut(ORMBase):
    id: str
    name: str
    license_number: str
    license_category: str
    license_expiry_date: date
    contact_number: str
    safety_score: float
    status: DriverStatus
    created_at: ISODateTime
    updated_at: ISODateTime
