from sqlalchemy import Column, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import BaseModelMixin
from app.models.enums import TripStatus, sql_enum


class Trip(Base, BaseModelMixin):
    __tablename__ = "trips"

    source = Column(String, nullable=False)
    destination = Column(String, nullable=False)

    vehicle_id = Column(String(36), ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(String(36), ForeignKey("drivers.id"), nullable=False)

    cargo_weight = Column(Float, nullable=False)  # kg
    planned_distance = Column(Float, nullable=False)  # km

    # Filled in when the trip is completed
    actual_distance = Column(Float, nullable=True)
    fuel_consumed = Column(Float, nullable=True)  # liters, used for fuel efficiency

    status = Column(sql_enum(TripStatus), default=TripStatus.DRAFT, nullable=False)

    dispatched_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)

    vehicle = relationship("Vehicle", back_populates="trips")
    driver = relationship("Driver", back_populates="trips")
    fuel_logs = relationship("FuelLog", back_populates="trip")
