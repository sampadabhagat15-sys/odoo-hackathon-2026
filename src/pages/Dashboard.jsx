import { useEffect, useState } from "react";
import {
  FiTruck, FiCheckCircle, FiTool, FiMap, FiClock, FiUsers, FiPercent,
} from "react-icons/fi";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import StatCard from "../components/ui/StatCard";
import ChartCard from "../components/ui/ChartCard";
import FilterDropdown from "../components/ui/FilterDropdown";
import { CardSkeleton } from "../components/ui/Loader";
import dashboardService from "../services/dashboard";

const VEHICLE_TYPE_OPTIONS = [
  { value: "all", label: "All vehicle types" },
  { value: "truck", label: "Truck" },
  { value: "van", label: "Van" },
  { value: "trailer", label: "Trailer" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "available", label: "Available" },
  { value: "on_trip", label: "On Trip" },
  { value: "in_shop", label: "In Shop" },
  { value: "retired", label: "Retired" },
];

const REGION_OPTIONS = [
  { value: "all", label: "All regions" },
  { value: "north", label: "North" },
  { value: "south", label: "South" },
  { value: "east", label: "East" },
  { value: "west", label: "West" },
];

const PIE_COLORS = {
  Available: "var(--color-status-available)",
  "On Trip": "var(--color-status-ontrip)",
  "In Shop": "var(--color-status-shop)",
  Retired: "var(--color-status-retired)",
};

const currency = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function Dashboard() {
  const [filters, setFilters] = useState({ vehicleType: "all", status: "all", region: "all" });
  const [kpis, setKpis] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([dashboardService.getKpis(filters), dashboardService.getCharts(filters)]).then(
      ([kpiData, chartData]) => {
        if (cancelled) return;
        setKpis(kpiData);
        setCharts(chartData);
        setLoading(false);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const updateFilter = (key) => (value) => setFilters((f) => ({ ...f, [key]: value }));

  const KPI_CARDS = kpis
    ? [
        { label: "Active Vehicles", value: kpis.activeVehicles, icon: FiTruck },
        { label: "Available Vehicles", value: kpis.availableVehicles, icon: FiCheckCircle },
        { label: "Vehicles in Maintenance", value: kpis.vehiclesInMaintenance, icon: FiTool },
        { label: "Active Trips", value: kpis.activeTrips, icon: FiMap },
        { label: "Pending Trips", value: kpis.pendingTrips, icon: FiClock },
        { label: "Drivers On Duty", value: kpis.driversOnDuty, icon: FiUsers },
        { label: "Fleet Utilization", value: `${kpis.fleetUtilization}%`, icon: FiPercent, accent: true },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        <FilterDropdown label="Type" options={VEHICLE_TYPE_OPTIONS} value={filters.vehicleType} onChange={updateFilter("vehicleType")} />
        <FilterDropdown label="Status" options={STATUS_OPTIONS} value={filters.status} onChange={updateFilter("status")} />
        <FilterDropdown label="Region" options={REGION_OPTIONS} value={filters.region} onChange={updateFilter("region")} />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {loading
          ? Array.from({ length: 7 }).map((_, i) => <CardSkeleton key={i} />)
          : KPI_CARDS.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Trips Over Time" subtitle="Last 7 days">
          {loading || !charts ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--color-ink-faint)]">Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.tripsOverTime} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="tripsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-signal)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-signal)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "var(--color-ink-faint)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "var(--color-ink-faint)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} />
                <Area type="monotone" dataKey="trips" stroke="var(--color-signal-dim)" strokeWidth={2} fill="url(#tripsFill)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Fuel Cost" subtitle="Monthly spend (₹)">
          {loading || !charts ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--color-ink-faint)]">Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.fuelCost} margin={{ left: -10, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--color-ink-faint)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "var(--color-ink-faint)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip formatter={(v) => currency(v)} contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} />
                <Bar dataKey="cost" fill="var(--color-status-ontrip)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Vehicle Status Distribution" subtitle="Current fleet snapshot">
          {loading || !charts ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--color-ink-faint)]">Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.vehicleStatusDistribution}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {charts.vehicleStatusDistribution.map((entry) => (
                    <Cell key={entry.status} fill={PIE_COLORS[entry.status] || "var(--color-ink-faint)"} />
                  ))}
                </Pie>
                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, color: "var(--color-ink-soft)" }}
                />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Operational Cost" subtitle="Fuel + Maintenance, monthly (₹)">
          {loading || !charts ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--color-ink-faint)]">Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.operationalCost} margin={{ left: -10, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--color-ink-faint)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "var(--color-ink-faint)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip formatter={(v) => currency(v)} contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="fuel" stackId="cost" name="Fuel" fill="var(--color-status-ontrip)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="maintenance" stackId="cost" name="Maintenance" fill="var(--color-signal)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
