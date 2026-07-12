"""
Maintenance business logic. Key rule from spec: creating an active
maintenance record automatically flips the vehicle to In Shop
(removing it from dispatch selection); closing it restores the
vehicle to Available — unless the vehicle was separately Retired.
"""

from datetime import date as date_type
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.enums import MaintenanceStatus, VehicleStatus
from app.models.maintenance import Maintenance
from app.models.vehicle import Vehicle
from app.schemas.maintenance import MaintenanceCreate


def _get_vehicle_or_404(db: Session, vehicle_id: str) -> Vehicle:
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle


def create_maintenance(db: Session, payload: MaintenanceCreate) -> Maintenance:
    vehicle = _get_vehicle_or_404(db, payload.vehicle_id)

    if vehicle.status == VehicleStatus.ON_TRIP:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot start maintenance — vehicle "
            f"'{vehicle.registration_number}' is currently On Trip",
        )
    if vehicle.status == VehicleStatus.RETIRED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot start maintenance — vehicle "
            f"'{vehicle.registration_number}' is Retired",
        )
    if vehicle.status == VehicleStatus.IN_SHOP:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle '{vehicle.registration_number}' already has "
            f"active maintenance in progress",
        )

    record = Maintenance(
        vehicle_id=payload.vehicle_id,
        description=payload.description,
        cost=payload.cost,
        start_date=payload.start_date,
        status=MaintenanceStatus.ACTIVE,
    )
    # This is the automatic transition the spec requires: adding a
    # vehicle to a maintenance log switches it to In Shop, removing it
    # from the driver/dispatch selection pool.
    vehicle.status = VehicleStatus.IN_SHOP

    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def list_maintenance(
    db: Session,
    vehicle_id: Optional[str] = None,
    status_filter: Optional[MaintenanceStatus] = None,
) -> list[Maintenance]:
    query = db.query(Maintenance)
    if vehicle_id:
        query = query.filter(Maintenance.vehicle_id == vehicle_id)
    if status_filter:
        query = query.filter(Maintenance.status == status_filter)
    return query.order_by(Maintenance.created_at.desc()).all()


def get_maintenance_or_404(db: Session, maintenance_id: str) -> Maintenance:
    record = db.query(Maintenance).filter(Maintenance.id == maintenance_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    return record


def close_maintenance(db: Session, maintenance_id: str) -> Maintenance:
    record = get_maintenance_or_404(db, maintenance_id)
    if record.status != MaintenanceStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Active maintenance records can be closed",
        )

    vehicle = _get_vehicle_or_404(db, record.vehicle_id)

    record.status = MaintenanceStatus.CLOSED
    record.end_date = date_type.today()

    # "Closing maintenance restores the vehicle to Available (unless
    # retired)" — a vehicle can only have been separately marked
    # Retired while In Shop via a path outside this record, so this
    # guard is what keeps that state from being silently overwritten.
    if vehicle.status != VehicleStatus.RETIRED:
        vehicle.status = VehicleStatus.AVAILABLE

    db.commit()
    db.refresh(record)
    return record
