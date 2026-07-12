from sqlalchemy import Column, String, Float
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import BaseModelMixin
from app.models.enums import VehicleStatus, sql_enum


class Vehicle(Base, BaseModelMixin):
    __tablename__ = "vehicles"

    registration_number = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)  # Vehicle Name/Model
    type = Column(String, nullable=False)  # e.g. Truck, Van, Bike
    max_load_capacity = Column(Float, nullable=False)  # kg
    odometer = Column(Float, default=0.0, nullable=False)
    acquisition_cost = Column(Float, nullable=False)
    region = Column(String, nullable=True, index=True)  # used by dashboard filters
    status = Column(
        sql_enum(VehicleStatus), default=VehicleStatus.AVAILABLE, nullable=False
    )

    trips = relationship("Trip", back_populates="vehicle")
    maintenance_logs = relationship("Maintenance", back_populates="vehicle")
    fuel_logs = relationship("FuelLog", back_populates="vehicle")
    expenses = relationship("Expense", back_populates="vehicle")
