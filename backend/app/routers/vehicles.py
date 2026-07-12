from typing import Optional

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.enums import VehicleStatus
from app.schemas.envelope import APIResponse
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleOut
from app.services import vehicle_service

router = APIRouter()

# Fleet Manager owns the vehicle registry per the spec's target-user
# descriptions; Admin has full access everywhere.
MANAGE_VEHICLES = require_roles("fleet_manager", "admin")


@router.post(
    "",
    response_model=APIResponse[VehicleOut],
    status_code=status.HTTP_201_CREATED,
    summary="Register a new vehicle",
    description="Registration number must be unique. New vehicles always "
    "start with status Available.",
    dependencies=[Depends(MANAGE_VEHICLES)],
)
def create_vehicle(payload: VehicleCreate, db: Session = Depends(get_db)):
    vehicle = vehicle_service.create_vehicle(db, payload)
    return APIResponse(message="Vehicle registered successfully", data=vehicle)


@router.get(
    "",
    response_model=APIResponse[list[VehicleOut]],
    summary="List vehicles",
    description="Supports filtering by type, status, and region "
    "(matches the dashboard filter requirements).",
)
def list_vehicles(
    type: Optional[str] = None,
    status_filter: Optional[VehicleStatus] = None,
    region: Optional[str] = None,
    db: Session = Depends(get_db),
):
    vehicles = vehicle_service.list_vehicles(db, type, status_filter, region)
    return APIResponse(data=vehicles)


@router.get(
    "/{vehicle_id}",
    response_model=APIResponse[VehicleOut],
    summary="Get a vehicle by id",
)
def get_vehicle(vehicle_id: str, db: Session = Depends(get_db)):
    vehicle = vehicle_service.get_vehicle_or_404(db, vehicle_id)
    return APIResponse(data=vehicle)


@router.put(
    "/{vehicle_id}",
    response_model=APIResponse[VehicleOut],
    summary="Update a vehicle",
    description="Partial update. Status is not editable here — it's "
    "controlled by dispatch/maintenance workflows in other modules.",
    dependencies=[Depends(MANAGE_VEHICLES)],
)
def update_vehicle(vehicle_id: str, payload: VehicleUpdate, db: Session = Depends(get_db)):
    vehicle = vehicle_service.update_vehicle(db, vehicle_id, payload)
    return APIResponse(message="Vehicle updated successfully", data=vehicle)


@router.delete(
    "/{vehicle_id}",
    response_model=APIResponse[VehicleOut],
    summary="Retire a vehicle",
    description="Soft-delete: sets status to Retired rather than removing "
    "the row, since vehicles are referenced by trip/maintenance/fuel "
    "history. A vehicle currently On Trip cannot be retired.",
    dependencies=[Depends(MANAGE_VEHICLES)],
)
def retire_vehicle(vehicle_id: str, db: Session = Depends(get_db)):
    vehicle = vehicle_service.retire_vehicle(db, vehicle_id)
    return APIResponse(message="Vehicle retired successfully", data=vehicle)
