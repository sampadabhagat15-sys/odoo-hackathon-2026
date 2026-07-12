import { useEffect, useMemo, useState } from "react";
import { FiDroplet, FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import DataTable from "../components/ui/DataTable";
import SearchBar from "../components/ui/SearchBar";
import FilterDropdown from "../components/ui/FilterDropdown";
import Pagination from "../components/ui/Pagination";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import ConfirmationDialog from "../components/ui/ConfirmationDialog";
import FuelLogFormModal from "../components/fuel/FuelLogFormModal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ROLES } from "../constants/roles";
import { FUEL_TYPES } from "../constants/fuel";
import { formatDate } from "../utils/date";
import { getFuelLogs, createFuelLog, updateFuelLog, deleteFuelLog } from "../services/fuel";

const PAGE_SIZE = 8;

const FUEL_TYPE_OPTIONS = [
  { value: "all", label: "All fuel types" },
  ...FUEL_TYPES.map((t) => ({ value: t, label: t })),
];

export default function FuelLogs() {
  const { user } = useAuth();
  const toast = useToast();
  const isReadOnly = user?.role === ROLES.FINANCIAL_ANALYST;

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [fuelTypeFilter, setFuelTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("fuelDate");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function loadLogs() {
    setLoading(true);
    try {
      const data = await getFuelLogs();
      setLogs(data);
    } catch {
      toast.error("Couldn't load fuel logs. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, fuelTypeFilter]);

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();

    let rows = logs.filter((l) => {
      if (fuelTypeFilter !== "all" && l.fuelType !== fuelTypeFilter) return false;
      if (!q) return true;
      return (
        l.logCode.toLowerCase().includes(q) ||
        l.vehicleLabel.toLowerCase().includes(q) ||
        l.driverLabel.toLowerCase().includes(q) ||
        l.station.toLowerCase().includes(q)
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
  }, [logs, search, fuelTypeFilter, sortBy, sortDir]);

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
    setEditingLog(null);
    setModalOpen(true);
  }

  function openEdit(log) {
    setEditingLog(log);
    setModalOpen(true);
  }

  async function handleSubmit(values) {
    setSubmitting(true);
    try {
      if (editingLog) {
        await updateFuelLog(editingLog.id, values);
        toast.success(`${editingLog.logCode} updated.`);
      } else {
        const created = await createFuelLog(values);
        toast.success(`${created.logCode} logged.`);
      }
      setModalOpen(false);
      await loadLogs();
    } catch {
      toast.error("Couldn't save the fuel log. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteFuelLog(deleteTarget.id);
      toast.success(`${deleteTarget.logCode} removed.`);
      setDeleteTarget(null);
      await loadLogs();
    } catch {
      toast.error("Couldn't remove the fuel log. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    { key: "logCode", label: "Log", sortable: true, render: (r) => <span className="font-[family-name:var(--font-mono)] text-xs font-medium">{r.logCode}</span> },
    { key: "vehicleLabel", label: "Vehicle", render: (r) => r.vehicleLabel },
    { key: "driverLabel", label: "Driver", render: (r) => r.driverLabel },
    { key: "fuelType", label: "Fuel", sortable: true },
    { key: "quantityLiters", label: "Quantity", align: "right", sortable: true, render: (r) => `${r.quantityLiters} L` },
    { key: "costPerLiter", label: "Rate", align: "right", sortable: true, render: (r) => `₹${r.costPerLiter.toFixed(2)}` },
    { key: "totalCost", label: "Total", align: "right", sortable: true, render: (r) => `₹${r.totalCost.toLocaleString("en-IN")}` },
    { key: "fuelDate", label: "Date", sortable: true, render: (r) => formatDate(r.fuelDate) },
    ...(isReadOnly
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
                  aria-label={`Edit ${r.logCode}`}
                  className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-ink-faint)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-ink)]"
                >
                  <FiEdit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(r)}
                  aria-label={`Delete ${r.logCode}`}
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
          <SearchBar value={search} onChange={setSearch} placeholder="Search by log, vehicle, driver, station…" />
          <FilterDropdown label="Fuel" options={FUEL_TYPE_OPTIONS} value={fuelTypeFilter} onChange={setFuelTypeFilter} />
        </div>
        {!isReadOnly && (
          <Button variant="signal" size="md" icon={FiPlus} onClick={openCreate}>
            Log fuel entry
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
            icon={FiDroplet}
            title="No fuel logs found"
            description={
              isReadOnly
                ? "Try adjusting your search or filters."
                : "Try adjusting your search or filters, or log a new fuel entry."
            }
            action={
              !isReadOnly && (
                <Button variant="signal" size="sm" icon={FiPlus} onClick={openCreate}>
                  Log fuel entry
                </Button>
              )
            }
          />
        }
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={filteredSorted.length} onPageChange={setPage} />

      {!isReadOnly && (
        <>
          <FuelLogFormModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onSubmit={handleSubmit}
            log={editingLog}
            submitting={submitting}
          />

          <ConfirmationDialog
            open={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
            title="Remove this fuel log?"
            description={deleteTarget ? `${deleteTarget.logCode} (${deleteTarget.station}) will be permanently removed.` : ""}
            confirmLabel="Remove log"
            loading={deleting}
          />
        </>
      )}
    </div>
  );
}
