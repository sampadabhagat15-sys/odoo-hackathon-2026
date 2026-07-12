from typing import Optional

from pydantic import BaseModel, Field

from app.models.enums import VehicleStatus
from app.schemas.base import ORMBase, ISODateTime


class VehicleCreate(BaseModel):
    registration_number: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=100)
    type: str = Field(..., min_length=1, max_length=50)
    max_load_capacity: float = Field(..., gt=0, description="kg")
    odometer: float = Field(0, ge=0)
    acquisition_cost: float = Field(..., gt=0)
    region: Optional[str] = Field(None, max_length=100)
    # Status intentionally omitted on create — every new vehicle starts
    # Available. Status changes happen through dedicated transitions
    # (dispatch/complete/maintenance) in later modules, not free-form edits.


class VehicleUpdate(BaseModel):
    """Partial update — all fields optional. Status is NOT editable here;
    it's controlled by trip/maintenance workflows in later modules to
    keep state transitions consistent with the spec's business rules."""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[str] = Field(None, min_length=1, max_length=50)
    max_load_capacity: Optional[float] = Field(None, gt=0)
    odometer: Optional[float] = Field(None, ge=0)
    acquisition_cost: Optional[float] = Field(None, gt=0)
    region: Optional[str] = Field(None, max_length=100)


class VehicleOut(ORMBase):
    id: str
    registration_number: str
    name: str
    type: str
    max_load_capacity: float
    odometer: float
    acquisition_cost: float
    region: Optional[str]
    status: VehicleStatus
    created_at: ISODateTime
    updated_at: ISODateTime
