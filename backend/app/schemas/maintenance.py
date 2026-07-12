from datetime import date
from typing import Optional

from pydantic import BaseModel, Field

from app.models.enums import MaintenanceStatus
from app.schemas.base import ORMBase, ISODateTime


class MaintenanceCreate(BaseModel):
    vehicle_id: str
    description: str = Field(..., min_length=1, max_length=200)
    cost: float = Field(0, ge=0)
    start_date: date


class MaintenanceOut(ORMBase):
    id: str
    vehicle_id: str
    description: str
    cost: float
    start_date: date
    end_date: Optional[date]
    status: MaintenanceStatus
    created_at: ISODateTime
    updated_at: ISODateTime
