"""
FuelLog and Expense business logic — straightforward create/list,
just validates the referenced vehicle (and optional trip) exist.
Expense also has a review workflow: Pending -> Approved/Rejected.
"""

from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.models.enums import ExpenseStatus
from app.models.fuel_log import FuelLog
from app.models.trip import Trip
from app.models.vehicle import Vehicle
from app.schemas.fuel_expense import ExpenseCreate, FuelLogCreate


def _now():
    from datetime import datetime, timezone

    return datetime.now(timezone.utc)


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


def create_expense(db: Session, payload: ExpenseCreate, submitted_by: str) -> Expense:
    _assert_vehicle_exists(db, payload.vehicle_id)

    expense = Expense(
        **payload.model_dump(),
        status=ExpenseStatus.PENDING,
        submitted_by=submitted_by,
    )
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


def _get_expense_or_404(db: Session, expense_id: str) -> Expense:
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


def _review_expense(db: Session, expense_id: str, reviewer_id: str, new_status: ExpenseStatus) -> Expense:
    expense = _get_expense_or_404(db, expense_id)
    if expense.status != ExpenseStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only Pending expenses can be reviewed (current status: {expense.status.value})",
        )
    expense.status = new_status
    expense.reviewed_by = reviewer_id
    expense.reviewed_at = _now()
    db.commit()
    db.refresh(expense)
    return expense


def approve_expense(db: Session, expense_id: str, reviewer_id: str) -> Expense:
    return _review_expense(db, expense_id, reviewer_id, ExpenseStatus.APPROVED)


def reject_expense(db: Session, expense_id: str, reviewer_id: str) -> Expense:
    return _review_expense(db, expense_id, reviewer_id, ExpenseStatus.REJECTED)
