from sqlalchemy import Column, Float, ForeignKey, Date, String, DateTime
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import BaseModelMixin
from app.models.enums import ExpenseType, ExpenseStatus, sql_enum


class Expense(Base, BaseModelMixin):
    __tablename__ = "expenses"

    vehicle_id = Column(String(36), ForeignKey("vehicles.id"), nullable=False)
    type = Column(sql_enum(ExpenseType), default=ExpenseType.OTHER, nullable=False)
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    description = Column(String, nullable=True)

    # Review workflow: every expense starts Pending. Financial
    # Analyst/Fleet Manager/Admin approve or reject it via dedicated
    # endpoints (see routers/fuel_expense.py), same pattern as driver
    # suspend/reactivate — not a generic status-update field.
    status = Column(sql_enum(ExpenseStatus), default=ExpenseStatus.PENDING, nullable=False)
    submitted_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    reviewed_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    vehicle = relationship("Vehicle", back_populates="expenses")
