import { useEffect, useMemo, useState } from "react";
import { FiMap, FiPlus, FiSend, FiCheckCircle, FiXCircle } from "react-icons/fi";
import DataTable from "../components/ui/DataTable";
import SearchBar from "../components/ui/SearchBar";
import FilterDropdown from "../components/ui/FilterDropdown";
import Pagination from "../components/ui/Pagination";
import Button from "../components/ui/Button";
import StatusBadge from "../components/ui/StatusBadge";
import EmptyState from "../components/ui/EmptyState";
import TripFormModal from "../components/trips/TripFormModal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ROLES } from "../constants/roles";
import { TRIP_STATUS } from "../constants/status";
import { getTrips, createTrip, dispatchTrip, completeTrip, cancelTrip } from "../services/trip";

const PAGE_SIZE = 8;

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  ...Object.values(TRIP_STATUS).map((s) => ({ value: s, label: s })),
];

export default function Trips() {
  const { user } = useAuth();
  const toast = useToast();
  const isDispatcher = user?.role === ROLES.DISPATCHER;

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("distanceKm");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actioningId, setActioningId] = useState(null);

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
      if (isDispatcher && t.driverId !== user?.id) return false;
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
  }, [trips, search, statusFilter, sortBy, sortDir, isDispatcher, user?.id]);

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

  async function handleSubmit(values) {
    setSubmitting(true);
    try {
      await createTrip(values);
      toast.success("Trip scheduled.");
      setModalOpen(false);
      await loadTrips();
    } catch {
      toast.error("Couldn't schedule the trip. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDispatch(trip) {
    setActioningId(trip.id);
    try {
      await dispatchTrip(trip.id);
      toast.success("Trip dispatched.");
      await loadTrips();
    } catch {
      toast.error("Couldn't dispatch the trip.");
    } finally {
      setActioningId(null);
    }
  }

  async function handleComplete(trip) {
    // TODO: replace with a small modal collecting these two fields instead
    // of prompt() once there's time to build one.
    const finalOdometer = window.prompt("Final odometer reading (km)?");
    if (finalOdometer === null) return;
    const fuelConsumed = window.prompt("Fuel consumed (liters)?");
    if (fuelConsumed === null) return;

    setActioningId(trip.id);
    try {
      await completeTrip(trip.id, {
        finalOdometer: Number(finalOdometer),
        fuelConsumedLiters: Number(fuelConsumed),
      });
      toast.success("Trip marked complete.");
      await loadTrips();
    } catch {
      toast.error("Couldn't complete the trip.");
    } finally {
      setActioningId(null);
    }
  }

  async function handleCancel(trip) {
    setActioningId(trip.id);
    try {
      await cancelTrip(trip.id);
      toast.success("Trip cancelled.");
      await loadTrips();
    } catch {
      toast.error("Couldn't cancel the trip.");
    } finally {
      setActioningId(null);
    }
  }

  const columns = [
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
    { key: "cargoWeightKg", label: "Cargo", align: "right", sortable: true, render: (r) => `${r.cargoWeightKg} kg` },
    { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
    ...(isDispatcher
      ? []
      : [
          {
            key: "actions",
            label: "",
            align: "right",
            render: (r) => (
              <div className="flex justify-end gap-1.5">
                {r.status === TRIP_STATUS.DRAFT && (
                  <button
                    onClick={() => handleDispatch(r)}
                    disabled={actioningId === r.id}
                    aria-label="Dispatch trip"
                    title="Dispatch"
                    className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-ink-faint)] hover:bg-[var(--color-status-ontrip-soft)] hover:text-[var(--color-status-ontrip)] disabled:opacity-40"
                  >
                    <FiSend className="h-3.5 w-3.5" />
                  </button>
                )}
                {r.status === TRIP_STATUS.DISPATCHED && (
                  <>
                    <button
                      onClick={() => handleComplete(r)}
                      disabled={actioningId === r.id}
                      aria-label="Complete trip"
                      title="Mark complete"
                      className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-ink-faint)] hover:bg-[var(--color-status-available-soft)] hover:text-[var(--color-status-available)] disabled:opacity-40"
                    >
                      <FiCheckCircle className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleCancel(r)}
                      disabled={actioningId === r.id}
                      aria-label="Cancel trip"
                      title="Cancel"
                      className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-ink-faint)] hover:bg-[var(--color-status-danger-soft)] hover:text-[var(--color-status-danger)] disabled:opacity-40"
                    >
                      <FiXCircle className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            ),
          },
        ]),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by route, vehicle, driver…" />
          <FilterDropdown label="Status" options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
        </div>
        {!isDispatcher && (
          <Button variant="signal" size="md" icon={FiPlus} onClick={() => setModalOpen(true)}>
            Schedule trip
          </Button>
        )}
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
            description={
              isDispatcher
                ? "You don't have any trips matching these filters."
                : "Try adjusting your search or filters, or schedule a new trip."
            }
            action={
              !isDispatcher && (
                <Button variant="signal" size="sm" icon={FiPlus} onClick={() => setModalOpen(true)}>
                  Schedule trip
                </Button>
              )
            }
          />
        }
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={filteredSorted.length} onPageChange={setPage} />

      {!isDispatcher && (
        <TripFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}
    </div>
  );
}
