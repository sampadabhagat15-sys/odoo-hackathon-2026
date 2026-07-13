from typing import Optional

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User
from app.schemas.envelope import APIResponse
from app.schemas.fuel_expense import (
    ExpenseCreate,
    ExpenseOut,
    FuelLogCreate,
    FuelLogOut,
)
from app.services import cost_service, fuel_expense_service

router = APIRouter()

# Dispatcher/driver-adjacent staff log fuel and expenses day-to-day;
# Fleet Manager and Admin have full access too. Financial Analyst is
# intentionally read-only here (reviews, doesn't record transactions).
LOG_FUEL_EXPENSE = require_roles("dispatcher", "fleet_manager", "admin")

# Approve/reject is a Financial Analyst review action per the spec
# ("Financial Analyst reviews operational expenses"); Fleet Manager
# kept as an operational super-role, Admin has full access everywhere.
REVIEW_EXPENSE = require_roles("financial_analyst", "fleet_manager", "admin")


@router.post(
    "/fuel-logs",
    response_model=APIResponse[FuelLogOut],
    status_code=status.HTTP_201_CREATED,
    summary="Record a fuel log",
    dependencies=[Depends(LOG_FUEL_EXPENSE)],
)
def create_fuel_log(payload: FuelLogCreate, db: Session = Depends(get_db)):
    log = fuel_expense_service.create_fuel_log(db, payload)
    return APIResponse(message="Fuel log recorded", data=log)


@router.get(
    "/fuel-logs",
    response_model=APIResponse[list[FuelLogOut]],
    summary="List fuel logs",
    description="Supports filtering by vehicle_id and trip_id.",
)
def list_fuel_logs(
    vehicle_id: Optional[str] = None,
    trip_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    logs = fuel_expense_service.list_fuel_logs(db, vehicle_id, trip_id)
    return APIResponse(data=logs)


@router.post(
    "/expenses",
    response_model=APIResponse[ExpenseOut],
    status_code=status.HTTP_201_CREATED,
    summary="Record an expense",
    description="e.g. tolls, fines, parking, repairs, or other operational costs "
    "(separate from fuel/maintenance). Starts as Pending, awaiting review.",
    dependencies=[Depends(LOG_FUEL_EXPENSE)],
)
def create_expense(
    payload: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = fuel_expense_service.create_expense(db, payload, submitted_by=current_user.id)
    return APIResponse(message="Expense recorded, pending review", data=expense)


@router.get(
    "/expenses",
    response_model=APIResponse[list[ExpenseOut]],
    summary="List expenses",
    description="Supports filtering by vehicle_id.",
)
def list_expenses(vehicle_id: Optional[str] = None, db: Session = Depends(get_db)):
    expenses = fuel_expense_service.list_expenses(db, vehicle_id)
    return APIResponse(data=expenses)


@router.post(
    "/expenses/{expense_id}/approve",
    response_model=APIResponse[ExpenseOut],
    summary="Approve a pending expense",
    dependencies=[Depends(REVIEW_EXPENSE)],
)
def approve_expense(
    expense_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = fuel_expense_service.approve_expense(db, expense_id, reviewer_id=current_user.id)
    return APIResponse(message="Expense approved", data=expense)


@router.post(
    "/expenses/{expense_id}/reject",
    response_model=APIResponse[ExpenseOut],
    summary="Reject a pending expense",
    dependencies=[Depends(REVIEW_EXPENSE)],
)
def reject_expense(
    expense_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = fuel_expense_service.reject_expense(db, expense_id, reviewer_id=current_user.id)
    return APIResponse(message="Expense rejected", data=expense)


@router.get(
    "/vehicles/{vehicle_id}/operational-cost",
    response_model=APIResponse[dict],
    summary="Total operational cost for a vehicle",
    description="Fuel + Maintenance cost, per spec 3.7. "
    "(Tolls/other Expenses are tracked separately and not included here, "
    "matching the spec's literal Fuel + Maintenance definition.)",
)
def get_operational_cost(vehicle_id: str, db: Session = Depends(get_db)):
    data = cost_service.total_operational_cost(db, vehicle_id)
    return APIResponse(data=data)
