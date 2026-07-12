import { useEffect, useMemo, useState } from "react";
import {
  FiMap,
  FiTruck,
  FiDroplet,
  FiTool,
  FiCreditCard,
  FiTrendingUp,
} from "react-icons/fi";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import StatCard from "../components/ui/StatCard";
import ChartCard from "../components/ui/ChartCard";
import DataTable from "../components/ui/DataTable";
import FilterDropdown from "../components/ui/FilterDropdown";
import EmptyState from "../components/ui/EmptyState";
import { PageLoader, TableSkeleton } from "../components/ui/Loader";
import {
  getReportsSummary,
  getTripStatusBreakdown,
  getMonthlyCostTrend,
  getCostByVehicle,
} from "../services/reports";
import { STATUS_TONE } from "../constants/status";

// NOTE on prop names: StatCard / ChartCard / FilterDropdown are used here
// with the same prop shapes as on Dashboard.jsx. If your actual components
// differ, only this file needs adjusting — no service changes required.

const RANGE_OPTIONS = ["All Time", "This Month", "Last 30 Days", "Last 3 Months"];

function computeRange(preset) {
  const now = new Date();
  const toISO = (d) => d.toISOString().slice(0, 10);

  if (preset === "This Month") {
    return { from: toISO(new Date(now.getFullYear(), now.getMonth(), 1)), to: toISO(now) };
  }
  if (preset === "Last 30 Days") {
    const from = new Date(now);
    from.setDate(from.getDate() - 30);
    return { from: toISO(from), to: toISO(now) };
  }
  if (preset === "Last 3 Months") {
    const from = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    return { from: toISO(from), to: toISO(now) };
  }
  return { from: null, to: null }; // "All Time"
}

function formatCurrency(value) {
  return `₹${Math.round(value || 0).toLocaleString("en-IN")}`;
}

export default function Reports() {
  const [range, setRange] = useState("All Time");

  const [summary, setSummary] = useState(null);
  const [tripStatusData, setTripStatusData] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [costByVehicle, setCostByVehicle] = useState([]);

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);

  const [sortBy, setSortBy] = useState("totalCost");
  const [sortDir, setSortDir] = useState("desc");

  // Summary + trip status respect the range filter.
  useEffect(() => {
    const filters = computeRange(range);
    setLoadingSummary(true);
    Promise.all([getReportsSummary(filters), getTripStatusBreakdown(filters)]).then(
      ([summaryRes, tripStatusRes]) => {
        setSummary(summaryRes);
        setTripStatusData(tripStatusRes);
        setLoadingSummary(false);
      }
    );
  }, [range]);

  // Monthly trend + cost-by-vehicle show the full history regardless of range,
  // so they only need to load once.
  useEffect(() => {
    setLoadingCharts(true);
    setLoadingTable(true);
    getMonthlyCostTrend().then((res) => {
      setMonthlyTrend(res);
      setLoadingCharts(false);
    });
    getCostByVehicle().then((res) => {
      setCostByVehicle(res);
      setLoadingTable(false);
    });
  }, []);

  const sortedVehicleRows = useMemo(() => {
    const rows = [...costByVehicle];
    rows.sort((a, b) => {
      const diff = a[sortBy] > b[sortBy] ? 1 : a[sortBy] < b[sortBy] ? -1 : 0;
      return sortDir === "asc" ? diff : -diff;
    });
    return rows;
  }, [costByVehicle, sortBy, sortDir]);

  function handleSort(key) {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
  }

  const columns = [
    { key: "vehicleLabel", label: "Vehicle", sortable: true },
    {
      key: "fuelCost",
      label: "Fuel Cost",
      sortable: true,
      align: "right",
      render: (row) => formatCurrency(row.fuelCost),
    },
    {
      key: "maintenanceCost",
      label: "Maintenance Cost",
      sortable: true,
      align: "right",
      render: (row) => formatCurrency(row.maintenanceCost),
    },
    {
      key: "expenseCost",
      label: "Expense Cost",
      sortable: true,
      align: "right",
      render: (row) => formatCurrency(row.expenseCost),
    },
    {
      key: "totalCost",
      label: "Total Cost",
      sortable: true,
      align: "right",
      render: (row) => formatCurrency(row.totalCost),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <FilterDropdown
          label="Range"
          value={range}
          options={RANGE_OPTIONS}
          onChange={setRange}
        />
      </div>

      {loadingSummary || !summary ? (
        <PageLoader />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard icon={FiMap} label="Total Trips" value={summary.totalTrips} />
          <StatCard
            icon={FiTruck}
            label="Completed Trips"
            value={summary.completedTrips}
          />
          <StatCard
            icon={FiTrendingUp}
            label="Distance Covered"
            value={`${summary.totalDistanceKm.toLocaleString("en-IN")} km`}
          />
          <StatCard
            icon={FiDroplet}
            label="Fuel Cost"
            value={formatCurrency(summary.totalFuelCost)}
          />
          <StatCard
            icon={FiTool}
            label="Maintenance Cost"
            value={formatCurrency(summary.totalMaintenanceCost)}
          />
          <StatCard
            icon={FiCreditCard}
            label="Expense Cost"
            value={formatCurrency(summary.totalExpenseCost)}
          />
          <StatCard
            icon={FiTrendingUp}
            label="Operational Cost"
            value={formatCurrency(summary.totalOperationalCost)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Trip Status Distribution" subtitle="Selected range">
          {loadingSummary ? (
            <TableSkeleton />
          ) : tripStatusData.every((d) => d.count === 0) ? (
            <EmptyState message="No trips in this range" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={tripStatusData}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {tripStatusData.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={`var(--color-status-${STATUS_TONE[entry.status] || "retired"})`}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Monthly Operational Cost" subtitle="Fuel + Maintenance">
          {loadingCharts ? (
            <TableSkeleton />
          ) : monthlyTrend.length === 0 ? (
            <EmptyState message="No cost data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" />
                <XAxis dataKey="month" stroke="var(--color-ink-faint)" />
                <YAxis stroke="var(--color-ink-faint)" />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar
                  dataKey="fuel"
                  name="Fuel"
                  stackId="cost"
                  fill="var(--color-signal)"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="maintenance"
                  name="Maintenance"
                  stackId="cost"
                  fill="var(--color-console)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Cost by Vehicle" subtitle="Fuel + Maintenance + Expenses">
        {loadingTable ? (
          <TableSkeleton />
        ) : costByVehicle.length === 0 ? (
          <EmptyState message="No vehicle cost data yet" />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={costByVehicle} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" />
              <XAxis type="number" stroke="var(--color-ink-faint)" />
              <YAxis
                type="category"
                dataKey="vehicleLabel"
                width={180}
                stroke="var(--color-ink-faint)"
              />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="fuelCost" name="Fuel" stackId="cost" fill="var(--color-signal)" />
              <Bar
                dataKey="maintenanceCost"
                name="Maintenance"
                stackId="cost"
                fill="var(--color-console)"
              />
              <Bar
                dataKey="expenseCost"
                name="Expenses"
                stackId="cost"
                fill="var(--color-status-danger)"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <DataTable
        columns={columns}
        rows={sortedVehicleRows}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
        loading={loadingTable}
        emptyState={<EmptyState message="No vehicle cost data yet" />}
      />
    </div>
  );
}
