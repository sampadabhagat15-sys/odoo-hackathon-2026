import { useEffect, useState, useCallback } from "react";
import { FiPlus, FiEdit2, FiUserX, FiUserCheck, FiUsers, FiAlertTriangle } from "react-icons/fi";
import DataTable from "../components/ui/DataTable";
import SearchBar from "../components/ui/SearchBar";
import FilterDropdown from "../components/ui/FilterDropdown";
import Pagination from "../components/ui/Pagination";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";
import StatusBadge from "../components/ui/StatusBadge";
import ConfirmationDialog from "../components/ui/ConfirmationDialog";
import DriverFormModal from "../components/drivers/DriverFormModal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { LICENSE_CATEGORIES } from "../constants/driver";
import { ROLES } from "../constants/roles";
import { DRIVER_STATUS } from "../constants/status";
import { formatDate, isPast, isWithinDays } from "../utils/date";
import driverService from "../services/driver";

const STATUS_OPTIONS = [{ value: "all", label: "All statuses" }, ...Object.values(DRIVER_STATUS).map((s) => ({ value: s, label: s }))];
const LICENSE_OPTIONS = [{ value: "all", label: "All categories" }, ...LICENSE_CATEGORIES.map((c) => ({ value: c, label: c }))];

const PAGE_SIZE = 8;

function SafetyScore({ score }) {
  const tone =
    score >= 85 ? "text-[var(--color-status-available)]" : score >= 70 ? "text-[var(--color-status-shop)]" : "text-[var(--color-status-danger)]";
  return (
    <span className={`inline-flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-[13px] font-semibold ${tone}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {score}
    </span>
  );
}

function LicenseExpiry({ date }) {
  const expired = isPast(date);
  const soon = !expired && isWithinDays(date, 30);
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${
        expired ? "text-[var(--color-status-danger)]" : soon ? "text-[var(--color-status-shop)]" : "text-[var(--color-ink)]"
      }`}
    >
      {(expired || soon) && <FiAlertTriangle className="h-3 w-3" />}
      {formatDate(date)}
      {expired && <span className="text-[11px] font-medium">(expired)</span>}
    </span>
  );
}

export default function Drivers() {
  const { user } = useAuth();
  const toast = useToast();
  // Suspend/reactivate are compliance actions restricted to Safety
  // Officer/Admin on the backend (403 for anyone else) — hide the
  // buttons entirely for other roles rather than let them click into
  // a failed request.
  const canManageCompliance = user?.role === ROLES.SAFETY_OFFICER || user?.role === ROLES.ADMIN;

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [license, setLicense] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);

  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Kept as "deleteTarget"/"deleting" internally to minimize the diff —
  // only the user-facing labels below actually changed. This action now
  // suspends the driver (POST /drivers/{id}/suspend), not a real delete —
  // see the note in services/driver.js.
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [reactivatingId, setReactivatingId] = useState(null);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    const result = await driverService.getAll({ search, status, license, sortBy, sortDir, page, pageSize: PAGE_SIZE });
    setData(result);
    setLoading(false);
  }, [search, status, license, sortBy, sortDir, page]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  useEffect(() => setPage(1), [search, status, license]);

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const openCreate = () => {
    setEditingDriver(null);
    setFormOpen(true);
  };

  const openEdit = (driver) => {
    setEditingDriver(driver);
    setFormOpen(true);
  };

  const handleFormSubmit = async (values) => {
    setSubmitting(true);
    try {
      if (editingDriver) {
        await driverService.update(editingDriver.id, values);
        toast.success(`${values.name}'s profile updated.`);
      } else {
        await driverService.create(values);
        toast.success(`${values.name} added to the roster.`);
      }
      setFormOpen(false);
      fetchDrivers();
    } catch (err) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await driverService.remove(deleteTarget.id);
      toast.success(`${deleteTarget.name} has been suspended.`);
      setDeleteTarget(null);
      fetchDrivers();
    } catch (err) {
      toast.error(err.message || "Couldn't suspend this driver.");
    } finally {
      setDeleting(false);
    }
  };

  // No confirmation dialog here — reactivating isn't destructive, so a
  // direct action (with a per-row loading state) is enough friction.
  const handleReactivate = async (driver) => {
    setReactivatingId(driver.id);
    try {
      await driverService.reactivate(driver.id);
      toast.success(`${driver.name} has been reactivated.`);
      fetchDrivers();
    } catch (err) {
      toast.error(err.message || "Couldn't reactivate this driver.");
    } finally {
      setReactivatingId(null);
    }
  };

  const columns = [
    { key: "name", label: "Name", sortable: true },
    {
      key: "licenseNumber",
      label: "License No.",
      sortable: true,
      render: (d) => <span className="font-[family-name:var(--font-mono)] text-[13px]">{d.licenseNumber}</span>,
    },
    { key: "licenseCategory", label: "Category", sortable: true },
    {
      key: "licenseExpiry",
      label: "License Expiry",
      sortable: true,
      render: (d) => <LicenseExpiry date={d.licenseExpiry} />,
    },
    { key: "contactNumber", label: "Contact" },
    {
      key: "safetyScore",
      label: "Safety Score",
      sortable: true,
      align: "right",
      render: (d) => <SafetyScore score={d.safetyScore} />,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (d) => <StatusBadge value={d.status} />,
    },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (d) => {
        const alreadySuspended = d.status === DRIVER_STATUS.SUSPENDED;

        if (alreadySuspended) {
          return (
            <div className="flex items-center justify-end gap-1">
              {canManageCompliance && (
                <button
                  onClick={() => handleReactivate(d)}
                  disabled={reactivatingId === d.id}
                  aria-label={`Reactivate ${d.name}`}
                  title="Reactivate"
                  className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-ink-faint)] hover:bg-[var(--color-status-available-soft)] hover:text-[var(--color-status-available)] disabled:opacity-50"
                >
                  <FiUserCheck className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        }

        return (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => openEdit(d)}
              aria-label={`Edit ${d.name}`}
              className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-ink-faint)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-ink)]"
            >
              <FiEdit2 className="h-3.5 w-3.5" />
            </button>
            {canManageCompliance && (
              <button
                onClick={() => setDeleteTarget(d)}
                aria-label={`Suspend ${d.name}`}
                title="Suspend"
                className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-ink-faint)] hover:bg-[var(--color-status-danger-soft)] hover:text-[var(--color-status-danger)]"
              >
                <FiUserX className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name or license number…" />
          <FilterDropdown label="Status" options={STATUS_OPTIONS} value={status} onChange={setStatus} />
          <FilterDropdown label="Category" options={LICENSE_OPTIONS} value={license} onChange={setLicense} />
        </div>
        <Button variant="signal" icon={FiPlus} onClick={openCreate}>
          Add driver
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
            icon={FiUsers}
            title="No drivers match your filters"
            description="Try a different search term or clear the filters above."
          />
        }
      />

      {!loading && data.total > 0 && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />
      )}

      <DriverFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        driver={editingDriver}
        submitting={submitting}
      />

      <ConfirmationDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Suspend this driver?"
        description={
          deleteTarget
            ? `${deleteTarget.name} (${deleteTarget.licenseNumber}) will be marked Suspended and won't be assignable to trips until reactivated. Their record stays in the roster.`
            : ""
        }
        confirmLabel="Suspend driver"
        loading={deleting}
      />
    </div>
  );
}
