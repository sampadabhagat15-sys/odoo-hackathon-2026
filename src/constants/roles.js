export const ROLES = {
  FLEET_MANAGER: "fleet_manager",
  DRIVER: "driver",
  SAFETY_OFFICER: "safety_officer",
  FINANCIAL_ANALYST: "financial_analyst",
};

export const ROLE_LABELS = {
  [ROLES.FLEET_MANAGER]: "Fleet Manager",
  [ROLES.DRIVER]: "Driver",
  [ROLES.SAFETY_OFFICER]: "Safety Officer",
  [ROLES.FINANCIAL_ANALYST]: "Financial Analyst",
};

// Which roles may access which routes. Used by <ProtectedRoute allow={[...]}>.
// Fleet Manager is treated as an operational super-role across most modules.
export const ROUTE_ACCESS = {
  dashboard: [ROLES.FLEET_MANAGER, ROLES.DRIVER, ROLES.SAFETY_OFFICER, ROLES.FINANCIAL_ANALYST],
  vehicles: [ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER],
  drivers: [ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER],
  trips: [ROLES.FLEET_MANAGER, ROLES.DRIVER],
  maintenance: [ROLES.FLEET_MANAGER],
  fuel: [ROLES.FLEET_MANAGER, ROLES.FINANCIAL_ANALYST],
  expenses: [ROLES.FLEET_MANAGER, ROLES.FINANCIAL_ANALYST],
  reports: [ROLES.FLEET_MANAGER, ROLES.FINANCIAL_ANALYST],
  settings: [ROLES.FLEET_MANAGER, ROLES.DRIVER, ROLES.SAFETY_OFFICER, ROLES.FINANCIAL_ANALYST],
};
