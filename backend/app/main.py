"""
TransitOps — Smart Transport Operations Platform
Backend entrypoint. Wiring only — no business logic here.
"""

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import Base, engine
from app import models  # noqa: F401 — registers all models on Base.metadata
from app.routers import auth, vehicles, drivers

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for TransitOps — digitizing vehicle, driver, "
    "dispatch, maintenance, and expense management.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Global exception handlers — every error response must match
# {"success": false, "message": "..."}, never FastAPI's raw default shape.
# ---------------------------------------------------------------------------
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "message": str(exc.detail)},
        headers=getattr(exc, "headers", None) or {},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Collapse Pydantic's error list into one readable message string,
    # while the envelope stays consistent for the frontend either way.
    first_error = exc.errors()[0]
    field = " -> ".join(str(loc) for loc in first_error["loc"])
    message = f"{field}: {first_error['msg']}"
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"success": False, "message": message},
    )


app.include_router(
    auth.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["Authentication"]
)
app.include_router(
    vehicles.router, prefix=f"{settings.API_V1_PREFIX}/vehicles", tags=["Vehicles"]
)
app.include_router(
    drivers.router, prefix=f"{settings.API_V1_PREFIX}/drivers", tags=["Drivers"]
)


@app.get("/", tags=["Health"])
def root():
    return {"success": True, "message": f"{settings.PROJECT_NAME} API is running", "data": None}


@app.get(f"{settings.API_V1_PREFIX}/health", tags=["Health"])
def health_check():
    return {"success": True, "message": "", "data": {"status": "ok"}}
