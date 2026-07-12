from typing import Optional

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.enums import TripStatus
from app.schemas.envelope import APIResponse
from app.schemas.trip import TripComplete, TripCreate, TripOut
from app.services import trip_service

router = APIRouter()

# Dispatcher owns trip creation/dispatch per the spec ("creates trips,
# assigns vehicles and drivers, monitors active deliveries");
# Fleet Manager and Admin also need full access for oversight.
MANAGE_TRIPS = require_roles("dispatcher", "fleet_manager", "admin")


@router.post(
    "",
    response_model=APIResponse[TripOut],
    status_code=status.HTTP_201_CREATED,
    summary="Create a trip (Draft)",
    description="Validates vehicle/driver availability, license expiry, "
    "and cargo weight vs. max load capacity. Trip starts as Draft — "
    "vehicle and driver status are NOT changed until dispatch.",
    dependencies=[Depends(MANAGE_TRIPS)],
)
def create_trip(payload: TripCreate, db: Session = Depends(get_db)):
    trip = trip_service.create_trip(db, payload)
    return APIResponse(message="Trip created as Draft", data=trip)


@router.get(
    "",
    response_model=APIResponse[list[TripOut]],
    summary="List trips",
    description="Supports filtering by status, vehicle_id, driver_id.",
)
def list_trips(
    status_filter: Optional[TripStatus] = None,
    vehicle_id: Optional[str] = None,
    driver_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    trips = trip_service.list_trips(db, status_filter, vehicle_id, driver_id)
    return APIResponse(data=trips)


@router.get(
    "/{trip_id}",
    response_model=APIResponse[TripOut],
    summary="Get a trip by id",
)
def get_trip(trip_id: str, db: Session = Depends(get_db)):
    trip = trip_service.get_trip_or_404(db, trip_id)
    return APIResponse(data=trip)


@router.post(
    "/{trip_id}/dispatch",
    response_model=APIResponse[TripOut],
    summary="Dispatch a trip",
    description="Draft -> Dispatched. Re-validates vehicle/driver "
    "availability, then sets both to On Trip.",
    dependencies=[Depends(MANAGE_TRIPS)],
)
def dispatch_trip(trip_id: str, db: Session = Depends(get_db)):
    trip = trip_service.dispatch_trip(db, trip_id)
    return APIResponse(message="Trip dispatched", data=trip)


@router.post(
    "/{trip_id}/complete",
    response_model=APIResponse[TripOut],
    summary="Complete a trip",
    description="Dispatched -> Completed. Requires final odometer and fuel "
    "consumed; computes actual distance, updates the vehicle's odometer, "
    "and restores vehicle/driver to Available.",
    dependencies=[Depends(MANAGE_TRIPS)],
)
def complete_trip(trip_id: str, payload: TripComplete, db: Session = Depends(get_db)):
    trip = trip_service.complete_trip(db, trip_id, payload)
    return APIResponse(message="Trip completed", data=trip)


@router.post(
    "/{trip_id}/cancel",
    response_model=APIResponse[TripOut],
    summary="Cancel a trip",
    description="Draft or Dispatched -> Cancelled. If the trip had been "
    "dispatched, restores vehicle/driver to Available.",
    dependencies=[Depends(MANAGE_TRIPS)],
)
def cancel_trip(trip_id: str, db: Session = Depends(get_db)):
    trip = trip_service.cancel_trip(db, trip_id)
    return APIResponse(message="Trip cancelled", data=trip)
