import { useEffect, useMemo, useState } from "react";
import { FiMap, FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import DataTable from "../components/ui/DataTable";
import SearchBar from "../components/ui/SearchBar";
import FilterDropdown from "../components/ui/FilterDropdown";
import Pagination from "../components/ui/Pagination";
import Button from "../components/ui/Button";
import StatusBadge from "../components/ui/StatusBadge";
import EmptyState from "../components/ui/EmptyState";
import ConfirmationDialog from "../components/ui/ConfirmationDialog";
import TripFormModal from "../components/trips/TripFormModal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ROLES } from "../constants/roles";
import { TRIP_STATUS } from "../constants/status";
import { REGIONS } from "../constants/trip";
import { formatDate } from "../utils/date";
import { getTrips, createTrip, updateTrip, deleteTrip } from "../services/trip";

const PAGE_SIZE = 8;

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  ...Object.values(TRIP_STATUS).map((s) => ({ value: s, label: s })),
];

const REGION_OPTIONS = [
  { value: "all", label: "All regions" },
  ...REGIONS.map((r) => ({ value: r, label: r })),
];

export default function Trips() {
  const { user } = useAuth();
  const toast = useToast();
  const isDriver = user?.role === ROLES.DRIVER;

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [sortBy, setSortBy] = useState("departureDate");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
  }, [search, statusFilter, regionFilter]);

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();

    let rows = trips.filter((t) => {
      if (isDriver && t.driverId !== user?.id) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (regionFilter !== "all" && t.region !== regionFilter) return false;
      if (!q) return true;
      return (
        t.tripCode.toLowerCase().includes(q) ||
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
  }, [trips, search, statusFilter, regionFilter, sortBy, sortDir, isDriver, user?.id]);

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
    setEditingTrip(null);
    setModalOpen(true);
  }

  function openEdit(trip) {
    setEditingTrip(trip);
    setModalOpen(true);
  }

  async function handleSubmit(values) {
    setSubmitting(true);
    try {
      if (editingTrip) {
        await updateTrip(editingTrip.id, values);
        toast.success(`${editingTrip.tripCode} updated.`);
      } else {
        const created = await createTrip(values);
        toast.success(`${created.tripCode} scheduled.`);
      }
      setModalOpen(false);
      await loadTrips();
    } catch {
      toast.error("Couldn't save the trip. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTrip(deleteTarget.id);
      toast.success(`${deleteTarget.tripCode} removed.`);
      setDeleteTarget(null);
      await loadTrips();
    } catch {
      toast.error("Couldn't remove the trip. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    { key: "tripCode", label: "Trip", sortable: true, render: (r) => <span className="font-[family-name:var(--font-mono)] text-xs font-medium">{r.tripCode}</span> },
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
    { key: "departureDate", label: "Departure", sortable: true, render: (r) => formatDate(r.departureDate) },
    { key: "distanceKm", label: "Distance", align: "right", sortable: true, render: (r) => `${r.distanceKm} km` },
    { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
    ...(isDriver
      ? []
      : [
          {
            key: "actions",
            label: "",
            align: "right",
            render: (r) => (
              <div className="flex justify-end gap-1.5">
                <button
                  onClick={() => openEdit(r)}
                  aria-label={`Edit ${r.tripCode}`}
                  className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-ink-faint)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-ink)]"
                >
                  <FiEdit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(r)}
                  aria-label={`Delete ${r.tripCode}`}
                  className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-ink-faint)] hover:bg-[var(--color-status-danger-soft)] hover:text-[var(--color-status-danger)]"
                >
                  <FiTrash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ),
          },
        ]),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by trip, route, vehicle, driver…" />
          <FilterDropdown label="Status" options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
          <FilterDropdown label="Region" options={REGION_OPTIONS} value={regionFilter} onChange={setRegionFilter} />
        </div>
        {!isDriver && (
          <Button variant="signal" size="md" icon={FiPlus} onClick={openCreate}>
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
              isDriver
                ? "You don't have any trips matching these filters."
                : "Try adjusting your search or filters, or schedule a new trip."
            }
            action={
              !isDriver && (
                <Button variant="signal" size="sm" icon={FiPlus} onClick={openCreate}>
                  Schedule trip
                </Button>
              )
            }
          />
        }
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={filteredSorted.length} onPageChange={setPage} />

      {!isDriver && (
        <>
          <TripFormModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onSubmit={handleSubmit}
            trip={editingTrip}
            submitting={submitting}
          />

          <ConfirmationDialog
            open={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
            title="Remove this trip?"
            description={deleteTarget ? `${deleteTarget.tripCode} (${deleteTarget.origin} → ${deleteTarget.destination}) will be permanently removed.` : ""}
            confirmLabel="Remove trip"
            loading={deleting}
          />
        </>
      )}
    </div>
  );
}
