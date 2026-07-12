"""
Vehicle business logic. Kept out of the router per architecture.
"""

from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.enums import VehicleStatus
from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleUpdate


def create_vehicle(db: Session, payload: VehicleCreate) -> Vehicle:
    existing = (
        db.query(Vehicle)
        .filter(Vehicle.registration_number == payload.registration_number)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A vehicle with registration number "
            f"'{payload.registration_number}' already exists",
        )

    vehicle = Vehicle(**payload.model_dump(), status=VehicleStatus.AVAILABLE)
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


def list_vehicles(
    db: Session,
    type: Optional[str] = None,
    status_filter: Optional[VehicleStatus] = None,
    region: Optional[str] = None,
) -> list[Vehicle]:
    query = db.query(Vehicle)
    if type:
        query = query.filter(Vehicle.type == type)
    if status_filter:
        query = query.filter(Vehicle.status == status_filter)
    if region:
        query = query.filter(Vehicle.region == region)
    return query.order_by(Vehicle.created_at.desc()).all()


def get_vehicle_or_404(db: Session, vehicle_id: str) -> Vehicle:
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle


def update_vehicle(db: Session, vehicle_id: str, payload: VehicleUpdate) -> Vehicle:
    vehicle = get_vehicle_or_404(db, vehicle_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(vehicle, field, value)
    db.commit()
    db.refresh(vehicle)
    return vehicle


def retire_vehicle(db: Session, vehicle_id: str) -> Vehicle:
    """DELETE on a vehicle doesn't remove the row — vehicles are
    referenced by Trips/Maintenance/FuelLog/Expense history, and the
    spec has a Retired status specifically for this. Hard-deleting
    would either orphan that history or cascade-destroy it, both bad
    for an ERP-style audit trail."""
    vehicle = get_vehicle_or_404(db, vehicle_id)
    if vehicle.status == VehicleStatus.ON_TRIP:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot retire a vehicle that is currently on a trip",
        )
    vehicle.status = VehicleStatus.RETIRED
    db.commit()
    db.refresh(vehicle)
    return vehicle
