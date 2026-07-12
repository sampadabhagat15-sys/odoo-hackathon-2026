"""
Driver business logic. Kept out of the router per architecture.
"""

from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.driver import Driver
from app.models.enums import DriverStatus
from app.schemas.driver import DriverCreate, DriverUpdate


def create_driver(db: Session, payload: DriverCreate) -> Driver:
    existing = (
        db.query(Driver)
        .filter(Driver.license_number == payload.license_number)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A driver with license number "
            f"'{payload.license_number}' already exists",
        )

    driver = Driver(**payload.model_dump(), status=DriverStatus.AVAILABLE)
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return driver


def list_drivers(
    db: Session, status_filter: Optional[DriverStatus] = None
) -> list[Driver]:
    query = db.query(Driver)
    if status_filter:
        query = query.filter(Driver.status == status_filter)
    return query.order_by(Driver.created_at.desc()).all()


def get_driver_or_404(db: Session, driver_id: str) -> Driver:
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver


def update_driver(db: Session, driver_id: str, payload: DriverUpdate) -> Driver:
    driver = get_driver_or_404(db, driver_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(driver, field, value)
    db.commit()
    db.refresh(driver)
    return driver


def suspend_driver(db: Session, driver_id: str) -> Driver:
    driver = get_driver_or_404(db, driver_id)
    if driver.status == DriverStatus.ON_TRIP:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot suspend a driver who is currently on a trip",
        )
    driver.status = DriverStatus.SUSPENDED
    db.commit()
    db.refresh(driver)
    return driver


def reactivate_driver(db: Session, driver_id: str) -> Driver:
    driver = get_driver_or_404(db, driver_id)
    if driver.status != DriverStatus.SUSPENDED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only a suspended driver can be reactivated",
        )
    driver.status = DriverStatus.AVAILABLE
    db.commit()
    db.refresh(driver)
    return driver
