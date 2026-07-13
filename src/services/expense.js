import api, { mockDelay } from "./api";
import { EXPENSE_STATUS } from "../constants/status";
import { getAssignableVehicles } from "./trip";

// Flip to true to fall back to mock data for offline/demo use.
const USE_MOCKS = false;

function vehicleLabel(vehicleId, vehicles) {
  const v = vehicles.find((x) => x.id === vehicleId);
  return v ? `${v.name} · ${v.registrationNumber}` : "—";
}

// backend snake_case -> frontend camelCase
function fromBackend(e) {
  return {
    id: e.id,
    vehicleId: e.vehicle_id,
    category: e.type,
    amount: e.amount,
    date: e.date,
    description: e.description,
    status: e.status,
    submittedBy: e.submitted_by,
    reviewedBy: e.reviewed_by,
    reviewedAt: e.reviewed_at,
  };
}

let mockExpenses = [
  {
    id: "exp-001",
    vehicleId: "v-1",
    category: "Toll",
    amount: 450,
    date: "2026-06-18",
    description: "NH-48 toll — Jaipur to Ajmer leg",
    status: EXPENSE_STATUS.APPROVED,
  },
  {
    id: "exp-002",
    vehicleId: "v-3",
    category: "Fine",
    amount: 1200,
    date: "2026-06-22",
    description: "Overloading fine — RTO checkpoint",
    status: EXPENSE_STATUS.PENDING,
  },
];

export async function getExpenses() {
  if (USE_MOCKS) {
    const vehicles = await getAssignableVehicles(true);
    await mockDelay(400);
    return mockExpenses.map((e) => ({ ...e, vehicleLabel: vehicleLabel(e.vehicleId, vehicles) }));
  }

  const { data } = await api.get("/expenses");
  const expenses = data.data.map(fromBackend);
  const vehicles = await getAssignableVehicles(true);
  return expenses.map((e) => ({ ...e, vehicleLabel: vehicleLabel(e.vehicleId, vehicles) }));
}

export async function getExpenseVehicles() {
  // Any vehicle can have an expense logged against it regardless of
  // current status — same reasoning as Fuel Logs.
  return getAssignableVehicles(true);
}

// payload: { vehicleId, category, amount, date, description }
// No update or delete — only create, and the two review actions below.
export async function createExpense(payload) {
  if (USE_MOCKS) {
    const expense = { id: `exp-${Date.now()}`, status: EXPENSE_STATUS.PENDING, ...payload };
    mockExpenses = [expense, ...mockExpenses];
    return mockDelay(expense);
  }

  const { data } = await api.post("/expenses", {
    vehicle_id: payload.vehicleId,
    type: payload.category,
    amount: payload.amount,
    date: payload.date,
    description: payload.description || null,
  });
  return fromBackend(data.data);
}

export async function approveExpense(id) {
  if (USE_MOCKS) {
    mockExpenses = mockExpenses.map((e) => (e.id === id ? { ...e, status: EXPENSE_STATUS.APPROVED } : e));
    return mockDelay(mockExpenses.find((e) => e.id === id));
  }
  const { data } = await api.post(`/expenses/${id}/approve`);
  return fromBackend(data.data);
}

export async function rejectExpense(id) {
  if (USE_MOCKS) {
    mockExpenses = mockExpenses.map((e) => (e.id === id ? { ...e, status: EXPENSE_STATUS.REJECTED } : e));
    return mockDelay(mockExpenses.find((e) => e.id === id));
  }
  const { data } = await api.post(`/expenses/${id}/reject`);
  return fromBackend(data.data);
}
