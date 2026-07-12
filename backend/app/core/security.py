"""
Password hashing (bcrypt, used directly — passlib's bcrypt backend
has known version-compat headaches, direct bcrypt is more reliable)
and JWT creation/verification.
"""

from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import settings


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )


def create_access_token(subject: str, role: str) -> str:
    """subject = user id (as string). role is embedded for RBAC checks
    without needing a DB hit on every request."""
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": subject, "role": role, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Raises jwt.PyJWTError on invalid/expired token — caught in deps.py."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
