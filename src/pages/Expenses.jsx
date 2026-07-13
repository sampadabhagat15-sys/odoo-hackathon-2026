import { useEffect, useMemo, useState } from "react";
import { FiPlus, FiCheck, FiX } from "react-icons/fi";
import DataTable from "../components/ui/DataTable";
import Pagination from "../components/ui/Pagination";
import SearchBar from "../components/ui/SearchBar";
import FilterDropdown from "../components/ui/FilterDropdown";
import Button from "../components/ui/Button";
import StatusBadge from "../components/ui/StatusBadge";
import EmptyState from "../components/ui/EmptyState";
import ExpenseFormModal from "../components/expenses/ExpenseFormModal";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../constants/roles";
import { getExpenses, createExpense, approveExpense, rejectExpense } from "../services/expense";
import { EXPENSE_CATEGORIES } from "../constants/expense";
import { EXPENSE_STATUS } from "../constants/status";
import { formatDate } from "../utils/date";

const EXPENSE_STATUS_VALUES = Object.values(EXPENSE_STATUS);
const PAGE_SIZE = 10;

// Matches backend RBAC exactly:
// - LOG_FUEL_EXPENSE (create): dispatcher, fleet_manager, admin
// - REVIEW_EXPENSE (approve/reject): financial_analyst, fleet_manager, admin
const CAN_LOG_ROLES = [ROLES.DISPATCHER, ROLES.FLEET_MANAGER, ROLES.ADMIN];
const CAN_REVIEW_ROLES = [ROLES.FINANCIAL_ANALYST, ROLES.FLEET_MANAGER, ROLES.ADMIN];

export default function Expenses() {
  const { user } = useAuth();
  const toast = useToast();
  const canLog = CAN_LOG_ROLES.includes(user?.role);
  const canReview = CAN_REVIEW_ROLES.includes(user?.role);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const expenses = await getExpenses();
      setData(expenses);
    } catch {
      toast.error("Couldn't load expenses. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (e) =>
          (e.description || "").toLowerCase().includes(q) ||
          e.vehicleLabel.toLowerCase().includes(q)
      );
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
  }, [data, search, categoryFilter, statusFilter, sortBy, sortDir]);

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
    setModalOpen(true);
  }

  async function handleSubmit(values) {
    setSubmitting(true);
    try {
      await createExpense(values);
      toast.success("Expense logged, pending review.");
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReview(expense, action) {
    try {
      if (action === "approve") {
        await approveExpense(expense.id);
        toast.success("Expense approved.");
      } else {
        await rejectExpense(expense.id);
        toast.success("Expense rejected.");
      }
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not update expense status.");
    }
  }

  const columns = [
    { key: "date", label: "Date", sortable: true, render: (row) => formatDate(row.date) },
    { key: "category", label: "Category", sortable: true },
    { key: "vehicleLabel", label: "Vehicle", render: (row) => row.vehicleLabel },
    { key: "description", label: "Description", render: (row) => row.description || "—" },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      align: "right",
      render: (row) => `₹${row.amount.toLocaleString("en-IN")}`,
    },
    { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
    ...(canReview
      ? [
          {
            key: "actions",
            label: "",
            align: "right",
            render: (row) =>
              row.status === EXPENSE_STATUS.PENDING ? (
                <div className="flex justify-end gap-1.5">
                  <button
                    onClick={() => handleReview(row, "approve")}
                    aria-label="Approve expense"
                    title="Approve"
                    className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-ink-faint)] hover:bg-[var(--color-status-available-soft)] hover:text-[var(--color-status-available)]"
                  >
                    <FiCheck className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleReview(row, "reject")}
                    aria-label="Reject expense"
                    title="Reject"
                    className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-ink-faint)] hover:bg-[var(--color-status-danger-soft)] hover:text-[var(--color-status-danger)]"
                  >
                    <FiX className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : null,
          },
        ]
      : []),
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
        {canLog && (
          <Button variant="signal" icon={FiPlus} onClick={openCreate}>
            Log Expense
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
            title="No expenses found"
            description={
              canLog
                ? "Log a toll, fine, parking, repair, or other operational expense to get started."
                : "Try adjusting your search or filters."
            }
          />
        }
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />

      {canLog && (
        <ExpenseFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}
    </div>
  );
}
