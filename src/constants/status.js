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
};
