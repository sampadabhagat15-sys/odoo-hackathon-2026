// pages/Expenses.jsx
import { useEffect, useMemo, useState } from "react";
import { FiPlus, FiCheck, FiX, FiEdit2, FiTrash2 } from "react-icons/fi";
import DataTable from "../components/ui/DataTable";
import Pagination from "../components/ui/Pagination";
import SearchBar from "../components/ui/SearchBar";
import FilterDropdown from "../components/ui/FilterDropdown";
import Button from "../components/ui/Button";
import StatusBadge from "../components/ui/StatusBadge";
import EmptyState from "../components/ui/EmptyState";
import ConfirmationDialog from "../components/ui/ConfirmationDialog";
import ExpenseFormModal from "../components/expenses/ExpenseFormModal";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  reviewExpense,
} from "../services/expense";
import vehicleService from "../services/vehicle";
import { EXPENSE_CATEGORIES } from "../constants/expense";
import { EXPENSE_STATUS } from "../constants/status";
import { formatDate } from "../utils/date";

const EXPENSE_STATUS_VALUES = Object.values(EXPENSE_STATUS);

const PAGE_SIZE = 10;

// Roles allowed to approve/reject — mirrors "Financial Analyst reviews expenses"
// from the brief. Fleet Manager kept as operational super-role.
const REVIEWER_ROLES = ["financial_analyst", "fleet_manager"];

export default function Expenses() {
  const { user } = useAuth();
  const toast = useToast();

  const [data, setData] = useState([]);
  const [vehicleMap, setVehicleMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const canReview = REVIEWER_ROLES.includes(user?.role);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [expenses, vehicleResult] = await Promise.all([
      getExpenses(),
      vehicleService.getAll({ pageSize: 1000 }),
    ]);
    setData(expenses);
    setVehicleMap(Object.fromEntries(vehicleResult.items.map((v) => [v.id, v])));
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let rows = [...data];

    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((e) => {
        const vehicle = vehicleMap[e.vehicleId];
        return (
          e.description.toLowerCase().includes(q) ||
          vehicle?.registrationNumber?.toLowerCase().includes(q)
        );
      });
    }
    if (categoryFilter) rows = rows.filter((e) => e.category === categoryFilter);
    if (statusFilter) rows = rows.filter((e) => e.status === statusFilter);

    rows.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (a[sortBy] < b[sortBy]) return -1 * dir;
      if (a[sortBy] > b[sortBy]) return 1 * dir;
      return 0;
    });

    return rows;
  }, [data, vehicleMap, search, categoryFilter, statusFilter, sortBy, sortDir]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(key) {
    if (sortBy === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  }

  function openCreate() {
    setEditingExpense(null);
    setModalOpen(true);
  }

  function openEdit(expense) {
    setEditingExpense(expense);
    setModalOpen(true);
  }

  async function handleSubmit(values) {
    setSubmitting(true);
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, values);
        toast.success("Expense updated");
      } else {
        await createExpense({ ...values, submittedBy: user?.email });
        toast.success("Expense logged");
      }
      setModalOpen(false);
      load();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReview(expense, status) {
    try {
      await reviewExpense(expense.id, status, user?.email);
      toast.success(status === EXPENSE_STATUS.APPROVED ? "Expense approved" : "Expense rejected");
      load();
    } catch {
      toast.error("Could not update expense status");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteExpense(deleteTarget.id);
      toast.success("Expense deleted");
      setDeleteTarget(null);
      load();
    } catch {
      toast.error("Could not delete expense");
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (row) => formatDate(row.date),
    },
    { key: "category", label: "Category", sortable: true },
    {
      key: "vehicle",
      label: "Vehicle",
      render: (row) => vehicleMap[row.vehicleId]?.registrationNumber || "—",
    },
    { key: "description", label: "Description" },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      align: "right",
      render: (row) => `₹${row.amount.toLocaleString("en-IN")}`,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge value={row.status} />,
    },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          {canReview && row.status === EXPENSE_STATUS.PENDING && (
            <>
              <Button
                variant="ghost"
                size="sm"
                icon={FiCheck}
                onClick={() => handleReview(row, EXPENSE_STATUS.APPROVED)}
                aria-label="Approve"
              />
              <Button
                variant="ghost"
                size="sm"
                icon={FiX}
                onClick={() => handleReview(row, EXPENSE_STATUS.REJECTED)}
                aria-label="Reject"
              />
            </>
          )}
          <Button variant="ghost" size="sm" icon={FiEdit2} onClick={() => openEdit(row)} aria-label="Edit" />
          <Button
            variant="ghost"
            size="sm"
            icon={FiTrash2}
            onClick={() => setDeleteTarget(row)}
            aria-label="Delete"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search expenses..." />
          <FilterDropdown
            label="Category"
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={EXPENSE_CATEGORIES}
          />
          <FilterDropdown
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={EXPENSE_STATUS_VALUES}
          />
        </div>
        <Button variant="signal" icon={FiPlus} onClick={openCreate}>
          Log Expense
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
            title="No expenses found"
            description="Log a toll, parking, fine, or other operational expense to get started."
          />
        }
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />

      <ExpenseFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
        expense={editingExpense}
      />

      <ConfirmationDialog
        open={!!deleteTarget}
        title="Delete expense?"
        description={`This will permanently remove this ${deleteTarget?.category?.toLowerCase() || ""} expense record.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
