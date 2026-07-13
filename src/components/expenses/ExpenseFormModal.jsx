import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { EXPENSE_CATEGORIES } from "../../constants/expense";
import { getExpenseVehicles } from "../../services/expense";

const FIELD_CLASS =
  "w-full rounded-[var(--radius-control)] border bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-[var(--color-signal)]";

function fieldBorder(hasError) {
  return hasError ? "border-[var(--color-status-danger)]" : "border-[var(--color-border)]";
}

const EMPTY_VALUES = {
  date: "",
  category: EXPENSE_CATEGORIES[0],
  vehicleId: "",
  amount: "",
  description: "",
};

// Create-only — no update/delete on the backend. Trip linkage dropped
// entirely: the backend's Expense model has no trip_id field at all
// (unlike FuelLog, which does) — an expense is tracked per-vehicle only.
export default function ExpenseFormModal({ open, onClose, onSubmit, submitting }) {
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: EMPTY_VALUES });

  useEffect(() => {
    if (!open) return;
    setVehiclesLoading(true);
    getExpenseVehicles()
      .then(setVehicles)
      .finally(() => setVehiclesLoading(false));
  }, [open]);

  useEffect(() => {
    if (open) reset(EMPTY_VALUES);
  }, [open, reset]);

  const submit = (values) => {
    onSubmit({
      ...values,
      amount: Number(values.amount),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log an expense"
      description="Record a toll, fine, parking, repair, or other operational expense. It starts as Pending, awaiting review."
      size="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="signal" size="sm" onClick={handleSubmit(submit)} loading={submitting}>
            Log expense
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(submit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Date</label>
          <input
            type="date"
            className={`${FIELD_CLASS} ${fieldBorder(errors.date)}`}
            {...register("date", { required: "Date is required." })}
          />
          {errors.date && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.date.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Category</label>
          <select className={`${FIELD_CLASS} ${fieldBorder()}`} {...register("category")}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Vehicle</label>
          <select
            className={`${FIELD_CLASS} ${fieldBorder(errors.vehicleId)}`}
            disabled={vehiclesLoading}
            {...register("vehicleId", { required: "Select a vehicle." })}
          >
            <option value="">{vehiclesLoading ? "Loading…" : "Select a vehicle"}</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.name} · {v.registrationNumber}</option>
            ))}
          </select>
          {errors.vehicleId && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.vehicleId.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Amount (₹)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className={`${FIELD_CLASS} ${fieldBorder(errors.amount)}`}
            placeholder="450"
            {...register("amount", { required: "Required.", min: { value: 0.01, message: "Must be greater than 0." } })}
          />
          {errors.amount && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.amount.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">
            Description <span className="text-[var(--color-ink-faint)]">(optional)</span>
          </label>
          <textarea
            rows={3}
            className={`${FIELD_CLASS} ${fieldBorder(errors.description)}`}
            placeholder="NH-48 toll — Jaipur to Ajmer leg"
            {...register("description")}
          />
        </div>
      </form>
    </Modal>
  );
}
