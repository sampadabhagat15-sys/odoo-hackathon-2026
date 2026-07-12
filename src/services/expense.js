// services/expense.js
import { EXPENSE_STATUS } from "../constants/status";

const DELAY_MS = 400;
function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), DELAY_MS));
}

// NOTE: vehicleId/tripId below reference the `id` field on your vehicle/trip
// mock records. Swap `registrationNumber` in Expenses.jsx if your vehicle.js
// uses a different field name for the reg number.
let expenses = [
  {
    id: "exp-001",
    date: "2026-06-18",
    category: "Toll",
    vehicleId: "veh_1",
    tripId: "t-1",
    amount: 450,
    description: "NH-48 toll — Jaipur to Ajmer leg",
    status: EXPENSE_STATUS.APPROVED,
    submittedBy: "driver@transitops.io",
    approvedBy: "finance@transitops.io",
    createdAt: "2026-06-18T09:15:00.000Z",
  },
  {
    id: "exp-002",
    date: "2026-06-22",
    category: "Fine",
    vehicleId: "veh_3",
    tripId: null,
    amount: 1200,
    description: "Overloading fine — RTO checkpoint",
    status: EXPENSE_STATUS.PENDING,
    submittedBy: "fleet.manager@transitops.io",
    approvedBy: null,
    createdAt: "2026-06-22T14:02:00.000Z",
  },
  {
    id: "exp-003",
    date: "2026-06-25",
    category: "Parking",
    vehicleId: "veh_2",
    tripId: "t-2",
    amount: 150,
    description: "Overnight parking — Jodhpur depot",
    status: EXPENSE_STATUS.PENDING,
    submittedBy: "driver@transitops.io",
    approvedBy: null,
    createdAt: "2026-06-25T20:30:00.000Z",
  },
  {
    id: "exp-004",
    date: "2026-06-28",
    category: "Repair",
    vehicleId: "veh_1",
    tripId: null,
    amount: 3200,
    description: "Roadside puncture repair, kit replacement",
    status: EXPENSE_STATUS.REJECTED,
    submittedBy: "fleet.manager@transitops.io",
    approvedBy: "finance@transitops.io",
    createdAt: "2026-06-28T11:45:00.000Z",
  },
  {
    id: "exp-005",
    date: "2026-07-01",
    category: "Other",
    vehicleId: "veh_4",
    tripId: "t-5",
    amount: 600,
    description: "Cargo tarpaulin replacement",
    status: EXPENSE_STATUS.PENDING,
    submittedBy: "driver@transitops.io",
    approvedBy: null,
    createdAt: "2026-07-01T08:20:00.000Z",
  },
];

let nextId = 6;

export async function getExpenses() {
  return delay([...expenses]);
}

export async function createExpense(payload) {
  const newExpense = {
    id: `exp-${String(nextId++).padStart(3, "0")}`,
    status: EXPENSE_STATUS.PENDING,
    approvedBy: null,
    createdAt: new Date().toISOString(),
    ...payload,
  };
  expenses = [newExpense, ...expenses];
  return delay(newExpense);
}

export async function updateExpense(id, payload) {
  let updated = null;
  expenses = expenses.map((e) => {
    if (e.id === id) {
      updated = { ...e, ...payload };
      return updated;
    }
    return e;
  });
  return delay(updated);
}

export async function deleteExpense(id) {
  expenses = expenses.filter((e) => e.id !== id);
  return delay({ id });
}

// Financial Analyst / Fleet Manager action — approve or reject a pending expense
export async function reviewExpense(id, status, approvedBy) {
  return updateExpense(id, { status, approvedBy });
}

// Used by Reports (3.7/3.8): total expense cost per vehicle, excludes Fuel/Maintenance
// which already have their own totals in fuel.js/maintenance.js
export async function getExpenseTotalsByVehicle() {
  const totals = {};
  expenses
    .filter((e) => e.status !== EXPENSE_STATUS.REJECTED)
    .forEach((e) => {
      totals[e.vehicleId] = (totals[e.vehicleId] || 0) + e.amount;
    });
  return delay(totals);
}
