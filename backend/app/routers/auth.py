from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, UserOut, Token
from app.schemas.envelope import APIResponse
from app.services import auth_service

router = APIRouter()


@router.post(
    "/register",
    response_model=APIResponse[UserOut],
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Creates a new user account with a given role. "
    "Role determines what the user can do (RBAC enforced on other endpoints).",
)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    user = auth_service.register_user(db, payload)
    return APIResponse(message="User registered successfully", data=user)


@router.post(
    "/login",
    response_model=APIResponse[Token],
    summary="Login with email and password",
    description="Returns a JWT access token valid for the configured "
    "expiry window. Include it as `Authorization: Bearer <token>` on "
    "subsequent requests.",
)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = auth_service.authenticate_user(db, payload.email, payload.password)
    token_data = auth_service.build_token_response(user)
    return APIResponse(message="Login successful", data=token_data)


@router.get(
    "/me",
    response_model=APIResponse[UserOut],
    summary="Get the currently authenticated user",
)
def get_me(current_user: User = Depends(get_current_user)):
    return APIResponse(data=current_user)
