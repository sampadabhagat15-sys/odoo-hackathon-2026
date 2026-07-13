# TransitOps Backend

Smart Transport Operations Platform — Backend (FastAPI + PostgreSQL)

This folder is meant to sit inside the top-level project as `TransitOps/backend/`,
alongside `TransitOps/frontend/` (Avika's React app).

## Module status

- [x] **Module 1** — Project scaffold, DB models (all 7 entities), Auth + RBAC
- [x] **Module 2** — Vehicle + Driver CRUD
- [x] **Module 3** — Trip Management (create, dispatch, complete, cancel + business rules)
- [x] **Module 4** — Maintenance + Fuel & Expense tracking
- [x] **Module 5** — Dashboard KPIs + Reports/Analytics + CSV export

**All 5 backend modules complete.** Every mandatory deliverable from
section 7 of the spec is implemented except PDF export (spec marks
this optional; CSV export is done).

## Locked-in project conventions (do not change)

- **DB**: PostgreSQL only, never SQLite. Migrations via Alembic.
- **API base URL**: `http://localhost:8000/api/v1`
- **Response envelope** — every endpoint returns this exact shape:
  ```json
  {"success": true, "message": "", "data": {}}
  {"success": false, "message": "Driver license expired"}
  ```
  Enforced globally: routers return `APIResponse[...]`, and errors are
  auto-wrapped by the exception handlers in `main.py` — you never need
  to build the envelope by hand, just `raise HTTPException(...)` as usual.
- **IDs**: UUID everywhere, never integers.
- **Dates**: ISO format with `Z` suffix, e.g. `2026-07-12T14:30:00Z`.
  Use `ISODateTime` from `app/schemas/base.py` for any datetime field
  in a schema, not the raw `datetime` type.
- **Auth**: JWT, `Authorization: Bearer <token>` header.
- **Roles** (exactly these, lowercase snake_case as values):
  `admin`, `fleet_manager`, `dispatcher`, `safety_officer`, `financial_analyst`
- **Status enums** (exact strings, matches spec):
  - Vehicle: `Available`, `On Trip`, `In Shop`, `Retired`
  - Driver: `Available`, `On Trip`, `Off Duty`, `Suspended`
  - Trip: `Draft`, `Dispatched`, `Completed`, `Cancelled`

## Architecture

2-layer: **routers** (thin, HTTP + response envelope only) call
**services** (business logic + DB queries). No separate repository
layer — kept lean deliberately for the 8-hour time budget.

```
backend/
├── alembic/                # DB migrations
├── app/
│   ├── main.py               # wiring + global exception handlers
│   ├── core/
│   │   ├── config.py          # env-driven settings (Postgres URL, JWT secret)
│   │   ├── database.py        # SQLAlchemy engine/session
│   │   ├── security.py        # password hashing (bcrypt) + JWT
│   │   └── deps.py             # get_current_user, require_roles(...) for RBAC
│   ├── models/                 # SQLAlchemy models — one file per entity
│   │   ├── base.py              # shared id (UUID) / created_at / updated_at
│   │   └── enums.py              # all status + role enums, single source of truth
│   ├── schemas/
│   │   ├── base.py              # ORMBase + ISODateTime (Z-suffixed dates)
│   │   ├── envelope.py           # APIResponse[T] — the {success,message,data} wrapper
│   │   └── auth.py
│   ├── services/                 # business logic
│   └── routers/                   # thin HTTP layer
└── requirements.txt
```

## Setup

Requires a running PostgreSQL instance (local install, Docker, or a
free hosted one like Neon).

```bash
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # then edit DATABASE_URL to point at your Postgres
alembic upgrade head          # creates all tables
uvicorn app.main:app --reload
```

- Docs: http://localhost:8000/docs
- Health: http://localhost:8000/api/v1/health

### Quick local Postgres via Docker (if you don't have it installed)
```bash
docker run --name transitops-pg -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=transitops -p 5432:5432 -d postgres:16
```
Then `.env`'s default `DATABASE_URL` will work as-is.

## Auth flow (tested end-to-end against real Postgres)

```bash
# Register — role must be one of: admin, fleet_manager, dispatcher, safety_officer, financial_analyst
POST /api/v1/auth/register
{"email": "fm@transitops.com", "password": "password123", "full_name": "Fleet Manager", "role": "fleet_manager"}

# Login -> returns JWT inside data.access_token
POST /api/v1/auth/login
{"email": "fm@transitops.com", "password": "password123"}

# Use the token on protected routes
GET /api/v1/auth/me
Authorization: Bearer <token>
```

RBAC on future routes: `Depends(require_roles("fleet_manager"))` in the
router decorator — see `app/core/deps.py`.

## Adding a new migration (whenever a model changes)

```bash
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```

## Module 2 — Vehicle + Driver CRUD (tested end-to-end against Postgres)

**Vehicles** — `fleet_manager`/`admin` only for write operations:
- `POST /api/v1/vehicles` — create (unique registration_number enforced)
- `GET /api/v1/vehicles?type=&status_filter=&region=` — list with filters
- `GET /api/v1/vehicles/{id}` — get one
- `PUT /api/v1/vehicles/{id}` — partial update (status not editable here)
- `DELETE /api/v1/vehicles/{id}` — soft-delete, sets status to Retired
  (blocked if vehicle is On Trip)

**Drivers** — `fleet_manager`/`safety_officer`/`admin` for general CRUD;
suspend/reactivate restricted to `safety_officer`/`admin` only:
- `POST /api/v1/drivers` — create (unique license_number enforced)
- `GET /api/v1/drivers?status_filter=` — list with filter
- `GET /api/v1/drivers/{id}` — get one
- `PUT /api/v1/drivers/{id}` — partial update
- `POST /api/v1/drivers/{id}/suspend` — compliance action (blocked if On Trip)
- `POST /api/v1/drivers/{id}/reactivate` — only works if currently Suspended

Both entities: status is intentionally NOT editable via the generic
update endpoint — it's controlled by dedicated workflows (trip
dispatch/complete/cancel in Module 3, suspend/reactivate here) so state
transitions stay consistent with the spec's business rules instead of
being freely overwritable.

## Module 3 — Trip Management (tested end-to-end against Postgres)

`dispatcher`/`fleet_manager`/`admin` for all writes; GET endpoints open.

- `POST /api/v1/trips` — create (status: Draft). Validates vehicle is
  Available (not Retired/In Shop/On Trip), driver is Available (not
  Suspended/On Trip) and license not expired, and cargo_weight ≤
  vehicle's max_load_capacity. Vehicle/driver status is NOT changed yet.
- `GET /api/v1/trips?status_filter=&vehicle_id=&driver_id=` — list with filters
- `GET /api/v1/trips/{id}` — get one
- `POST /api/v1/trips/{id}/dispatch` — Draft → Dispatched. Re-validates
  vehicle/driver (in case something changed since Draft), then sets
  both to On Trip.
- `POST /api/v1/trips/{id}/complete` — Dispatched → Completed. Body:
  `{final_odometer, fuel_consumed}`. Computes `actual_distance` =
  final_odometer − vehicle's odometer at completion time, updates the
  vehicle's odometer, restores vehicle/driver to Available. Rejects a
  final_odometer less than the vehicle's current odometer.
- `POST /api/v1/trips/{id}/cancel` — Draft or Dispatched → Cancelled.
  Only restores vehicle/driver to Available if the trip had actually
  been dispatched (a cancelled Draft never touched their status).

Verified: cargo-over-capacity rejected (400), expired-license driver
rejected (400), double-booking an On-Trip vehicle/driver rejected
(400), wrong-role writes rejected (403), re-dispatching an already-
dispatched trip rejected (400), completing a non-dispatched trip
rejected (400), odometer regression rejected (400) — and the full
happy path (create → dispatch → complete) correctly updates the
vehicle's odometer and both statuses at each step.

## Post-hackathon addition — Expense review workflow

Added after the original 5 modules, once real frontend integration
surfaced that Expenses needed an approval workflow the spec didn't
originally call out. `Expense` now has:
- `type`: expanded to `Toll`, `Fine`, `Parking`, `Repair`, `Other`
  (was just Toll/Other)
- `status`: `Pending` (default) → `Approved` / `Rejected`
- `submitted_by`, `reviewed_by` (both FK to `users.id`), `reviewed_at`

New endpoints:
- `POST /api/v1/expenses/{id}/approve` / `POST /api/v1/expenses/{id}/reject`
  — restricted to `financial_analyst`/`fleet_manager`/`admin`, only
  works on a Pending expense (400 otherwise)
- `POST /api/v1/expenses` now requires auth (previously anonymous-body
  only) so `submitted_by` can be captured automatically from the JWT

Migrated via two Alembic revisions (Postgres enums need explicit
`ALTER TYPE ... ADD VALUE` for new enum values — autogenerate doesn't
detect Python enum changes on its own, so that part was hand-written).
Verified end-to-end: create → Pending → approve/reject → re-review
blocked (400) → wrong-role create/review blocked (403).

## Module 4 — Maintenance + Fuel & Expense (tested end-to-end against Postgres)

`fleet_manager`/`admin` for maintenance; `dispatcher`/`fleet_manager`/`admin`
for fuel logs & expenses; all GETs open.

- `POST /api/v1/maintenance` — create (status: Active). **Automatically
  sets the vehicle to In Shop**, removing it from dispatch selection.
  Blocked if vehicle is On Trip, Retired, or already has active
  maintenance.
- `GET /api/v1/maintenance?vehicle_id=&status_filter=` — list with filters
- `GET /api/v1/maintenance/{id}` — get one
- `POST /api/v1/maintenance/{id}/close` — restores vehicle to Available
  (unless it was separately marked Retired)
- `POST /api/v1/fuel-logs` / `GET /api/v1/fuel-logs?vehicle_id=&trip_id=`
- `POST /api/v1/expenses` / `GET /api/v1/expenses?vehicle_id=`
- `GET /api/v1/vehicles/{id}/operational-cost` — Fuel + Maintenance cost
  per spec 3.7 (Expenses/tolls tracked separately, not included — spec
  literally says "Fuel + Maintenance")

Verified: starting maintenance flips vehicle to In Shop and blocks
dispatch of that vehicle; a second maintenance record on an already-
In-Shop vehicle is rejected; closing restores Available; operational
cost correctly sums fuel + maintenance.

## Module 5 — Dashboard KPIs + Reports/Analytics + CSV export (tested)

All GET, no RBAC restriction (matches the open-read pattern used
everywhere else in this backend).

- `GET /api/v1/dashboard/kpis?type=&region=` — Active Vehicles, Available
  Vehicles, Vehicles in Maintenance, Active Trips, Pending Trips,
  Drivers On Duty, Fleet Utilization %. **Naming ambiguities in the
  spec, resolved as documented in `dashboard_service.py`:**
  "Active Vehicles" = non-Retired; "Drivers On Duty" = Available + On
  Trip; "Fleet Utilization %" = On-Trip vehicles ÷ active vehicles.
  Adjust these if judges/organizers clarify a different definition.
- `GET /api/v1/reports/fuel-efficiency/{vehicle_id}` — Distance/Fuel
  across all Completed trips
- `GET /api/v1/reports/vehicle-roi/{vehicle_id}?revenue=<amount>` —
  **Revenue must be passed as a query param.** The spec's ROI formula
  needs a Revenue figure, but there's no Revenue entity/field anywhere
  in the spec's data model (Users, Vehicles, Drivers, Trips,
  Maintenance, FuelLog, Expense — no Revenue). Worth raising with your
  team: if trips are meant to generate revenue, that likely needs a
  field on Trip (e.g. rate per km). Until then this takes it as input.
- `GET /api/v1/reports/fleet` — per-vehicle report as JSON (efficiency +
  cost for every vehicle)
- `GET /api/v1/reports/fleet/csv` — same data, downloadable CSV. **This
  one endpoint does NOT use the `{success,message,data}` envelope** —
  it returns a raw CSV file, which is the one documented exception
  since file downloads and JSON envelopes aren't compatible.

Verified against real data: KPIs correctly count by status, fuel
efficiency correctly computed from a real completed trip (350km/40L =
8.75 km/L), ROI math verified, CSV export produces a real downloadable
file with computed columns matching the JSON report exactly.
