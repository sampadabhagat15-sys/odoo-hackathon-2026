import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ToastViewport from "./components/ui/ToastViewport";
import ProtectedRoute from "./routes/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";
import { ROUTES } from "./constants/routes";
import { ROUTE_ACCESS } from "./constants/roles";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import VehicleRegistry from "./pages/VehicleRegistry";
import Drivers from "./pages/Drivers";
import Trips from "./pages/Trips";
import Maintenance from "./pages/Maintenance";
import FuelLogs from "./pages/FuelLogs";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path={ROUTES.LOGIN} element={<Login />} />

            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
              <Route
                path={ROUTES.VEHICLES}
                element={<ProtectedRoute allow={ROUTE_ACCESS.vehicles}><VehicleRegistry /></ProtectedRoute>}
              />
              <Route
                path={ROUTES.DRIVERS}
                element={<ProtectedRoute allow={ROUTE_ACCESS.drivers}><Drivers /></ProtectedRoute>}
              />
              <Route
                path={ROUTES.TRIPS}
                element={<ProtectedRoute allow={ROUTE_ACCESS.trips}><Trips /></ProtectedRoute>}
              />
              <Route
                path={ROUTES.MAINTENANCE}
                element={<ProtectedRoute allow={ROUTE_ACCESS.maintenance}><Maintenance /></ProtectedRoute>}
              />
              <Route
                path={ROUTES.FUEL}
                element={<ProtectedRoute allow={ROUTE_ACCESS.fuel}><FuelLogs /></ProtectedRoute>}
              />
              <Route
                path={ROUTES.EXPENSES}
                element={<ProtectedRoute allow={ROUTE_ACCESS.expenses}><Expenses /></ProtectedRoute>}
              />
              <Route
                path={ROUTES.REPORTS}
                element={<ProtectedRoute allow={ROUTE_ACCESS.reports}><Reports /></ProtectedRoute>}
              />
              <Route
                path={ROUTES.SETTINGS}
                element={<ProtectedRoute allow={ROUTE_ACCESS.settings}><Settings /></ProtectedRoute>}
              />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <ToastViewport />
      </ToastProvider>
    </AuthProvider>
  );
}
