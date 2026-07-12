import api, { mockDelay } from "./api";

// Flip to false once GET /dashboard/kpis and /dashboard/charts exist.
const USE_MOCKS = true;

const MOCK_KPIS = {
  activeVehicles: 42,
  availableVehicles: 27,
  vehiclesInMaintenance: 5,
  activeTrips: 18,
  pendingTrips: 6,
  driversOnDuty: 31,
  fleetUtilization: 64, // percent
};

const MOCK_TRIPS_OVER_TIME = [
  { date: "Mon", trips: 14 },
  { date: "Tue", trips: 19 },
  { date: "Wed", trips: 16 },
  { date: "Thu", trips: 22 },
  { date: "Fri", trips: 27 },
  { date: "Sat", trips: 18 },
  { date: "Sun", trips: 11 },
];

const MOCK_FUEL_COST = [
  { month: "Feb", cost: 182000 },
  { month: "Mar", cost: 194500 },
  { month: "Apr", cost: 176300 },
  { month: "May", cost: 205100 },
  { month: "Jun", cost: 221800 },
  { month: "Jul", cost: 198400 },
];

const MOCK_VEHICLE_STATUS = [
  { status: "Available", count: 27 },
  { status: "On Trip", count: 18 },
  { status: "In Shop", count: 5 },
  { status: "Retired", count: 3 },
];

const MOCK_OPERATIONAL_COST = [
  { month: "Feb", fuel: 182000, maintenance: 64000 },
  { month: "Mar", fuel: 194500, maintenance: 51000 },
  { month: "Apr", fuel: 176300, maintenance: 88000 },
  { month: "May", fuel: 205100, maintenance: 47500 },
  { month: "Jun", fuel: 221800, maintenance: 72000 },
  { month: "Jul", fuel: 198400, maintenance: 39000 },
];

// --- Mock-only filter simulation -----------------------------------------
// This block exists purely so the mock data visibly reacts to the Type /
// Status / Region dropdowns during frontend development. It is NOT real
// business logic — actual filtering belongs server-side, in the real
// /dashboard/kpis and /dashboard/charts endpoints (see the `else` branches
// below, which are untouched and already pass `filters` through as query
// params). Delete this whole block once USE_MOCKS is flipped to false.

const TYPE_FACTORS = { all: 1, truck: 0.42, van: 0.33, trailer: 0.25 };
const REGION_FACTORS = { all: 1, north: 0.3, south: 0.24, east: 0.21, west: 0.25 };
const STATUS_FACTORS = { all: 1, available: 0.64, on_trip: 0.43, in_shop: 0.12, retired: 0.07 };
const STATUS_VALUE_TO_LABEL = {
  available: "Available",
  on_trip: "On Trip",
  in_shop: "In Shop",
  retired: "Retired",
};

function fleetScale(filters = {}) {
  const t = TYPE_FACTORS[filters.vehicleType] ?? 1;
  const r = REGION_FACTORS[filters.region] ?? 1;
  return t * r;
}

function scaleCount(base, factor) {
  return Math.max(1, Math.round(base * factor));
}

function scaleCurrency(base, factor) {
  return Math.max(0, Math.round((base * factor) / 100) * 100);
}
// --------------------------------------------------------------------------

async function getKpis(filters = {}) {
  if (USE_MOCKS) {
    await mockDelay(400);
    const factor = fleetScale(filters);
    const statusFactor = STATUS_FACTORS[filters.status] ?? 1;

    return {
      activeVehicles: scaleCount(MOCK_KPIS.activeVehicles, factor),
      availableVehicles: scaleCount(MOCK_KPIS.availableVehicles, factor * statusFactor),
      vehiclesInMaintenance: scaleCount(MOCK_KPIS.vehiclesInMaintenance, factor * statusFactor),
      activeTrips: scaleCount(MOCK_KPIS.activeTrips, factor),
      pendingTrips: scaleCount(MOCK_KPIS.pendingTrips, factor),
      driversOnDuty: scaleCount(MOCK_KPIS.driversOnDuty, factor),
      fleetUtilization: Math.min(
        100,
        Math.max(5, Math.round(MOCK_KPIS.fleetUtilization * (0.6 + factor * 0.4)))
      ),
    };
  }
  const { data } = await api.get("/dashboard/kpis", { params: filters });
  return data;
}

async function getCharts(filters = {}) {
  if (USE_MOCKS) {
    await mockDelay(450);
    const factor = fleetScale(filters);

    const tripsOverTime = MOCK_TRIPS_OVER_TIME.map((d) => ({
      ...d,
      trips: scaleCount(d.trips, factor),
    }));

    const fuelCost = MOCK_FUEL_COST.map((d) => ({
      ...d,
      cost: scaleCurrency(d.cost, factor),
    }));

    const operationalCost = MOCK_OPERATIONAL_COST.map((d) => ({
      ...d,
      fuel: scaleCurrency(d.fuel, factor),
      maintenance: scaleCurrency(d.maintenance, factor),
    }));

    let vehicleStatusDistribution;
    if (filters.status && filters.status !== "all") {
      const label = STATUS_VALUE_TO_LABEL[filters.status];
      const base = MOCK_VEHICLE_STATUS.find((s) => s.status === label);
      vehicleStatusDistribution = base
        ? [{ status: base.status, count: scaleCount(base.count, factor) }]
        : [];
    } else {
      vehicleStatusDistribution = MOCK_VEHICLE_STATUS.map((d) => ({
        ...d,
        count: scaleCount(d.count, factor),
      }));
    }

    return {
      tripsOverTime,
      fuelCost,
      vehicleStatusDistribution,
      operationalCost,
    };
  }
  const { data } = await api.get("/dashboard/charts", { params: filters });
  return data;
}

export default { getKpis, getCharts };
