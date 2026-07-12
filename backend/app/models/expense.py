from sqlalchemy import Column, Float, ForeignKey, Date, String
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import BaseModelMixin
from app.models.enums import ExpenseType, sql_enum


class Expense(Base, BaseModelMixin):
    __tablename__ = "expenses"

    vehicle_id = Column(String(36), ForeignKey("vehicles.id"), nullable=False)
    type = Column(sql_enum(ExpenseType), default=ExpenseType.OTHER, nullable=False)
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    description = Column(String, nullable=True)

    vehicle = relationship("Vehicle", back_populates="expenses")
