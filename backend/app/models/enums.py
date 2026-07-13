"""
Enums — kept in one file since they're referenced across multiple
models and routers. Values match the spec exactly.
"""

import enum

from sqlalchemy import Enum as SqlAlchemyEnum


def sql_enum(enum_cls):
    """SQLAlchemy's Enum type stores the member NAME by default, but
    our enum values contain spaces (e.g. "On Trip") and don't match
    the names (e.g. ON_TRIP). This forces it to store/compare on
    .value instead, so the DB and API both speak the same string."""
    return SqlAlchemyEnum(
        enum_cls,
        values_callable=lambda e: [member.value for member in e],
    )


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    FLEET_MANAGER = "fleet_manager"
    DISPATCHER = "dispatcher"
    SAFETY_OFFICER = "safety_officer"
    FINANCIAL_ANALYST = "financial_analyst"


class VehicleStatus(str, enum.Enum):
    AVAILABLE = "Available"
    ON_TRIP = "On Trip"
    IN_SHOP = "In Shop"
    RETIRED = "Retired"


class DriverStatus(str, enum.Enum):
    AVAILABLE = "Available"
    ON_TRIP = "On Trip"
    OFF_DUTY = "Off Duty"
    SUSPENDED = "Suspended"


class TripStatus(str, enum.Enum):
    DRAFT = "Draft"
    DISPATCHED = "Dispatched"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


class MaintenanceStatus(str, enum.Enum):
    ACTIVE = "Active"
    CLOSED = "Closed"


class ExpenseType(str, enum.Enum):
    TOLL = "Toll"
    FINE = "Fine"
    PARKING = "Parking"
    REPAIR = "Repair"
    OTHER = "Other"


class ExpenseStatus(str, enum.Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"
