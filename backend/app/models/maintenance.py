from sqlalchemy import Column, String, Float, ForeignKey, Date
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import BaseModelMixin
from app.models.enums import MaintenanceStatus, sql_enum


class Maintenance(Base, BaseModelMixin):
    __tablename__ = "maintenance_logs"

    vehicle_id = Column(String(36), ForeignKey("vehicles.id"), nullable=False)
    description = Column(String, nullable=False)  # e.g. "Oil Change"
    cost = Column(Float, default=0.0, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)  # set when closed
    status = Column(
        sql_enum(MaintenanceStatus), default=MaintenanceStatus.ACTIVE, nullable=False
    )

    vehicle = relationship("Vehicle", back_populates="maintenance_logs")
