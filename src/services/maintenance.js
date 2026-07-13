import api, { mockDelay } from "./api";
import { MAINTENANCE_STATUS } from "../constants/status";
import { getAssignableVehicles } from "./trip";

// Flip to true to fall back to mock data for offline/demo use.
const USE_MOCKS = false;

function vehicleLabel(vehicleId, vehicles) {
  const v = vehicles.find((x) => x.id === vehicleId);
  return v ? `${v.name} · ${v.registrationNumber}` : "—";
}

// backend snake_case -> frontend camelCase
function fromBackend(m) {
  return {
    id: m.id,
    vehicleId: m.vehicle_id,
    description: m.description,
    cost: m.cost,
    startDate: m.start_date,
    endDate: m.end_date,
    status: m.status,
  };
}

let mockRecords = [
  {
    id: "m-1",
    vehicleId: "v-1",
    description: "10,000 km service — oil, filters, brake check.",
    cost: 4200,
    startDate: "2026-07-15",
    endDate: null,
    status: MAINTENANCE_STATUS.ACTIVE,
  },
  {
    id: "m-2",
    vehicleId: "v-2",
    description: "Replace worn rear tires (pair).",
    cost: 9800,
    startDate: "2026-07-05",
    endDate: "2026-07-06",
    status: MAINTENANCE_STATUS.CLOSED,
  },
];

export async function getMaintenanceRecords() {
  if (USE_MOCKS) {
    const vehicles = await getAssignableVehicles(true);
    await mockDelay(400);
    return mockRecords.map((r) => ({ ...r, vehicleLabel: vehicleLabel(r.vehicleId, vehicles) }));
  }

  const { data } = await api.get("/maintenance");
  const records = data.data.map(fromBackend);

  // true = fetch all vehicles regardless of status, since a record for
  // an In Shop or even Retired vehicle still needs a label to display.
  const vehicles = await getAssignableVehicles(true);
  return records.map((r) => ({ ...r, vehicleLabel: vehicleLabel(r.vehicleId, vehicles) }));
}

export async function getMaintenanceVehicles() {
  // Only Available vehicles can start a NEW maintenance record (backend
  // rejects On Trip / Retired / already In Shop) — this powers the
  // "Vehicle" dropdown on the create form specifically.
  return getAssignableVehicles(false);
}

// payload: { vehicleId, description, cost, startDate }
export async function createMaintenanceRecord(payload) {
  if (USE_MOCKS) {
    const record = {
      id: `m-${Date.now()}`,
      endDate: null,
      status: MAINTENANCE_STATUS.ACTIVE,
      ...payload,
    };
    mockRecords = [record, ...mockRecords];
    return mockDelay(record);
  }

  const { data } = await api.post("/maintenance", {
    vehicle_id: payload.vehicleId,
    description: payload.description,
    cost: payload.cost,
    start_date: payload.startDate,
  });
  return fromBackend(data.data);
}

// No update — the backend has no PUT for maintenance records, only
// create and close (same pattern as Trips: specific actions, not a
// generic edit).
export async function closeMaintenanceRecord(id) {
  if (USE_MOCKS) {
    mockRecords = mockRecords.map((r) =>
      r.id === id ? { ...r, status: MAINTENANCE_STATUS.CLOSED, endDate: new Date().toISOString().slice(0, 10) } : r
    );
    return mockDelay(mockRecords.find((r) => r.id === id));
  }
  const { data } = await api.post(`/maintenance/${id}/close`);
  return fromBackend(data.data);
}
