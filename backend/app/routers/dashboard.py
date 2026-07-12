from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.envelope import APIResponse
from app.services import dashboard_service

router = APIRouter()


@router.get(
    "/kpis",
    response_model=APIResponse[dict],
    summary="Dashboard KPIs",
    description="Active Vehicles, Available Vehicles, Vehicles in "
    "Maintenance, Active Trips, Pending Trips, Drivers On Duty, Fleet "
    "Utilization %. Optional type/region filters apply to the "
    "vehicle-derived metrics.",
)
def get_kpis(
    type: Optional[str] = None,
    region: Optional[str] = None,
    db: Session = Depends(get_db),
):
    data = dashboard_service.get_kpis(db, type, region)
    return APIResponse(data=data)
