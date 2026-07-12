import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../constants/routes";
import EmptyState from "../components/ui/EmptyState";
import { FiLock } from "react-icons/fi";

// Wrap a route element: <ProtectedRoute allow={[ROLES.FLEET_MANAGER]}><Page /></ProtectedRoute>
// Omit `allow` to only require authentication, regardless of role.
export default function ProtectedRoute({ children, allow }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (allow && !allow.includes(user.role)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={FiLock}
          title="You don't have access to this module"
          description="Your current role doesn't include permission to view this page. Contact a Fleet Manager if you believe this is a mistake."
        />
      </div>
    );
  }

  return children;
}
