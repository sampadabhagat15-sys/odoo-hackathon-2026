from sqlalchemy import Column, String, Boolean

from app.core.database import Base
from app.models.base import BaseModelMixin
from app.models.enums import UserRole, sql_enum


class User(Base, BaseModelMixin):
    __tablename__ = "users"

    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(sql_enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
