# TransitOps

Smart Transport Operations Platform — built for Odoo Hackathon 2026.
TransitOps digitizes vehicle, driver, dispatch, maintenance, and
expense management for a transport fleet.

- **Backend** — FastAPI + PostgreSQL, in `backend/`. Built by Sampada.
  All 5 planned modules are complete and tested end-to-end against
  real PostgreSQL: Auth+RBAC, Vehicle+Driver CRUD, Trip Management
  (dispatch/complete/cancel), Maintenance+Fuel+Expenses, and
  Dashboard+Reports+CSV export.
- **Frontend** — React + Vite, in this same top-level folder (`src/`,
  `package.json`, etc. — currently not in a separate `frontend/`
  subfolder). Built by Avika.

To run the whole thing, start the backend first (below), then the
frontend (further down, from Avika).

---

## Backend setup

### 1. What you need installed

- **Python 3.11+** — check with `python3 --version`
- **PostgreSQL** — installed locally, or via Docker
- **VS Code** — [code.visualstudio.com](https://code.visualstudio.com)

### 2. Install and run

```bash
cd backend
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Make sure PostgreSQL is running, then create the database tables:
```bash
alembic upgrade head
```

Start the server:
```bash
uvicorn app.main:app --reload
```

- API docs (Swagger): http://localhost:8000/docs
- Health check: http://localhost:8000/api/v1/health

Full endpoint list and business rules are documented in
`backend/README.md`.

### 3. Creating a login for the frontend to use

There's no seed data yet — register an account via Swagger
(`POST /api/v1/auth/register` at http://localhost:8000/docs) with one
of these roles: `admin`, `fleet_manager`, `dispatcher`,
`safety_officer`, `financial_analyst`.

### Backend troubleshooting

- **"psycopg2-binary failed to build" during `pip install`** — known
  Apple Silicon issue. Switch to the `psycopg` v3 driver — see
  `backend/README.md` for the exact fix.
- **Database connection error on startup** — confirm PostgreSQL is
  actually running and `DATABASE_URL` in `backend/.env` matches your
  setup.

---

## Frontend setup

*(Written by Avika — kept as-is.)*

This is the frontend (the part people see and click on) for TransitOps, a
platform for managing vehicles, drivers, trips, and maintenance. It's built
with React.

There's no real backend yet, so the app currently runs on **sample data**
that looks like what the real thing will return. Once the backend is ready,
only the files inside `src/services` need to change — nothing else.

*(Update: the backend now exists and is fully built — see the Backend
section above. Each file in `src/services` gets switched over from
mock to live one at a time, flipping `USE_MOCKS` to `false`.)*

### 1. What you need installed

- **Node.js** (version 18 or newer). Check by opening a terminal and typing:
  ```bash
  node -v
  ```
  If that doesn't work, download it from [nodejs.org](https://nodejs.org).
- **VS Code** — [code.visualstudio.com](https://code.visualstudio.com)

### 2. Install and run

Open a terminal inside VS Code: **Terminal → New Terminal** (or `` Ctrl+` ``).
Then run these two commands one at a time, from the project root:

```bash
npm install
```

This downloads all the packages the project needs. It only takes a minute,
and you only need to do it once (or again if you pull new changes later).

```bash
npm run dev
```

This starts the app. Your terminal will print a link that looks like
`http://localhost:5173` — hold Ctrl (or Cmd on Mac) and click it, or paste it
into your browser.

To stop the app, click back into the terminal and press `Ctrl + C`.

### 3. Log in

The app opens on a login screen. Use an account registered via the backend
(see Backend setup, step 3 above), or one of these test accounts if already
created:

| Role | Email | Password |
|---|---|---|
| Fleet Manager | fleetmanager1@transitops.com | password123 |
| Dispatcher | dispatcher1@transitops.com | password123 |

### 4. Where things live

```
src/
  pages/        Each screen of the app (Dashboard, Login, etc.)
  components/   Reusable pieces (buttons, cards, the sidebar, tables…)
  services/     Where the app "talks" to the backend — this is the only
                place that changes when swapping mock data for real data
  context/      App-wide state, like "who is logged in"
  constants/    Shared values, like route paths and status names
```

If you're looking for a specific screen, check `src/pages` first — the file
names match what you see in the sidebar (e.g. `Dashboard.jsx`,
`VehicleRegistry.jsx`).

### 5. What's built so far

- ✅ **Login & access control** — sign in, and each role only sees the pages
  it's allowed to.
- ✅ **Dashboard** — key stats (active vehicles, trips, etc.) and charts.
- ✅ **Vehicle Registry** — the master vehicle list: search, filter by
  status/type, sortable columns, pagination, and add/edit/remove a vehicle.
- ✅ **Drivers** — driver roster with license category/expiry tracking
  (expired and expiring-soon licenses are flagged), safety score, status,
  and add/edit/remove.
- 🔄 **Trips** — being wired up to the real backend now.
- ⏳ Maintenance, Fuel Logs, Expenses, Reports, Settings — still "coming
  soon" screens.

### Frontend troubleshooting

- **"npm: command not found"** → Node.js isn't installed. See step 1.
- **Blank page in the browser** → Check the VS Code terminal for red error
  text and make sure `npm install` finished without errors first.
- **Port already in use** → Something else is already running on
  `localhost:5173`. Close it, or just check the terminal — Vite will
  automatically offer you the next free port instead.
- **Shows old/sample data instead of real data from the backend** → check
  `USE_MOCKS` at the top of the relevant file in `src/services/` — it
  needs to be `false` to hit the real backend, and `VITE_API_BASE_URL`
  needs to be set in a `.env` file at the project root
  (`VITE_API_BASE_URL=http://localhost:8000/api/v1`).
