# TransitOps Backend

Smart Transport Operations Platform — Backend (FastAPI + PostgreSQL)

This folder is meant to sit inside the top-level project as `TransitOps/backend/`,
alongside `TransitOps/frontend/` (Avika's React app).

## Module status

- [x] **Module 1** — Project scaffold, DB models (all 7 entities), Auth + RBAC
- [ ] Module 2 — Vehicle + Driver CRUD
- [ ] Module 3 — Trip Management (create, dispatch, complete, cancel + business rules)
- [ ] Module 4 — Maintenance + Fuel & Expense tracking
- [ ] Module 5 — Dashboard KPIs + Reports/Analytics + CSV export

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
