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

async function getKpis(filters = {}) {
  if (USE_MOCKS) {
    await mockDelay(400);
    // Filters (vehicleType, status, region) are applied server-side once
    // the real endpoint exists; the mock just echoes the same snapshot.
    return MOCK_KPIS;
  }
  const { data } = await api.get("/dashboard/kpis", { params: filters });
  return data;
}

async function getCharts(filters = {}) {
  if (USE_MOCKS) {
    await mockDelay(450);
    return {
      tripsOverTime: MOCK_TRIPS_OVER_TIME,
      fuelCost: MOCK_FUEL_COST,
      vehicleStatusDistribution: MOCK_VEHICLE_STATUS,
      operationalCost: MOCK_OPERATIONAL_COST,
    };
  }
  const { data } = await api.get("/dashboard/charts", { params: filters });
  return data;
}

export default { getKpis, getCharts };
