import { TRIP_STATUS } from "../constants/status";

// Simulates network latency so loading states are visible during development.
const DELAY_MS = 400;
function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), DELAY_MS));
}

function generateTripCode(index) {
  return `TR-${String(1000 + index)}`;
}

// TODO: once the backend is ready, swap this for the real vehicle/driver
// services (e.g. import { getVehicles } from "./vehicle"; import { getDrivers } from "./driver";).
// Kept local here so Trips doesn't assume function names it hasn't confirmed yet.
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

function vehicleLabel(vehicleId) {
  const v = ASSIGNABLE_VEHICLES.find((x) => x.id === vehicleId);
  return v ? `${v.name} · ${v.registrationNumber}` : "—";
}

function driverLabel(driverId) {
  const d = ASSIGNABLE_DRIVERS.find((x) => x.id === driverId);
  return d ? d.name : "—";
}

let trips = [
  {
    id: "t-1",
    tripCode: generateTripCode(1),
    origin: "Delhi",
    destination: "Jaipur",
    region: "North",
    vehicleId: "v-1",
    driverId: "d-1",
    cargoType: "General",
    cargoWeightKg: 620,
    distanceKm: 280,
    departureDate: "2026-07-10",
    expectedArrival: "2026-07-11",
    status: TRIP_STATUS.DISPATCHED,
  },
  {
    id: "t-2",
    tripCode: generateTripCode(2),
    origin: "Mumbai",
    destination: "Pune",
    region: "West",
    vehicleId: "v-2",
    driverId: "d-4",
    cargoType: "Perishable",
    cargoWeightKg: 340,
    distanceKm: 150,
    departureDate: "2026-07-09",
    expectedArrival: "2026-07-09",
    status: TRIP_STATUS.COMPLETED,
  },
  {
    id: "t-3",
    tripCode: generateTripCode(3),
    origin: "Bengaluru",
    destination: "Chennai",
    region: "South",
    vehicleId: "v-3",
    driverId: "d-2",
    cargoType: "Fragile",
    cargoWeightKg: 210,
    distanceKm: 345,
    departureDate: "2026-07-13",
    expectedArrival: "2026-07-14",
    status: TRIP_STATUS.DRAFT,
  },
  {
    id: "t-4",
    tripCode: generateTripCode(4),
    origin: "Jaipur",
    destination: "Ahmedabad",
    region: "West",
    vehicleId: "v-4",
    driverId: "d-3",
    cargoType: "Bulk",
    cargoWeightKg: 1450,
    distanceKm: 660,
    departureDate: "2026-07-08",
    expectedArrival: "2026-07-09",
    status: TRIP_STATUS.CANCELLED,
  },
  {
    id: "t-5",
    tripCode: generateTripCode(5),
    origin: "Kolkata",
    destination: "Bhubaneswar",
    region: "East",
    vehicleId: "v-1",
    driverId: "d-1",
    cargoType: "Refrigerated",
    cargoWeightKg: 890,
    distanceKm: 440,
    departureDate: "2026-07-14",
    expectedArrival: "2026-07-15",
    status: TRIP_STATUS.DISPATCHED,
  },
  {
    id: "t-6",
    tripCode: generateTripCode(6),
    origin: "Hyderabad",
    destination: "Vijayawada",
    region: "South",
    vehicleId: "v-3",
    driverId: "d-2",
    cargoType: "General",
    cargoWeightKg: 510,
    distanceKm: 275,
    departureDate: "2026-07-06",
    expectedArrival: "2026-07-07",
    status: TRIP_STATUS.COMPLETED,
  },
];

function withLabels(trip) {
  return {
    ...trip,
    vehicleLabel: vehicleLabel(trip.vehicleId),
    driverLabel: driverLabel(trip.driverId),
  };
}

export async function getTrips() {
  return delay(trips.map(withLabels));
}

export async function getAssignableVehicles() {
  return delay(ASSIGNABLE_VEHICLES);
}

export async function getAssignableDrivers() {
  return delay(ASSIGNABLE_DRIVERS);
}

export async function createTrip(payload) {
  const trip = {
    id: `t-${Date.now()}`,
    tripCode: generateTripCode(trips.length + 1),
    ...payload,
  };
  trips = [trip, ...trips];
  return delay(withLabels(trip));
}

export async function updateTrip(id, payload) {
  trips = trips.map((t) => (t.id === id ? { ...t, ...payload } : t));
  const updated = trips.find((t) => t.id === id);
  return delay(withLabels(updated));
}

export async function deleteTrip(id) {
  trips = trips.filter((t) => t.id !== id);
  return delay({ id });
}
