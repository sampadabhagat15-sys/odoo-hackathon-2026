import api, { mockDelay } from "./api";
import { TRIP_STATUS } from "../constants/status";

// Flip to true to fall back to mock data for offline/demo use.
// Requires vehicles/drivers to already exist in the backend with status
// Available so they show up as assignable.
const USE_MOCKS = false;

function fromBackend(t) {
  return {
    id: t.id,
    origin: t.source,
    destination: t.destination,
    vehicleId: t.vehicle_id,
    driverId: t.driver_id,
    cargoWeightKg: t.cargo_weight,
    distanceKm: t.planned_distance,
    actualDistanceKm: t.actual_distance,
    fuelConsumedLiters: t.fuel_consumed,
    status: t.status,
    dispatchedAt: t.dispatched_at,
    completedAt: t.completed_at,
    cancelledAt: t.cancelled_at,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  };
}

function vehicleFromBackend(v) {
  return { id: v.id, registrationNumber: v.registration_number, name: v.name };
}

function driverFromBackend(d) {
  return { id: d.id, name: d.name, licenseNumber: d.license_number };
}

function generateTripCode(index) {
  return `TR-${String(1000 + index)}`;
}

const ASSIGNABLE_VEHICLES = [
  { id: "v-1", registrationNumber: "DL-05C-1234", name: "Tata Ace" },
  { id: "v-2", registrationNumber: "MH-12AB-5566", name: "Ashok Leyland Dost" },
  { id: "v-3", registrationNumber: "KA-03CD-7788", name: "Mahindra Bolero Pickup" },
  { id: "v-4", registrationNumber: "RJ-14EF-9901", name: "Eicher Pro 2049" },
];

const ASSIGNABLE_DRIVERS = [
  { id: "d-1", name: "Alex Menon", licenseNumber: "DL-1420-20180113" },
  { id: "d-2", name: "Priya Nair", licenseNumber: "KA-0322-20190876" },
  { id: "d-3", name: "Rohit Sharma", licenseNumber: "RJ-1109-20170234" },
  { id: "d-4", name: "Fatima Sheikh", licenseNumber: "MH-0876-20200456" },
];

function vehicleLabel(vehicleId, vehicles = ASSIGNABLE_VEHICLES) {
  const v = vehicles.find((x) => x.id === vehicleId);
  return v ? `${v.name} · ${v.registrationNumber}` : "—";
}

function driverLabel(driverId, drivers = ASSIGNABLE_DRIVERS) {
  const d = drivers.find((x) => x.id === driverId);
  return d ? d.name : "—";
}

let mockTrips = [
  { id: "t-1", tripCode: generateTripCode(1), origin: "Delhi", destination: "Jaipur", vehicleId: "v-1", driverId: "d-1", cargoWeightKg: 620, distanceKm: 280, status: TRIP_STATUS.DISPATCHED },
  { id: "t-2", tripCode: generateTripCode(2), origin: "Mumbai", destination: "Pune", vehicleId: "v-2", driverId: "d-4", cargoWeightKg: 340, distanceKm: 150, status: TRIP_STATUS.COMPLETED },
  { id: "t-3", tripCode: generateTripCode(3), origin: "Bengaluru", destination: "Chennai", vehicleId: "v-3", driverId: "d-2", cargoWeightKg: 210, distanceKm: 345, status: TRIP_STATUS.DRAFT },
  { id: "t-4", tripCode: generateTripCode(4), origin: "Jaipur", destination: "Ahmedabad", vehicleId: "v-4", driverId: "d-3", cargoWeightKg: 1450, distanceKm: 660, status: TRIP_STATUS.CANCELLED },
];

function withMockLabels(trip) {
  return { ...trip, vehicleLabel: vehicleLabel(trip.vehicleId), driverLabel: driverLabel(trip.driverId) };
}

export async function getTrips() {
  if (USE_MOCKS) {
    await mockDelay();
    return mockTrips.map(withMockLabels);
  }
  const { data } = await api.get("/trips");
  const trips = data.data.map(fromBackend);
  const [vehicles, drivers] = await Promise.all([getAssignableVehicles(true), getAssignableDrivers(true)]);
  return trips.map((t) => ({
    ...t,
    vehicleLabel: vehicleLabel(t.vehicleId, vehicles),
    driverLabel: driverLabel(t.driverId, drivers),
  }));
}

export async function getAssignableVehicles(includeAll = false) {
  if (USE_MOCKS) {
    await mockDelay();
    return ASSIGNABLE_VEHICLES;
  }
  const params = includeAll ? {} : { status_filter: "Available" };
  const { data } = await api.get("/vehicles", { params });
  return data.data.map(vehicleFromBackend);
}

export async function getAssignableDrivers(includeAll = false) {
  if (USE_MOCKS) {
    await mockDelay();
    return ASSIGNABLE_DRIVERS;
  }
  const params = includeAll ? {} : { status_filter: "Available" };
  const { data } = await api.get("/drivers", { params });
  return data.data.map(driverFromBackend);
}

export async function createTrip(payload) {
  if (USE_MOCKS) {
    const trip = { id: `t-${Date.now()}`, tripCode: generateTripCode(mockTrips.length + 1), status: TRIP_STATUS.DRAFT, ...payload };
    mockTrips = [trip, ...mockTrips];
    return mockDelay(withMockLabels(trip));
  }
  const { data } = await api.post("/trips", {
    source: payload.origin,
    destination: payload.destination,
    vehicle_id: payload.vehicleId,
    driver_id: payload.driverId,
    cargo_weight: payload.cargoWeightKg,
    planned_distance: payload.distanceKm,
  });
  return fromBackend(data.data);
}

export async function dispatchTrip(id) {
  if (USE_MOCKS) {
    mockTrips = mockTrips.map((t) => (t.id === id ? { ...t, status: TRIP_STATUS.DISPATCHED } : t));
    return mockDelay(withMockLabels(mockTrips.find((t) => t.id === id)));
  }
  const { data } = await api.post(`/trips/${id}/dispatch`);
  return fromBackend(data.data);
}

export async function completeTrip(id, payload) {
  if (USE_MOCKS) {
    mockTrips = mockTrips.map((t) => (t.id === id ? { ...t, status: TRIP_STATUS.COMPLETED } : t));
    return mockDelay(withMockLabels(mockTrips.find((t) => t.id === id)));
  }
  const { data } = await api.post(`/trips/${id}/complete`, {
    final_odometer: payload.finalOdometer,
    fuel_consumed: payload.fuelConsumedLiters,
  });
  return fromBackend(data.data);
}

export async function cancelTrip(id) {
  if (USE_MOCKS) {
    mockTrips = mockTrips.map((t) => (t.id === id ? { ...t, status: TRIP_STATUS.CANCELLED } : t));
    return mockDelay(withMockLabels(mockTrips.find((t) => t.id === id)));
  }
  const { data } = await api.post(`/trips/${id}/cancel`);
  return fromBackend(data.data);
}
