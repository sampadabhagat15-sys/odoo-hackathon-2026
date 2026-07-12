"""
FuelLog and Expense business logic — straightforward create/list,
just validates the referenced vehicle (and optional trip) exist.
"""

from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.models.fuel_log import FuelLog
from app.models.trip import Trip
from app.models.vehicle import Vehicle
from app.schemas.fuel_expense import ExpenseCreate, FuelLogCreate


def _assert_vehicle_exists(db: Session, vehicle_id: str) -> None:
    if not db.query(Vehicle).filter(Vehicle.id == vehicle_id).first():
        raise HTTPException(status_code=404, detail="Vehicle not found")


def _assert_trip_exists(db: Session, trip_id: str) -> None:
    if not db.query(Trip).filter(Trip.id == trip_id).first():
        raise HTTPException(status_code=404, detail="Trip not found")


def create_fuel_log(db: Session, payload: FuelLogCreate) -> FuelLog:
    _assert_vehicle_exists(db, payload.vehicle_id)
    if payload.trip_id:
        _assert_trip_exists(db, payload.trip_id)

    log = FuelLog(**payload.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def list_fuel_logs(
    db: Session, vehicle_id: Optional[str] = None, trip_id: Optional[str] = None
) -> list[FuelLog]:
    query = db.query(FuelLog)
    if vehicle_id:
        query = query.filter(FuelLog.vehicle_id == vehicle_id)
    if trip_id:
        query = query.filter(FuelLog.trip_id == trip_id)
    return query.order_by(FuelLog.date.desc()).all()


def create_expense(db: Session, payload: ExpenseCreate) -> Expense:
    _assert_vehicle_exists(db, payload.vehicle_id)

    expense = Expense(**payload.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


def list_expenses(
    db: Session, vehicle_id: Optional[str] = None
) -> list[Expense]:
    query = db.query(Expense)
    if vehicle_id:
        query = query.filter(Expense.vehicle_id == vehicle_id)
    return query.order_by(Expense.date.desc()).all()
