import { useEffect, useMemo, useState } from "react";
import { FiTool, FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
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
import { MAINTENANCE_TYPES } from "../constants/maintenance";
import { formatDate } from "../utils/date";
import {
  getMaintenanceRecords,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
} from "../services/maintenance";

const PAGE_SIZE = 8;

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  ...Object.values(MAINTENANCE_STATUS).map((s) => ({ value: s, label: s })),
];

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  ...MAINTENANCE_TYPES.map((t) => ({ value: t, label: t })),
];

export default function Maintenance() {
  const toast = useToast();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("scheduledDate");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
  }, [search, statusFilter, typeFilter]);

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();

    let rows = records.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (!q) return true;
      return (
        r.workOrderCode.toLowerCase().includes(q) ||
        r.vehicleLabel.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.serviceCenter.toLowerCase().includes(q)
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
  }, [records, search, statusFilter, typeFilter, sortBy, sortDir]);

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
    setEditingRecord(null);
    setModalOpen(true);
  }

  function openEdit(record) {
    setEditingRecord(record);
    setModalOpen(true);
  }

  async function handleSubmit(values) {
    setSubmitting(true);
    try {
      if (editingRecord) {
        await updateMaintenanceRecord(editingRecord.id, values);
        toast.success(`${editingRecord.workOrderCode} updated.`);
      } else {
        const created = await createMaintenanceRecord(values);
        toast.success(`${created.workOrderCode} created.`);
      }
      setModalOpen(false);
      await loadRecords();
    } catch {
      toast.error("Couldn't save the work order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMaintenanceRecord(deleteTarget.id);
      toast.success(`${deleteTarget.workOrderCode} removed.`);
      setDeleteTarget(null);
      await loadRecords();
    } catch {
      toast.error("Couldn't remove the work order. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    { key: "workOrderCode", label: "Work Order", sortable: true, render: (r) => <span className="font-[family-name:var(--font-mono)] text-xs font-medium">{r.workOrderCode}</span> },
    { key: "vehicleLabel", label: "Vehicle", render: (r) => r.vehicleLabel },
    { key: "type", label: "Type", sortable: true },
    { key: "scheduledDate", label: "Scheduled", sortable: true, render: (r) => formatDate(r.scheduledDate) },
    { key: "completedDate", label: "Completed", sortable: true, render: (r) => formatDate(r.completedDate) },
    { key: "cost", label: "Cost", align: "right", sortable: true, render: (r) => `₹${r.cost.toLocaleString("en-IN")}` },
    { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <button
            onClick={() => openEdit(r)}
            aria-label={`Edit ${r.workOrderCode}`}
            className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-ink-faint)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-ink)]"
          >
            <FiEdit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDeleteTarget(r)}
            aria-label={`Delete ${r.workOrderCode}`}
            className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-ink-faint)] hover:bg-[var(--color-status-danger-soft)] hover:text-[var(--color-status-danger)]"
          >
            <FiTrash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by work order, vehicle, description…" />
          <FilterDropdown label="Status" options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
          <FilterDropdown label="Type" options={TYPE_OPTIONS} value={typeFilter} onChange={setTypeFilter} />
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
        record={editingRecord}
        submitting={submitting}
      />

      <ConfirmationDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove this work order?"
        description={deleteTarget ? `${deleteTarget.workOrderCode} (${deleteTarget.type}) will be permanently removed.` : ""}
        confirmLabel="Remove work order"
        loading={deleting}
      />
    </div>
  );
}
