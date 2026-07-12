"""
Reports & Analytics per spec 3.8.

NOTE on Vehicle ROI: the formula is (Revenue - (Maintenance + Fuel)) /
Acquisition Cost, but "Revenue" has no home anywhere in the spec's
"Expected Database Entities" list (Users, Vehicles, Drivers, Trips,
Maintenance Logs, Fuel Logs, Expenses) — there's no Revenue table or
field to read from. Rather than invent a number, this accepts revenue
as an input parameter for now. Worth raising with your team/organizers:
if trips are meant to generate revenue (e.g. a rate per km or per
delivery), that needs its own field somewhere — most naturally on Trip.
"""

from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.enums import TripStatus
from app.models.trip import Trip
from app.models.vehicle import Vehicle
from app.services import cost_service


def _get_vehicle_or_404(db: Session, vehicle_id: str) -> Vehicle:
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle


def fuel_efficiency(db: Session, vehicle_id: str) -> dict:
    """Distance / Fuel across all Completed trips for this vehicle."""
    _get_vehicle_or_404(db, vehicle_id)

    result = (
        db.query(
            func.coalesce(func.sum(Trip.actual_distance), 0.0),
            func.coalesce(func.sum(Trip.fuel_consumed), 0.0),
        )
        .filter(Trip.vehicle_id == vehicle_id, Trip.status == TripStatus.COMPLETED)
        .first()
    )
    total_distance, total_fuel = float(result[0]), float(result[1])
    km_per_liter = round(total_distance / total_fuel, 2) if total_fuel > 0 else None

    return {
        "vehicle_id": vehicle_id,
        "total_distance_km": total_distance,
        "total_fuel_liters": total_fuel,
        "fuel_efficiency_km_per_liter": km_per_liter,
    }


def vehicle_roi(db: Session, vehicle_id: str, revenue: float) -> dict:
    vehicle = _get_vehicle_or_404(db, vehicle_id)
    costs = cost_service.total_operational_cost(db, vehicle_id)

    if vehicle.acquisition_cost <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle acquisition cost must be greater than 0 to compute ROI",
        )

    roi = (revenue - costs["total_operational_cost"]) / vehicle.acquisition_cost

    return {
        "vehicle_id": vehicle_id,
        "revenue": revenue,
        "fuel_cost": costs["fuel_cost"],
        "maintenance_cost": costs["maintenance_cost"],
        "acquisition_cost": vehicle.acquisition_cost,
        "roi": round(roi, 4),
    }


def fleet_report_rows(db: Session) -> list[dict]:
    """One row per vehicle — used for both the JSON report list and the
    CSV export, so the two never drift out of sync with each other."""
    vehicles = db.query(Vehicle).order_by(Vehicle.registration_number).all()
    rows = []
    for v in vehicles:
        eff = fuel_efficiency(db, v.id)
        costs = cost_service.total_operational_cost(db, v.id)
        rows.append(
            {
                "vehicle_id": v.id,
                "registration_number": v.registration_number,
                "name": v.name,
                "type": v.type,
                "region": v.region or "",
                "status": v.status.value,
                "odometer": v.odometer,
                "fuel_efficiency_km_per_liter": eff["fuel_efficiency_km_per_liter"],
                "fuel_cost": costs["fuel_cost"],
                "maintenance_cost": costs["maintenance_cost"],
                "total_operational_cost": costs["total_operational_cost"],
            }
        )
    return rows
