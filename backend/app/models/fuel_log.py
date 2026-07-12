from sqlalchemy import Column, Float, ForeignKey, Date, String
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import BaseModelMixin


class FuelLog(Base, BaseModelMixin):
    __tablename__ = "fuel_logs"

    vehicle_id = Column(String(36), ForeignKey("vehicles.id"), nullable=False)
    trip_id = Column(String(36), ForeignKey("trips.id"), nullable=True)
    liters = Column(Float, nullable=False)
    cost = Column(Float, nullable=False)
    date = Column(Date, nullable=False)

    vehicle = relationship("Vehicle", back_populates="fuel_logs")
    trip = relationship("Trip", back_populates="fuel_logs")
