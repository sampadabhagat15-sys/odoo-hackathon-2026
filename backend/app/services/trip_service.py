"""
Trip business logic — this is where every "Mandatory Business Rule"
from the spec is enforced. Routers stay thin; all of this stays here.
"""

from datetime import date, datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.driver import Driver
from app.models.enums import DriverStatus, TripStatus, VehicleStatus
from app.models.trip import Trip
from app.models.vehicle import Vehicle
from app.schemas.trip import TripComplete, TripCreate


def _now():
    return datetime.now(timezone.utc)


def _assert_vehicle_dispatchable(vehicle: Vehicle) -> None:
    """Retired or In Shop vehicles must never appear in dispatch
    selection; a vehicle already On Trip can't be assigned again."""
    if vehicle.status != VehicleStatus.AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle '{vehicle.registration_number}' is not available "
            f"(current status: {vehicle.status.value})",
        )


def _assert_driver_dispatchable(driver: Driver) -> None:
    """Drivers with expired licenses or Suspended status cannot be
    assigned; a driver already On Trip can't be assigned again."""
    if driver.status != DriverStatus.AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Driver '{driver.name}' is not available "
            f"(current status: {driver.status.value})",
        )
    if driver.license_expiry_date < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Driver '{driver.name}' has an expired license "
            f"(expired {driver.license_expiry_date.isoformat()})",
        )


def _get_vehicle_or_404(db: Session, vehicle_id: str) -> Vehicle:
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle


def _get_driver_or_404(db: Session, driver_id: str) -> Driver:
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver


def get_trip_or_404(db: Session, trip_id: str) -> Trip:
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


def create_trip(db: Session, payload: TripCreate) -> Trip:
    vehicle = _get_vehicle_or_404(db, payload.vehicle_id)
    driver = _get_driver_or_404(db, payload.driver_id)

    _assert_vehicle_dispatchable(vehicle)
    _assert_driver_dispatchable(driver)

    if payload.cargo_weight > vehicle.max_load_capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cargo weight ({payload.cargo_weight} kg) exceeds vehicle "
            f"'{vehicle.registration_number}' max load capacity "
            f"({vehicle.max_load_capacity} kg)",
        )

    trip = Trip(
        source=payload.source,
        destination=payload.destination,
        vehicle_id=payload.vehicle_id,
        driver_id=payload.driver_id,
        cargo_weight=payload.cargo_weight,
        planned_distance=payload.planned_distance,
        status=TripStatus.DRAFT,
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


def list_trips(
    db: Session,
    status_filter: Optional[TripStatus] = None,
    vehicle_id: Optional[str] = None,
    driver_id: Optional[str] = None,
) -> list[Trip]:
    query = db.query(Trip)
    if status_filter:
        query = query.filter(Trip.status == status_filter)
    if vehicle_id:
        query = query.filter(Trip.vehicle_id == vehicle_id)
    if driver_id:
        query = query.filter(Trip.driver_id == driver_id)
    return query.order_by(Trip.created_at.desc()).all()


def dispatch_trip(db: Session, trip_id: str) -> Trip:
    trip = get_trip_or_404(db, trip_id)
    if trip.status != TripStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only Draft trips can be dispatched (current status: "
            f"{trip.status.value})",
        )

    vehicle = _get_vehicle_or_404(db, trip.vehicle_id)
    driver = _get_driver_or_404(db, trip.driver_id)

    # Re-validate — time may have passed since the trip was created as
    # Draft, and the vehicle/driver could have been assigned elsewhere
    # or gone out of compliance in the meantime.
    _assert_vehicle_dispatchable(vehicle)
    _assert_driver_dispatchable(driver)

    trip.status = TripStatus.DISPATCHED
    trip.dispatched_at = _now()
    vehicle.status = VehicleStatus.ON_TRIP
    driver.status = DriverStatus.ON_TRIP

    db.commit()
    db.refresh(trip)
    return trip


def complete_trip(db: Session, trip_id: str, payload: TripComplete) -> Trip:
    trip = get_trip_or_404(db, trip_id)
    if trip.status != TripStatus.DISPATCHED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only Dispatched trips can be completed (current status: "
            f"{trip.status.value})",
        )

    vehicle = _get_vehicle_or_404(db, trip.vehicle_id)
    driver = _get_driver_or_404(db, trip.driver_id)

    if payload.final_odometer < vehicle.odometer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Final odometer ({payload.final_odometer}) cannot be less "
            f"than the vehicle's current odometer ({vehicle.odometer})",
        )

    trip.actual_distance = payload.final_odometer - vehicle.odometer
    trip.fuel_consumed = payload.fuel_consumed
    trip.status = TripStatus.COMPLETED
    trip.completed_at = _now()

    vehicle.odometer = payload.final_odometer
    vehicle.status = VehicleStatus.AVAILABLE
    driver.status = DriverStatus.AVAILABLE

    db.commit()
    db.refresh(trip)
    return trip


def cancel_trip(db: Session, trip_id: str) -> Trip:
    trip = get_trip_or_404(db, trip_id)
    if trip.status not in (TripStatus.DRAFT, TripStatus.DISPATCHED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only Draft or Dispatched trips can be cancelled (current "
            f"status: {trip.status.value})",
        )

    # Only restore vehicle/driver if this trip had actually put them
    # On Trip — a Draft trip never changed their status in the first place.
    if trip.status == TripStatus.DISPATCHED:
        vehicle = _get_vehicle_or_404(db, trip.vehicle_id)
        driver = _get_driver_or_404(db, trip.driver_id)
        vehicle.status = VehicleStatus.AVAILABLE
        driver.status = DriverStatus.AVAILABLE

    trip.status = TripStatus.CANCELLED
    trip.cancelled_at = _now()

    db.commit()
    db.refresh(trip)
    return trip
