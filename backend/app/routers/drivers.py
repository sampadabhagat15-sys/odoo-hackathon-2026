from typing import Optional

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.enums import DriverStatus
from app.schemas.envelope import APIResponse
from app.schemas.driver import DriverCreate, DriverUpdate, DriverOut
from app.services import driver_service

router = APIRouter()

# Fleet Manager and Safety Officer both work with driver records per
# the spec (Safety Officer tracks license validity/safety scores);
# Admin has full access everywhere.
MANAGE_DRIVERS = require_roles("fleet_manager", "safety_officer", "admin")
# Suspending/reactivating a driver is specifically a Safety Officer
# compliance action, scoped tighter than general CRUD.
MANAGE_COMPLIANCE = require_roles("safety_officer", "admin")


@router.post(
    "",
    response_model=APIResponse[DriverOut],
    status_code=status.HTTP_201_CREATED,
    summary="Register a new driver",
    description="License number must be unique. New drivers always start "
    "with status Available.",
    dependencies=[Depends(MANAGE_DRIVERS)],
)
def create_driver(payload: DriverCreate, db: Session = Depends(get_db)):
    driver = driver_service.create_driver(db, payload)
    return APIResponse(message="Driver registered successfully", data=driver)


@router.get(
    "",
    response_model=APIResponse[list[DriverOut]],
    summary="List drivers",
    description="Supports filtering by status.",
)
def list_drivers(
    status_filter: Optional[DriverStatus] = None, db: Session = Depends(get_db)
):
    drivers = driver_service.list_drivers(db, status_filter)
    return APIResponse(data=drivers)


@router.get(
    "/{driver_id}",
    response_model=APIResponse[DriverOut],
    summary="Get a driver by id",
)
def get_driver(driver_id: str, db: Session = Depends(get_db)):
    driver = driver_service.get_driver_or_404(db, driver_id)
    return APIResponse(data=driver)


@router.put(
    "/{driver_id}",
    response_model=APIResponse[DriverOut],
    summary="Update a driver",
    description="Partial update. Status is not editable here — use "
    "the suspend/reactivate endpoints for compliance actions.",
    dependencies=[Depends(MANAGE_DRIVERS)],
)
def update_driver(driver_id: str, payload: DriverUpdate, db: Session = Depends(get_db)):
    driver = driver_service.update_driver(db, driver_id, payload)
    return APIResponse(message="Driver updated successfully", data=driver)


@router.post(
    "/{driver_id}/suspend",
    response_model=APIResponse[DriverOut],
    summary="Suspend a driver",
    description="Compliance action — a driver On Trip cannot be suspended.",
    dependencies=[Depends(MANAGE_COMPLIANCE)],
)
def suspend_driver(driver_id: str, db: Session = Depends(get_db)):
    driver = driver_service.suspend_driver(db, driver_id)
    return APIResponse(message="Driver suspended", data=driver)


@router.post(
    "/{driver_id}/reactivate",
    response_model=APIResponse[DriverOut],
    summary="Reactivate a suspended driver",
    dependencies=[Depends(MANAGE_COMPLIANCE)],
)
def reactivate_driver(driver_id: str, db: Session = Depends(get_db)):
    driver = driver_service.reactivate_driver(db, driver_id)
    return APIResponse(message="Driver reactivated", data=driver)
