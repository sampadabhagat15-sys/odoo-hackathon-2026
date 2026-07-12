"""
Shared cost calculations. Spec 3.7 requires "total operational cost
(Fuel + Maintenance) per vehicle" — kept here as its own module since
Module 5's Reports/Analytics will reuse this same math for Vehicle ROI.
"""

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.fuel_log import FuelLog
from app.models.maintenance import Maintenance


def total_fuel_cost(db: Session, vehicle_id: str) -> float:
    result = (
        db.query(func.coalesce(func.sum(FuelLog.cost), 0.0))
        .filter(FuelLog.vehicle_id == vehicle_id)
        .scalar()
    )
    return float(result)


def total_maintenance_cost(db: Session, vehicle_id: str) -> float:
    result = (
        db.query(func.coalesce(func.sum(Maintenance.cost), 0.0))
        .filter(Maintenance.vehicle_id == vehicle_id)
        .scalar()
    )
    return float(result)


def total_operational_cost(db: Session, vehicle_id: str) -> dict:
    fuel = total_fuel_cost(db, vehicle_id)
    maintenance = total_maintenance_cost(db, vehicle_id)
    return {
        "fuel_cost": fuel,
        "maintenance_cost": maintenance,
        "total_operational_cost": fuel + maintenance,
    }
