from typing import Optional

from pydantic import BaseModel, Field

from app.models.enums import TripStatus
from app.schemas.base import ORMBase, ISODateTime


class TripCreate(BaseModel):
    source: str = Field(..., min_length=1, max_length=200)
    destination: str = Field(..., min_length=1, max_length=200)
    vehicle_id: str
    driver_id: str
    cargo_weight: float = Field(..., gt=0, description="kg")
    planned_distance: float = Field(..., gt=0, description="km")


class TripComplete(BaseModel):
    final_odometer: float = Field(..., gt=0)
    fuel_consumed: float = Field(..., ge=0, description="liters")


class TripOut(ORMBase):
    id: str
    source: str
    destination: str
    vehicle_id: str
    driver_id: str
    cargo_weight: float
    planned_distance: float
    actual_distance: Optional[float]
    fuel_consumed: Optional[float]
    status: TripStatus
    dispatched_at: Optional[ISODateTime]
    completed_at: Optional[ISODateTime]
    cancelled_at: Optional[ISODateTime]
    created_at: ISODateTime
    updated_at: ISODateTime
