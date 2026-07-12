from typing import Optional

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.enums import MaintenanceStatus
from app.schemas.envelope import APIResponse
from app.schemas.maintenance import MaintenanceCreate, MaintenanceOut
from app.services import maintenance_service

router = APIRouter()

MANAGE_MAINTENANCE = require_roles("fleet_manager", "admin")


@router.post(
    "",
    response_model=APIResponse[MaintenanceOut],
    status_code=status.HTTP_201_CREATED,
    summary="Create a maintenance record",
    description="Automatically switches the vehicle's status to In Shop, "
    "removing it from dispatch/driver selection. Blocked if the vehicle "
    "is On Trip, Retired, or already has active maintenance.",
    dependencies=[Depends(MANAGE_MAINTENANCE)],
)
def create_maintenance(payload: MaintenanceCreate, db: Session = Depends(get_db)):
    record = maintenance_service.create_maintenance(db, payload)
    return APIResponse(
        message="Maintenance record created — vehicle set to In Shop", data=record
    )


@router.get(
    "",
    response_model=APIResponse[list[MaintenanceOut]],
    summary="List maintenance records",
    description="Supports filtering by vehicle_id and status.",
)
def list_maintenance(
    vehicle_id: Optional[str] = None,
    status_filter: Optional[MaintenanceStatus] = None,
    db: Session = Depends(get_db),
):
    records = maintenance_service.list_maintenance(db, vehicle_id, status_filter)
    return APIResponse(data=records)


@router.get(
    "/{maintenance_id}",
    response_model=APIResponse[MaintenanceOut],
    summary="Get a maintenance record by id",
)
def get_maintenance(maintenance_id: str, db: Session = Depends(get_db)):
    record = maintenance_service.get_maintenance_or_404(db, maintenance_id)
    return APIResponse(data=record)


@router.post(
    "/{maintenance_id}/close",
    response_model=APIResponse[MaintenanceOut],
    summary="Close a maintenance record",
    description="Restores the vehicle to Available, unless it was "
    "separately marked Retired.",
    dependencies=[Depends(MANAGE_MAINTENANCE)],
)
def close_maintenance(maintenance_id: str, db: Session = Depends(get_db)):
    record = maintenance_service.close_maintenance(db, maintenance_id)
    return APIResponse(message="Maintenance closed", data=record)
