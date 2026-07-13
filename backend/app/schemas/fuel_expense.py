from datetime import date
from typing import Optional

from pydantic import BaseModel, Field

from app.models.enums import ExpenseType, ExpenseStatus
from app.schemas.base import ORMBase, ISODateTime


class FuelLogCreate(BaseModel):
    vehicle_id: str
    trip_id: Optional[str] = None
    liters: float = Field(..., gt=0)
    cost: float = Field(..., ge=0)
    date: date


class FuelLogOut(ORMBase):
    id: str
    vehicle_id: str
    trip_id: Optional[str]
    liters: float
    cost: float
    date: date
    created_at: ISODateTime
    updated_at: ISODateTime


class ExpenseCreate(BaseModel):
    vehicle_id: str
    type: ExpenseType = ExpenseType.OTHER
    amount: float = Field(..., gt=0)
    date: date
    description: Optional[str] = Field(None, max_length=200)


class ExpenseOut(ORMBase):
    id: str
    vehicle_id: str
    type: ExpenseType
    amount: float
    date: date
    description: Optional[str]
    status: ExpenseStatus
    submitted_by: Optional[str]
    reviewed_by: Optional[str]
    reviewed_at: Optional[ISODateTime]
    created_at: ISODateTime
    updated_at: ISODateTime
