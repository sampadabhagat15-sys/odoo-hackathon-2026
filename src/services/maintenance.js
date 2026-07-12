import { MAINTENANCE_STATUS } from "../constants/status";
import { getAssignableVehicles } from "./trip";

const DELAY_MS = 400;
function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), DELAY_MS));
}

function generateWorkOrderCode(index) {
  return `WO-${String(2000 + index)}`;
}

let records = [
  {
    id: "m-1",
    workOrderCode: generateWorkOrderCode(1),
    vehicleId: "v-1",
    type: "Scheduled Service",
    description: "10,000 km service — oil, filters, brake check.",
    serviceCenter: "Speedy Fleet Garage, Delhi",
    odometerKm: 10120,
    cost: 4200,
    scheduledDate: "2026-07-15",
    completedDate: null,
    status: MAINTENANCE_STATUS.SCHEDULED,
  },
  {
    id: "m-2",
    workOrderCode: generateWorkOrderCode(2),
    vehicleId: "v-2",
    type: "Tire Replacement",
    description: "Replace worn rear tires (pair).",
    serviceCenter: "MRF Service Point, Pune",
    odometerKm: 45210,
    cost: 9800,
    scheduledDate: "2026-07-05",
    completedDate: "2026-07-05",
    status: MAINTENANCE_STATUS.COMPLETED,
  },
  {
    id: "m-3",
    workOrderCode: generateWorkOrderCode(3),
    vehicleId: "v-3",
    type: "Repair",
    description: "AC compressor not engaging — diagnose and repair.",
    serviceCenter: "Bosch Car Service, Bengaluru",
    odometerKm: 61830,
    cost: 6100,
    scheduledDate: "2026-07-11",
    completedDate: null,
    status: MAINTENANCE_STATUS.IN_PROGRESS,
  },
  {
    id: "m-4",
    workOrderCode: generateWorkOrderCode(4),
    vehicleId: "v-4",
    type: "Inspection",
    description: "Annual fitness inspection — overdue.",
    serviceCenter: "RTO-authorized Center, Jaipur",
    odometerKm: 78940,
    cost: 1500,
    scheduledDate: "2026-06-28",
    completedDate: null,
    status: MAINTENANCE_STATUS.OVERDUE,
  },
  {
    id: "m-5",
    workOrderCode: generateWorkOrderCode(5),
    vehicleId: "v-1",
    type: "Oil Change",
    description: "Routine oil and filter change.",
    serviceCenter: "Speedy Fleet Garage, Delhi",
    odometerKm: 9500,
    cost: 1800,
    scheduledDate: "2026-06-20",
    completedDate: "2026-06-20",
    status: MAINTENANCE_STATUS.COMPLETED,
  },
];

async function vehicleLabel(vehicleId) {
  const vehicles = await getAssignableVehicles();
  const v = vehicles.find((x) => x.id === vehicleId);
  return v ? `${v.name} · ${v.registrationNumber}` : "—";
}

async function withLabel(record) {
  return { ...record, vehicleLabel: await vehicleLabel(record.vehicleId) };
}

export async function getMaintenanceRecords() {
  const withLabels = await Promise.all(records.map(withLabel));
  return delay(withLabels);
}

export async function getMaintenanceVehicles() {
  return getAssignableVehicles();
}

export async function createMaintenanceRecord(payload) {
  const record = {
    id: `m-${Date.now()}`,
    workOrderCode: generateWorkOrderCode(records.length + 1),
    completedDate: null,
    ...payload,
  };
  records = [record, ...records];
  return delay(await withLabel(record));
}

export async function updateMaintenanceRecord(id, payload) {
  records = records.map((r) => (r.id === id ? { ...r, ...payload } : r));
  const updated = records.find((r) => r.id === id);
  return delay(await withLabel(updated));
}

export async function deleteMaintenanceRecord(id) {
  records = records.filter((r) => r.id !== id);
  return delay({ id });
}
