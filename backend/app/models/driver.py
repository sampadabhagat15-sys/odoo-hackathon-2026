from sqlalchemy import Column, String, Float, Date
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import BaseModelMixin
from app.models.enums import DriverStatus, sql_enum


class Driver(Base, BaseModelMixin):
    __tablename__ = "drivers"

    name = Column(String, nullable=False)
    license_number = Column(String, unique=True, index=True, nullable=False)
    license_category = Column(String, nullable=False)
    license_expiry_date = Column(Date, nullable=False)
    contact_number = Column(String, nullable=False)
    safety_score = Column(Float, default=100.0, nullable=False)
    status = Column(
        sql_enum(DriverStatus), default=DriverStatus.AVAILABLE, nullable=False
    )

    trips = relationship("Trip", back_populates="driver")
