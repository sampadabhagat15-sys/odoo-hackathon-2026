import { getAssignableVehicles, getAssignableDrivers } from "./trip";

const DELAY_MS = 400;
function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), DELAY_MS));
}

function generateLogCode(index) {
  return `FL-${String(3000 + index)}`;
}

let logs = [
  {
    id: "f-1",
    logCode: generateLogCode(1),
    vehicleId: "v-1",
    driverId: "d-1",
    fuelType: "Diesel",
    quantityLiters: 45,
    costPerLiter: 92.5,
    odometerKm: 10120,
    station: "Indian Oil, NH8 Delhi",
    fuelDate: "2026-07-10",
  },
  {
    id: "f-2",
    logCode: generateLogCode(2),
    vehicleId: "v-2",
    driverId: "d-4",
    fuelType: "Diesel",
    quantityLiters: 38,
    costPerLiter: 91.8,
    odometerKm: 45210,
    station: "HP Petrol Pump, Pune",
    fuelDate: "2026-07-09",
  },
  {
    id: "f-3",
    logCode: generateLogCode(3),
    vehicleId: "v-3",
    driverId: "d-2",
    fuelType: "CNG",
    quantityLiters: 22,
    costPerLiter: 78.2,
    odometerKm: 61830,
    station: "IGL CNG Station, Bengaluru",
    fuelDate: "2026-07-11",
  },
  {
    id: "f-4",
    logCode: generateLogCode(4),
    vehicleId: "v-4",
    driverId: "d-3",
    fuelType: "Diesel",
    quantityLiters: 60,
    costPerLiter: 93.1,
    odometerKm: 78940,
    station: "Bharat Petroleum, Jaipur",
    fuelDate: "2026-07-08",
  },
  {
    id: "f-5",
    logCode: generateLogCode(5),
    vehicleId: "v-1",
    driverId: "d-1",
    fuelType: "Diesel",
    quantityLiters: 40,
    costPerLiter: 92.0,
    odometerKm: 9500,
    station: "Indian Oil, NH8 Delhi",
    fuelDate: "2026-06-25",
  },
];

async function labels(vehicleId, driverId) {
  const [vehicles, drivers] = await Promise.all([getAssignableVehicles(), getAssignableDrivers()]);
  const v = vehicles.find((x) => x.id === vehicleId);
  const d = drivers.find((x) => x.id === driverId);
  return {
    vehicleLabel: v ? `${v.name} · ${v.registrationNumber}` : "—",
    driverLabel: d ? d.name : "—",
  };
}

function withTotal(log) {
  return { ...log, totalCost: Math.round(log.quantityLiters * log.costPerLiter) };
}

async function withLabels(log) {
  const l = await labels(log.vehicleId, log.driverId);
  return { ...withTotal(log), ...l };
}

export async function getFuelLogs() {
  const enriched = await Promise.all(logs.map(withLabels));
  return delay(enriched);
}

export async function getFuelVehicles() {
  return getAssignableVehicles();
}

export async function getFuelDrivers() {
  return getAssignableDrivers();
}

export async function createFuelLog(payload) {
  const log = {
    id: `f-${Date.now()}`,
    logCode: generateLogCode(logs.length + 1),
    ...payload,
  };
  logs = [log, ...logs];
  return delay(await withLabels(log));
}

export async function updateFuelLog(id, payload) {
  logs = logs.map((l) => (l.id === id ? { ...l, ...payload } : l));
  const updated = logs.find((l) => l.id === id);
  return delay(await withLabels(updated));
}

export async function deleteFuelLog(id) {
  logs = logs.filter((l) => l.id !== id);
  return delay({ id });
}
