import api, { mockDelay } from "./api";
import { getAssignableVehicles } from "./trip";

// Flip to true to fall back to mock data for offline/demo use.
const USE_MOCKS = false;

function vehicleLabel(vehicleId, vehicles) {
  const v = vehicles.find((x) => x.id === vehicleId);
  return v ? `${v.name} · ${v.registrationNumber}` : "—";
}

// backend snake_case -> frontend camelCase
function fromBackend(f) {
  return {
    id: f.id,
    vehicleId: f.vehicle_id,
    tripId: f.trip_id,
    quantityLiters: f.liters,
    totalCost: f.cost,
    fuelDate: f.date,
  };
}

let mockLogs = [
  {
    id: "f-1",
    vehicleId: "v-1",
    tripId: null,
    quantityLiters: 45,
    totalCost: 4162.5,
    fuelDate: "2026-07-10",
  },
  {
    id: "f-2",
    vehicleId: "v-2",
    tripId: null,
    quantityLiters: 38,
    totalCost: 3488.4,
    fuelDate: "2026-07-09",
  },
];

export async function getFuelLogs() {
  if (USE_MOCKS) {
    const vehicles = await getAssignableVehicles(true);
    await mockDelay(400);
    return mockLogs.map((l) => ({ ...l, vehicleLabel: vehicleLabel(l.vehicleId, vehicles) }));
  }

  const { data } = await api.get("/fuel-logs");
  const logs = data.data.map(fromBackend);
  const vehicles = await getAssignableVehicles(true);
  return logs.map((l) => ({ ...l, vehicleLabel: vehicleLabel(l.vehicleId, vehicles) }));
}

export async function getFuelVehicles() {
  // Any vehicle can have fuel logged against it regardless of current
  // status (unlike Trips/Maintenance, there's no "must be Available"
  // rule here) — so this intentionally fetches ALL vehicles, not just
  // Available ones.
  return getAssignableVehicles(true);
}

// payload: { vehicleId, quantityLiters, totalCost, fuelDate }
// No update or delete — the backend only supports create + list for
// fuel logs, no editing or removing an entry once logged.
export async function createFuelLog(payload) {
  if (USE_MOCKS) {
    const log = { id: `f-${Date.now()}`, tripId: null, ...payload };
    mockLogs = [log, ...mockLogs];
    return mockDelay(log);
  }

  const { data } = await api.post("/fuel-logs", {
    vehicle_id: payload.vehicleId,
    liters: payload.quantityLiters,
    cost: payload.totalCost,
    date: payload.fuelDate,
  });
  return fromBackend(data.data);
}
