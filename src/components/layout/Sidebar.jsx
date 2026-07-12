import { NavLink } from "react-router-dom";
import {
  FiGrid, FiTruck, FiUsers, FiMap, FiTool, FiDroplet,
  FiCreditCard, FiBarChart2, FiSettings, FiActivity,
} from "react-icons/fi";
import { ROUTES } from "../../constants/routes";

const NAV_ITEMS = [
  { to: ROUTES.DASHBOARD, label: "Dashboard", icon: FiGrid, end: true },
  { to: ROUTES.VEHICLES, label: "Vehicle Registry", icon: FiTruck },
  { to: ROUTES.DRIVERS, label: "Drivers", icon: FiUsers },
  { to: ROUTES.TRIPS, label: "Trips", icon: FiMap },
  { to: ROUTES.MAINTENANCE, label: "Maintenance", icon: FiTool },
  { to: ROUTES.FUEL, label: "Fuel Logs", icon: FiDroplet },
  { to: ROUTES.EXPENSES, label: "Expenses", icon: FiCreditCard },
  { to: ROUTES.REPORTS, label: "Reports", icon: FiBarChart2 },
];

export default function Sidebar({ collapsed, mobileOpen, onNavigate }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-[var(--color-console)] transition-all duration-200 ease-out
        ${collapsed ? "w-[76px]" : "w-64"}
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
    >
      <div className="flex h-16 items-center gap-2.5 border-b border-[var(--color-console-border)] px-5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-signal)] text-[var(--color-console)]">
          <FiActivity className="h-4.5 w-4.5" />
        </span>
        {!collapsed && (
          <span className="font-[family-name:var(--font-display)] text-[15px] font-semibold tracking-tight text-white">
            TransitOps
          </span>
        )}
      </div>

      <nav className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[var(--color-console-soft)] text-white"
                  : "text-[var(--color-console-ink-soft)] hover:bg-[var(--color-console-soft)] hover:text-[var(--color-console-ink)]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full transition-colors ${
                    isActive ? "bg-[var(--color-signal)]" : "bg-transparent"
                  }`}
                />
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-[var(--color-console-border)] px-3 py-3">
        <NavLink
          to={ROUTES.SETTINGS}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-[var(--color-console-soft)] text-white"
                : "text-[var(--color-console-ink-soft)] hover:bg-[var(--color-console-soft)] hover:text-[var(--color-console-ink)]"
            }`
          }
        >
          <FiSettings className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>
      </div>
    </aside>
  );
}
