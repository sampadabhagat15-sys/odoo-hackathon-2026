export const ROLES = {
  ADMIN: "admin",
  FLEET_MANAGER: "fleet_manager",
  DISPATCHER: "dispatcher",
  SAFETY_OFFICER: "safety_officer",
  FINANCIAL_ANALYST: "financial_analyst",
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: "Admin",
  [ROLES.FLEET_MANAGER]: "Fleet Manager",
  [ROLES.DISPATCHER]: "Dispatcher",
  [ROLES.SAFETY_OFFICER]: "Safety Officer",
  [ROLES.FINANCIAL_ANALYST]: "Financial Analyst",
};

// Which roles may access which routes. Used by <ProtectedRoute allow={[...]}>.
// Admin and Fleet Manager are treated as operational super-roles across
// most modules. Kept intentionally generous on VIEW access — the backend
// is the real source of truth and returns 403 on any write action a role
// isn't authorized for (and action buttons are separately hidden per-role
// where that's been wired up, e.g. Drivers suspend/reactivate). Being
// stricter here would risk blocking a role from legitimately viewing a
// page it should see, which is worse than a hidden/disabled button.
export const ROUTE_ACCESS = {
  dashboard: [ROLES.ADMIN, ROLES.FLEET_MANAGER, ROLES.DISPATCHER, ROLES.SAFETY_OFFICER, ROLES.FINANCIAL_ANALYST],
  vehicles: [ROLES.ADMIN, ROLES.FLEET_MANAGER],
  drivers: [ROLES.ADMIN, ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER],
  trips: [ROLES.ADMIN, ROLES.FLEET_MANAGER, ROLES.DISPATCHER],
  maintenance: [ROLES.ADMIN, ROLES.FLEET_MANAGER],
  fuel: [ROLES.ADMIN, ROLES.FLEET_MANAGER, ROLES.DISPATCHER, ROLES.FINANCIAL_ANALYST],
  expenses: [ROLES.ADMIN, ROLES.FLEET_MANAGER, ROLES.DISPATCHER, ROLES.FINANCIAL_ANALYST],
  reports: [ROLES.ADMIN, ROLES.FLEET_MANAGER, ROLES.FINANCIAL_ANALYST],
  settings: [ROLES.ADMIN, ROLES.FLEET_MANAGER, ROLES.DISPATCHER, ROLES.SAFETY_OFFICER, ROLES.FINANCIAL_ANALYST],
};
