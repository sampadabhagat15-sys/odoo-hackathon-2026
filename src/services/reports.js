import { getTrips, getAssignableVehicles } from "./trip";
import { getFuelLogs } from "./fuel";
import { getMaintenanceRecords } from "./maintenance";
import { getExpenses, getExpenseTotalsByVehicle } from "./expense";
import { TRIP_STATUS, EXPENSE_STATUS } from "../constants/status";

// This file only aggregates data that fuel.js / maintenance.js / trip.js /
// expense.js already return — no new business rules are invented here.
// When a real /reports API exists, these functions get replaced with plain
// Axios calls; every consumer (Reports.jsx) keeps working unchanged as long
// as the return shapes below are preserved.

const DELAY_MS = 400;
function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), DELAY_MS));
}

function inRange(dateStr, from, to) {
  if (!dateStr) return true;
  if (from && dateStr < from) return false;
  if (to && dateStr > to) return false;
  return true;
}

/**
 * Headline numbers for the StatCard row.
 * filters: { from?: "YYYY-MM-DD", to?: "YYYY-MM-DD" }
 */
export async function getReportsSummary(filters = {}) {
  const { from = null, to = null } = filters;

  const [trips, fuelLogs, maintenanceRecords, expenses] = await Promise.all([
    getTrips(),
    getFuelLogs(),
    getMaintenanceRecords(),
    getExpenses(),
  ]);

  const filteredTrips = trips.filter((t) => inRange(t.departureDate, from, to));
  const filteredFuel = fuelLogs.filter((f) => inRange(f.fuelDate, from, to));
  const filteredMaintenance = maintenanceRecords.filter((m) =>
    inRange(m.scheduledDate, from, to)
  );
  const filteredExpenses = expenses.filter((e) => inRange(e.date, from, to));

  const totalDistanceKm = filteredTrips.reduce(
    (sum, t) => sum + (t.distanceKm || 0),
    0
  );
  const totalFuelCost = filteredFuel.reduce(
    (sum, f) => sum + (f.totalCost || 0),
    0
  );
  const totalMaintenanceCost = filteredMaintenance.reduce(
    (sum, m) => sum + (m.cost || 0),
    0
  );
  const totalExpenseCost = filteredExpenses
    .filter((e) => e.status !== EXPENSE_STATUS.REJECTED)
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  return delay({
    totalTrips: filteredTrips.length,
    completedTrips: filteredTrips.filter((t) => t.status === TRIP_STATUS.COMPLETED)
      .length,
    totalDistanceKm,
    totalFuelCost,
    totalMaintenanceCost,
    totalExpenseCost,
    totalOperationalCost: totalFuelCost + totalMaintenanceCost + totalExpenseCost,
  });
}

/**
 * Trip counts grouped by status — feeds the pie chart.
 * Returns: [{ status, count }]
 */
export async function getTripStatusBreakdown(filters = {}) {
  const { from = null, to = null } = filters;
  const trips = await getTrips();
  const filtered = trips.filter((t) => inRange(t.departureDate, from, to));

  const counts = {};
  Object.values(TRIP_STATUS).forEach((status) => {
    counts[status] = 0;
  });
  filtered.forEach((t) => {
    counts[t.status] = (counts[t.status] || 0) + 1;
  });

  const result = Object.entries(counts).map(([status, count]) => ({
    status,
    count,
  }));
  return delay(result);
}

/**
 * Fuel + maintenance cost grouped by month — feeds the stacked bar chart.
 * Not range-filtered by design (shows the full trend regardless of the
 * summary card range) — same convention as the Dashboard's Fuel Cost chart.
 * Returns: [{ month: "Jul 2026", fuel, maintenance, total }]
 */
export async function getMonthlyCostTrend() {
  const [fuelLogs, maintenanceRecords] = await Promise.all([
    getFuelLogs(),
    getMaintenanceRecords(),
  ]);

  const monthKey = (dateStr) => (dateStr ? dateStr.slice(0, 7) : null); // "2026-07"
  const monthLabel = (key) => {
    const [year, month] = key.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  const buckets = {};
  fuelLogs.forEach((f) => {
    const key = monthKey(f.fuelDate);
    if (!key) return;
    buckets[key] = buckets[key] || { fuel: 0, maintenance: 0 };
    buckets[key].fuel += f.totalCost || 0;
  });
  maintenanceRecords.forEach((m) => {
    const key = monthKey(m.scheduledDate);
    if (!key) return;
    buckets[key] = buckets[key] || { fuel: 0, maintenance: 0 };
    buckets[key].maintenance += m.cost || 0;
  });

  const result = Object.keys(buckets)
    .sort()
    .map((key) => ({
      month: monthLabel(key),
      fuel: buckets[key].fuel,
      maintenance: buckets[key].maintenance,
      total: buckets[key].fuel + buckets[key].maintenance,
    }));

  return delay(result);
}

/**
 * Fuel + maintenance + expense cost grouped by vehicle — feeds the bar
 * chart and the cost breakdown table.
 * Returns: [{ vehicleId, vehicleLabel, fuelCost, maintenanceCost,
 *             expenseCost, totalCost }]
 */
export async function getCostByVehicle() {
  const [fuelLogs, maintenanceRecords, vehicles, expenseTotals] = await Promise.all([
    getFuelLogs(),
    getMaintenanceRecords(),
    getAssignableVehicles(),
    getExpenseTotalsByVehicle(),
  ]);

  const rows = vehicles.map((v) => {
    const fuelCost = fuelLogs
      .filter((f) => f.vehicleId === v.id)
      .reduce((sum, f) => sum + (f.totalCost || 0), 0);
    const maintenanceCost = maintenanceRecords
      .filter((m) => m.vehicleId === v.id)
      .reduce((sum, m) => sum + (m.cost || 0), 0);
    // expenseTotals is keyed by expense.js's vehicleId ("veh_1" style) —
    // will read as 0 until those ids match trip.js's ("v-1" style).
    const expenseCost = expenseTotals[v.id] || 0;

    return {
      vehicleId: v.id,
      vehicleLabel: `${v.name} · ${v.registrationNumber}`,
      fuelCost,
      maintenanceCost,
      expenseCost,
      totalCost: fuelCost + maintenanceCost + expenseCost,
    };
  });

  return delay(rows.sort((a, b) => b.totalCost - a.totalCost));
}
