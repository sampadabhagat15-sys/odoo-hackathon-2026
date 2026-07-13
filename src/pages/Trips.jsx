import { useEffect, useMemo, useState } from "react";
import { FiMap, FiPlus, FiCheck, FiFlag, FiX } from "react-icons/fi";
import DataTable from "../components/ui/DataTable";
import SearchBar from "../components/ui/SearchBar";
import FilterDropdown from "../components/ui/FilterDropdown";
import Pagination from "../components/ui/Pagination";
import Button from "../components/ui/Button";
import StatusBadge from "../components/ui/StatusBadge";
import EmptyState from "../components/ui/EmptyState";
import ConfirmationDialog from "../components/ui/ConfirmationDialog";
import TripFormModal from "../components/trips/TripFormModal";
import CompleteTripModal from "../components/trips/CompleteTripModal";
import { useToast } from "../context/ToastContext";
import { TRIP_STATUS } from "../constants/status";
import { getTrips, createTrip, dispatchTrip, completeTrip, cancelTrip } from "../services/trip";

const PAGE_SIZE = 8;

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  ...Object.values(TRIP_STATUS).map((s) => ({ value: s, label: s })),
];

// Anyone who reaches this page already has trip-management access —
// gated at the route level via ROUTE_ACCESS.trips in constants/roles.js
// (dispatcher/fleet_manager/admin only). No further role-based hiding
// needed here.
export default function Trips() {
  const toast = useToast();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const [completeTarget, setCompleteTarget] = useState(null);
  const [completing, setCompleting] = useState(false);

  const [dispatchingId, setDispatchingId] = useState(null);

  async function loadTrips() {
    setLoading(true);
    try {
      const data = await getTrips();
      setTrips(data);
    } catch {
      toast.error("Couldn't load trips. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();

    let rows = trips.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (!q) return true;
      return (
        t.origin.toLowerCase().includes(q) ||
        t.destination.toLowerCase().includes(q) ||
        t.vehicleLabel.toLowerCase().includes(q) ||
        t.driverLabel.toLowerCase().includes(q)
      );
    });

    rows = [...rows].sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      if (av === bv) return 0;
      const result = av > bv ? 1 : -1;
      return sortDir === "asc" ? result : -result;
    });

    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trips, search, statusFilter, sortBy, sortDir]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredSorted.slice(start, start + PAGE_SIZE);
  }, [filteredSorted, page]);

  function handleSort(key) {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  }

  function openCreate() {
    setModalOpen(true);
  }

  async function handleSubmit(values) {
    setSubmitting(true);
    try {
      const created = await createTrip(values);
      toast.success(`Trip to ${created.destination} created as Draft.`);
      setModalOpen(false);
      await loadTrips();
    } catch {
      toast.error("Couldn't create the trip. Please check the details and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDispatch(trip) {
    setDispatchingId(trip.id);
    try {
      await dispatchTrip(trip.id);
      toast.success("Trip dispatched.");
      await loadTrips();
    } catch (err) {
      // Backend returns a specific reason (vehicle/driver unavailable,
      // expired license, etc.) — surface it instead of a generic message.
      toast.error(err?.response?.data?.message || "Couldn't dispatch the trip.");
    } finally {
      setDispatchingId(null);
    }
  }

  async function handleComplete(values) {
    if (!completeTarget) return;
    setCompleting(true);
    try {
      await completeTrip(completeTarget.id, values);
      toast.success("Trip completed.");
      setCompleteTarget(null);
      await loadTrips();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Couldn't complete the trip.");
    } finally {
      setCompleting(false);
    }
  }

  async function handleCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await cancelTrip(cancelTarget.id);
      toast.success("Trip cancelled.");
      setCancelTarget(null);
      await loadTrips();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Couldn't cancel the trip.");
    } finally {
      setCancelling(false);
    }
  }

  const columns = [
    {
      key: "id",
      label: "Trip",
      render: (r) => <span className="font-[family-name:var(--font-mono)] text-xs font-medium">#{r.id.slice(0, 8)}</span>,
    },
    {
      key: "origin",
      label: "Route",
      sortable: true,
      render: (r) => (
        <span className="text-[var(--color-ink)]">
          {r.origin} <span className="text-[var(--color-ink-faint)]">→</span> {r.destination}
        </span>
      ),
    },
    { key: "vehicleLabel", label: "Vehicle", render: (r) => r.vehicleLabel },
    { key: "driverLabel", label: "Driver", render: (r) => r.driverLabel },
    { key: "distanceKm", label: "Distance", align: "right", sortable: true, render: (r) => `${r.distanceKm} km` },
    { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          {r.status === TRIP_STATUS.DRAFT && (
            <button
              onClick={() => handleDispatch(r)}
              disabled={dispatchingId === r.id}
              aria-label="Dispatch trip"
              title="Dispatch"
              className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-ink-faint)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-ink)] disabled:opacity-50"
            >
              <FiFlag className="h-3.5 w-3.5" />
            </button>
          )}
          {r.status === TRIP_STATUS.DISPATCHED && (
            <button
              onClick={() => setCompleteTarget(r)}
              aria-label="Complete trip"
              title="Complete"
              className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-ink-faint)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-ink)]"
            >
              <FiCheck className="h-3.5 w-3.5" />
            </button>
          )}
          {(r.status === TRIP_STATUS.DRAFT || r.status === TRIP_STATUS.DISPATCHED) && (
            <button
              onClick={() => setCancelTarget(r)}
              aria-label="Cancel trip"
              title="Cancel"
              className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-ink-faint)] hover:bg-[var(--color-status-danger-soft)] hover:text-[var(--color-status-danger)]"
            >
              <FiX className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by route, vehicle, driver…" />
          <FilterDropdown label="Status" options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
        </div>
        <Button variant="signal" size="md" icon={FiPlus} onClick={openCreate}>
          Schedule trip
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={paged}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
        loading={loading}
        emptyState={
          <EmptyState
            icon={FiMap}
            title="No trips found"
            description="Try adjusting your search or filters, or schedule a new trip."
            action={
              <Button variant="signal" size="sm" icon={FiPlus} onClick={openCreate}>
                Schedule trip
              </Button>
            }
          />
        }
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={filteredSorted.length} onPageChange={setPage} />

      <TripFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      <CompleteTripModal
        open={!!completeTarget}
        onClose={() => setCompleteTarget(null)}
        onSubmit={handleComplete}
        trip={completeTarget}
        submitting={completing}
      />

      <ConfirmationDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Cancel this trip?"
        description={cancelTarget ? `${cancelTarget.origin} → ${cancelTarget.destination} will be cancelled.` : ""}
        confirmLabel="Cancel trip"
        loading={cancelling}
      />
    </div>
  );
}
