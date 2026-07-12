# TransitOps — Frontend

This is the frontend (the part people see and click on) for TransitOps, a
platform for managing vehicles, drivers, trips, and maintenance. It's built
with React.

There's no real backend yet, so the app currently runs on **sample data**
that looks like what the real thing will return. Once the backend is ready,
only the files inside `src/services` need to change — nothing else.

## 1. What you need installed

- **Node.js** (version 18 or newer). Check by opening a terminal and typing:
  ```bash
  node -v
  ```
  If that doesn't work, download it from [nodejs.org](https://nodejs.org).
- **VS Code** — [code.visualstudio.com](https://code.visualstudio.com)

## 2. Open the project in VS Code

1. Unzip this folder somewhere on your computer.
2. Open VS Code.
3. Go to **File → Open Folder…** and select the `transitops-frontend` folder.
4. VS Code will likely pop up a message asking to install recommended
   extensions — click **Install All**. (These just add helpful things like
   Tailwind CSS color previews and auto-formatting. Not required, but nice.)

## 3. Install and run

Open a terminal inside VS Code: **Terminal → New Terminal** (or `` Ctrl+` ``).
Then run these two commands one at a time:

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

## 4. Log in

The app opens on a login screen. Since there's no real backend yet, use one
of these test accounts:

| Role | Email | Password |
|---|---|---|
| Fleet Manager | fleet.manager@transitops.io | password123 |
| Driver | driver@transitops.io | password123 |
| Safety Officer | safety.officer@transitops.io | password123 |
| Financial Analyst | finance@transitops.io | password123 |

There are also buttons on the login page that fill these in for you
automatically — just click a role name.

## 5. Where things live

```
src/
  pages/        Each screen of the app (Dashboard, Login, etc.)
  components/   Reusable pieces (buttons, cards, the sidebar, tables…)
  services/     Where the app "talks" to the backend — currently returns
                sample data, but this is the only place that will need to
                change once a real backend exists
  context/      App-wide state, like "who is logged in"
  constants/    Shared values, like route paths and status names
```

If you're looking for a specific screen, check `src/pages` first — the file
names match what you see in the sidebar (e.g. `Dashboard.jsx`,
`VehicleRegistry.jsx`).

## 6. What's built so far

- ✅ **Login & access control** — sign in, and each role only sees the pages
  it's allowed to.
- ✅ **Dashboard** — key stats (active vehicles, trips, etc.) and charts.
- ✅ **Vehicle Registry** — the master vehicle list: search, filter by status/type, sortable columns, pagination, and add/edit/remove a vehicle.
- ✅ **Drivers** — driver roster with license category/expiry tracking (expired and expiring-soon licenses are flagged), safety score, status, and add/edit/remove.
- ⏳ Everything else (Trips, Maintenance, Fuel
  Logs, Expenses, Reports, Settings) currently shows a "coming soon" screen
  and will be filled in one at a time.

## Troubleshooting

- **"npm: command not found"** → Node.js isn't installed. See step 1.
- **Blank page in the browser** → Check the VS Code terminal for red error
  text and make sure `npm install` finished without errors first.
- **Port already in use** → Something else is already running on
  `localhost:5173`. Close it, or just check the terminal — Vite will
  automatically offer you the next free port instead.
