import { useEffect, useMemo, useState } from "react";
import { FiTool, FiPlus, FiCheck } from "react-icons/fi";
import DataTable from "../components/ui/DataTable";
import SearchBar from "../components/ui/SearchBar";
import FilterDropdown from "../components/ui/FilterDropdown";
import Pagination from "../components/ui/Pagination";
import Button from "../components/ui/Button";
import StatusBadge from "../components/ui/StatusBadge";
import EmptyState from "../components/ui/EmptyState";
import ConfirmationDialog from "../components/ui/ConfirmationDialog";
import MaintenanceFormModal from "../components/maintenance/MaintenanceFormModal";
import { useToast } from "../context/ToastContext";
import { MAINTENANCE_STATUS } from "../constants/status";
import { formatDate } from "../utils/date";
import {
  getMaintenanceRecords,
  createMaintenanceRecord,
  closeMaintenanceRecord,
} from "../services/maintenance";

const PAGE_SIZE = 8;

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  ...Object.values(MAINTENANCE_STATUS).map((s) => ({ value: s, label: s })),
];

export default function Maintenance() {
  const toast = useToast();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("startDate");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [closeTarget, setCloseTarget] = useState(null);
  const [closing, setClosing] = useState(false);

  async function loadRecords() {
    setLoading(true);
    try {
      const data = await getMaintenanceRecords();
      setRecords(data);
    } catch {
      toast.error("Couldn't load maintenance records. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = records.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.vehicleLabel.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    });
    rows = [...rows].sort((a, b) => {
      const av = a[sortBy] ?? "";
      const bv = b[sortBy] ?? "";
      if (av === bv) return 0;
      const result = av > bv ? 1 : -1;
      return sortDir === "asc" ? result : -result;
    });
    return rows;
  }, [records, search, statusFilter, sortBy, sortDir]);

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
      await createMaintenanceRecord(values);
      toast.success("Work order created — vehicle moved to In Shop.");
      setModalOpen(false);
      await loadRecords();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Couldn't create the work order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClose() {
    if (!closeTarget) return;
    setClosing(true);
    try {
      await closeMaintenanceRecord(closeTarget.id);
      toast.success("Work order closed — vehicle back to Available.");
      setCloseTarget(null);
      await loadRecords();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Couldn't close the work order.");
    } finally {
      setClosing(false);
    }
  }

  const columns = [
    {
      key: "id",
      label: "Work Order",
      render: (r) => <span className="font-[family-name:var(--font-mono)] text-xs font-medium">#{r.id.slice(0, 8)}</span>,
    },
    { key: "vehicleLabel", label: "Vehicle", render: (r) => r.vehicleLabel },
    { key: "description", label: "Description", render: (r) => <span className="line-clamp-1">{r.description}</span> },
    { key: "startDate", label: "Started", sortable: true, render: (r) => formatDate(r.startDate) },
    { key: "endDate", label: "Closed", sortable: true, render: (r) => (r.endDate ? formatDate(r.endDate) : "—") },
    { key: "cost", label: "Cost", align: "right", sortable: true, render: (r) => `₹${r.cost.toLocaleString("en-IN")}` },
    { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (r) =>
        r.status === MAINTENANCE_STATUS.ACTIVE ? (
          <div className="flex justify-end">
            <button
              onClick={() => setCloseTarget(r)}
              aria-label="Close work order"
              title="Close — restores vehicle to Available"
              className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-ink-faint)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-ink)]"
            >
              <FiCheck className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by vehicle or description…" />
          <FilterDropdown label="Status" options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
        </div>
        <Button variant="signal" size="md" icon={FiPlus} onClick={openCreate}>
          New work order
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
            icon={FiTool}
            title="No maintenance records found"
            description="Try adjusting your search or filters, or create a new work order."
            action={
              <Button variant="signal" size="sm" icon={FiPlus} onClick={openCreate}>
                New work order
              </Button>
            }
          />
        }
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={filteredSorted.length} onPageChange={setPage} />

      <MaintenanceFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      <ConfirmationDialog
        open={!!closeTarget}
        onClose={() => setCloseTarget(null)}
        onConfirm={handleClose}
        title="Close this work order?"
        description={closeTarget ? `${closeTarget.vehicleLabel} will move back to Available.` : ""}
        confirmLabel="Close work order"
        loading={closing}
      />
    </div>
  );
}
