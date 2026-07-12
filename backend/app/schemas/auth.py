from pydantic import BaseModel, EmailStr, Field

from app.models.enums import UserRole
from app.schemas.base import ORMBase


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=100)
    role: UserRole


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(ORMBase):
    id: str
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
