// components/expenses/ExpenseFormModal.jsx
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { EXPENSE_CATEGORIES } from "../../constants/expense";
import vehicleService from "../../services/vehicle";
import { getTrips } from "../../services/trip";

const FIELD_CLASS =
  "w-full rounded-[var(--radius-control)] border bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-[var(--color-signal)]";

function fieldBorder(hasError) {
  return hasError ? "border-[var(--color-status-danger)]" : "border-[var(--color-border)]";
}

const EMPTY_VALUES = {
  date: "",
  category: EXPENSE_CATEGORIES[0],
  vehicleId: "",
  tripId: "",
  amount: "",
  description: "",
};

export default function ExpenseFormModal({ open, onClose, onSubmit, expense, submitting }) {
  const isEdit = !!expense;

  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: EMPTY_VALUES });

  useEffect(() => {
    if (!open) return;
    setOptionsLoading(true);
    Promise.all([vehicleService.getAll({ pageSize: 1000 }), getTrips()])
      .then(([vResult, t]) => {
        setVehicles(vResult.items);
        setTrips(t);
      })
      .finally(() => setOptionsLoading(false));
  }, [open]);

  useEffect(() => {
    if (open) reset(expense ? { ...expense, tripId: expense.tripId || "" } : EMPTY_VALUES);
  }, [open, expense, reset]);

  const submit = (values) => {
    onSubmit({
      ...values,
      amount: Number(values.amount),
      tripId: values.tripId || null,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit expense" : "Log an expense"}
      description={isEdit ? `Updating expense for ${expense.description}` : "Record a toll, parking, fine, repair, or other operational expense."}
      size="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="signal" size="sm" onClick={handleSubmit(submit)} loading={submitting}>
            {isEdit ? "Save changes" : "Log expense"}
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

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Vehicle</label>
          <select
            className={`${FIELD_CLASS} ${fieldBorder(errors.vehicleId)}`}
            disabled={optionsLoading}
            {...register("vehicleId", { required: "Select a vehicle." })}
          >
            <option value="">{optionsLoading ? "Loading…" : "Select a vehicle"}</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.name} · {v.registrationNumber}</option>
            ))}
          </select>
          {errors.vehicleId && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.vehicleId.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">
            Trip <span className="text-[var(--color-ink-faint)]">(optional)</span>
          </label>
          <select className={`${FIELD_CLASS} ${fieldBorder()}`} disabled={optionsLoading} {...register("tripId")}>
            <option value="">No trip</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>{t.tripCode} · {t.origin} → {t.destination}</option>
            ))}
          </select>
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
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Description</label>
          <textarea
            rows={3}
            className={`${FIELD_CLASS} ${fieldBorder(errors.description)}`}
            placeholder="NH-48 toll — Jaipur to Ajmer leg"
            {...register("description", { required: "Description is required." })}
          />
          {errors.description && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.description.message}</p>}
        </div>
      </form>
    </Modal>
  );
}
