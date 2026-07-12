import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import { ROUTES } from "../constants/routes";

const PAGE_TITLES = {
  [ROUTES.DASHBOARD]: "Dashboard",
  [ROUTES.VEHICLES]: "Vehicle Registry",
  [ROUTES.DRIVERS]: "Drivers",
  [ROUTES.TRIPS]: "Trips",
  [ROUTES.MAINTENANCE]: "Maintenance",
  [ROUTES.FUEL]: "Fuel Logs",
  [ROUTES.EXPENSES]: "Expenses",
  [ROUTES.REPORTS]: "Reports & Analytics",
  [ROUTES.SETTINGS]: "Settings",
};

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] || "TransitOps";

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
      />

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className={`transition-all duration-200 ease-out ${collapsed ? "lg:pl-[76px]" : "lg:pl-64"}`}>
        <Navbar
          onToggleSidebar={() => setCollapsed((v) => !v)}
          onToggleMobile={() => setMobileOpen((v) => !v)}
          pageTitle={pageTitle}
        />
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
