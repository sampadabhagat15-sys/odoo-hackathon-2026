import { useEffect, useMemo, useState } from "react";
import { FiDroplet, FiPlus } from "react-icons/fi";
import DataTable from "../components/ui/DataTable";
import SearchBar from "../components/ui/SearchBar";
import Pagination from "../components/ui/Pagination";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import FuelLogFormModal from "../components/fuel/FuelLogFormModal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ROLES } from "../constants/roles";
import { formatDate } from "../utils/date";
import { getFuelLogs, createFuelLog } from "../services/fuel";

const PAGE_SIZE = 8;

// Matches the backend's actual RBAC for POST /fuel-logs (dispatcher,
// fleet_manager, admin) — Safety Officer and Financial Analyst can view
// but not log entries.
const CAN_LOG_ROLES = [ROLES.DISPATCHER, ROLES.FLEET_MANAGER, ROLES.ADMIN];

export default function FuelLogs() {
  const { user } = useAuth();
  const toast = useToast();
  const canLog = CAN_LOG_ROLES.includes(user?.role);

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("fuelDate");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
  }, [search]);

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = logs.filter((l) => {
      if (!q) return true;
      return l.vehicleLabel.toLowerCase().includes(q);
    });
    rows = [...rows].sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      if (av === bv) return 0;
      const result = av > bv ? 1 : -1;
      return sortDir === "asc" ? result : -result;
    });
    return rows;
  }, [logs, search, sortBy, sortDir]);

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
      await createFuelLog(values);
      toast.success("Fuel entry logged.");
      setModalOpen(false);
      await loadLogs();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Couldn't save the fuel log. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const columns = [
    {
      key: "id",
      label: "Log",
      render: (r) => <span className="font-[family-name:var(--font-mono)] text-xs font-medium">#{r.id.slice(0, 8)}</span>,
    },
    { key: "vehicleLabel", label: "Vehicle", render: (r) => r.vehicleLabel },
    { key: "quantityLiters", label: "Quantity", align: "right", sortable: true, render: (r) => `${r.quantityLiters} L` },
    { key: "totalCost", label: "Total Cost", align: "right", sortable: true, render: (r) => `₹${r.totalCost.toLocaleString("en-IN")}` },
    { key: "fuelDate", label: "Date", sortable: true, render: (r) => formatDate(r.fuelDate) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by vehicle…" />
        {canLog && (
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
            description={canLog ? "Try a different search, or log a new fuel entry." : "Try a different search."}
            action={
              canLog && (
                <Button variant="signal" size="sm" icon={FiPlus} onClick={openCreate}>
                  Log fuel entry
                </Button>
              )
            }
          />
        }
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={filteredSorted.length} onPageChange={setPage} />

      {canLog && (
        <FuelLogFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}
    </div>
  );
}
