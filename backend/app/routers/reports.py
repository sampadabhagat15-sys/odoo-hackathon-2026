import csv
import io

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.envelope import APIResponse
from app.services import report_service

router = APIRouter()


@router.get(
    "/fuel-efficiency/{vehicle_id}",
    response_model=APIResponse[dict],
    summary="Fuel efficiency for a vehicle",
    description="Distance / Fuel across all Completed trips for this vehicle.",
)
def get_fuel_efficiency(vehicle_id: str, db: Session = Depends(get_db)):
    data = report_service.fuel_efficiency(db, vehicle_id)
    return APIResponse(data=data)


@router.get(
    "/vehicle-roi/{vehicle_id}",
    response_model=APIResponse[dict],
    summary="ROI for a vehicle",
    description="(Revenue - (Maintenance + Fuel)) / Acquisition Cost. "
    "Revenue must be supplied as a query param — see the note in "
    "report_service.py about why this isn't derived automatically.",
)
def get_vehicle_roi(vehicle_id: str, revenue: float, db: Session = Depends(get_db)):
    data = report_service.vehicle_roi(db, vehicle_id, revenue)
    return APIResponse(data=data)


@router.get(
    "/fleet",
    response_model=APIResponse[list[dict]],
    summary="Fleet report (all vehicles)",
    description="Per-vehicle fuel efficiency and operational cost. Same "
    "data as the CSV export below, as JSON.",
)
def get_fleet_report(db: Session = Depends(get_db)):
    rows = report_service.fleet_report_rows(db)
    return APIResponse(data=rows)


@router.get(
    "/fleet/csv",
    summary="Fleet report as CSV",
    description="Same data as GET /reports/fleet, downloadable as CSV. "
    "NOTE: this endpoint returns a raw CSV file, not the standard "
    "{success,message,data} JSON envelope — file downloads are the one "
    "documented exception to that rule.",
)
def get_fleet_report_csv(db: Session = Depends(get_db)):
    rows = report_service.fleet_report_rows(db)

    buffer = io.StringIO()
    if rows:
        writer = csv.DictWriter(buffer, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    return Response(
        content=buffer.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=fleet_report.csv"},
    )
