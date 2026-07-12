import { useEffect, useState, useCallback } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiTruck } from "react-icons/fi";
import DataTable from "../components/ui/DataTable";
import SearchBar from "../components/ui/SearchBar";
import FilterDropdown from "../components/ui/FilterDropdown";
import Pagination from "../components/ui/Pagination";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";
import StatusBadge from "../components/ui/StatusBadge";
import ConfirmationDialog from "../components/ui/ConfirmationDialog";
import VehicleFormModal from "../components/vehicles/VehicleFormModal";
import { useToast } from "../context/ToastContext";
import { VEHICLE_TYPES } from "../constants/vehicle";
import { VEHICLE_STATUS } from "../constants/status";
import vehicleService from "../services/vehicle";

const STATUS_OPTIONS = [{ value: "all", label: "All statuses" }, ...Object.values(VEHICLE_STATUS).map((s) => ({ value: s, label: s }))];
const TYPE_OPTIONS = [{ value: "all", label: "All types" }, ...VEHICLE_TYPES.map((t) => ({ value: t, label: t }))];

const currency = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const PAGE_SIZE = 8;

export default function VehicleRegistry() {
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [sortBy, setSortBy] = useState("registrationNumber");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);

  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    const result = await vehicleService.getAll({ search, status, type, sortBy, sortDir, page, pageSize: PAGE_SIZE });
    setData(result);
    setLoading(false);
  }, [search, status, type, sortBy, sortDir, page]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Reset to page 1 whenever a filter changes underneath the user.
  useEffect(() => setPage(1), [search, status, type]);

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const openCreate = () => {
    setEditingVehicle(null);
    setFormOpen(true);
  };

  const openEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormOpen(true);
  };

  const handleFormSubmit = async (values) => {
    setSubmitting(true);
    try {
      if (editingVehicle) {
        await vehicleService.update(editingVehicle.id, values);
        toast.success(`${values.registrationNumber} updated.`);
      } else {
        await vehicleService.create(values);
        toast.success(`${values.registrationNumber} registered.`);
      }
      setFormOpen(false);
      fetchVehicles();
    } catch (err) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await vehicleService.remove(deleteTarget.id);
      toast.success(`${deleteTarget.registrationNumber} removed from the registry.`);
      setDeleteTarget(null);
      fetchVehicles();
    } catch (err) {
      toast.error(err.message || "Couldn't remove this vehicle.");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "registrationNumber",
      label: "Reg. Number",
      sortable: true,
      render: (v) => <span className="font-[family-name:var(--font-mono)] text-[13px] font-medium">{v.registrationNumber}</span>,
    },
    { key: "name", label: "Name / Model", sortable: true },
    { key: "type", label: "Type", sortable: true },
    {
      key: "maxLoadCapacityKg",
      label: "Max Load",
      sortable: true,
      align: "right",
      render: (v) => `${v.maxLoadCapacityKg.toLocaleString("en-IN")} kg`,
    },
    {
      key: "odometerKm",
      label: "Odometer",
      sortable: true,
      align: "right",
      render: (v) => `${v.odometerKm.toLocaleString("en-IN")} km`,
    },
    {
      key: "acquisitionCost",
      label: "Acquisition Cost",
      sortable: true,
      align: "right",
      render: (v) => currency(v.acquisitionCost),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (v) => <StatusBadge value={v.status} />,
    },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (v) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => openEdit(v)}
            aria-label={`Edit ${v.registrationNumber}`}
            className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-ink-faint)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-ink)]"
          >
            <FiEdit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDeleteTarget(v)}
            aria-label={`Remove ${v.registrationNumber}`}
            className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-ink-faint)] hover:bg-[var(--color-status-danger-soft)] hover:text-[var(--color-status-danger)]"
          >
            <FiTrash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by reg. number or name…" />
          <FilterDropdown label="Status" options={STATUS_OPTIONS} value={status} onChange={setStatus} />
          <FilterDropdown label="Type" options={TYPE_OPTIONS} value={type} onChange={setType} />
        </div>
        <Button variant="signal" icon={FiPlus} onClick={openCreate}>
          Register vehicle
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={data.items}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
        loading={loading}
        emptyState={
          <EmptyState
            icon={FiTruck}
            title="No vehicles match your filters"
            description="Try a different search term or clear the filters above."
          />
        }
      />

      {!loading && data.total > 0 && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />
      )}

      <VehicleFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        vehicle={editingVehicle}
        submitting={submitting}
      />

      <ConfirmationDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove this vehicle?"
        description={
          deleteTarget
            ? `${deleteTarget.registrationNumber} (${deleteTarget.name}) will be permanently removed from the registry. This can't be undone.`
            : ""
        }
        confirmLabel="Remove vehicle"
        loading={deleting}
      />
    </div>
  );
}
