export const VEHICLE_STATUS = {
  AVAILABLE: "Available",
  ON_TRIP: "On Trip",
  IN_SHOP: "In Shop",
  RETIRED: "Retired",
};

export const DRIVER_STATUS = {
  AVAILABLE: "Available",
  ON_TRIP: "On Trip",
  OFF_DUTY: "Off Duty",
  SUSPENDED: "Suspended",
};

export const TRIP_STATUS = {
  DRAFT: "Draft",
  DISPATCHED: "Dispatched",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

// Backend only has two maintenance states (Active/Closed) — the previous
// four-state model (Scheduled/In Progress/Completed/Overdue) had no real
// data behind it. "Active" covers the whole "vehicle is in the shop right
// now" period; "Closed" means the vehicle's back to Available.
export const MAINTENANCE_STATUS = {
  ACTIVE: "Active",
  CLOSED: "Closed",
};

export const EXPENSE_STATUS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

// Maps a status string to the token pair used by <StatusBadge>.
// tone keys correspond to --color-status-* variables in index.css.
export const STATUS_TONE = {
  [VEHICLE_STATUS.AVAILABLE]: "available",
  [VEHICLE_STATUS.ON_TRIP]: "ontrip",
  [VEHICLE_STATUS.IN_SHOP]: "shop",
  [VEHICLE_STATUS.RETIRED]: "retired",
  [DRIVER_STATUS.OFF_DUTY]: "retired",
  [DRIVER_STATUS.SUSPENDED]: "danger",
  [TRIP_STATUS.DRAFT]: "retired",
  [TRIP_STATUS.DISPATCHED]: "ontrip",
  [TRIP_STATUS.COMPLETED]: "available",
  [TRIP_STATUS.CANCELLED]: "danger",
  [MAINTENANCE_STATUS.ACTIVE]: "ontrip",
  [MAINTENANCE_STATUS.CLOSED]: "available",
  [EXPENSE_STATUS.PENDING]: "shop",
  [EXPENSE_STATUS.APPROVED]: "available",
  [EXPENSE_STATUS.REJECTED]: "danger",
};
