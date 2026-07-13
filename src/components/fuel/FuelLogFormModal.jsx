import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { getFuelVehicles } from "../../services/fuel";

const FIELD_CLASS =
  "w-full rounded-[var(--radius-control)] border bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-[var(--color-signal)]";

function fieldBorder(hasError) {
  return hasError ? "border-[var(--color-status-danger)]" : "border-[var(--color-border)]";
}

const EMPTY_VALUES = {
  vehicleId: "",
  quantityLiters: "",
  totalCost: "",
  fuelDate: "",
};

// Create-only — the backend has no update or delete for fuel logs,
// only POST (create) and GET (list). Once logged, an entry is permanent.
export default function FuelLogFormModal({ open, onClose, onSubmit, submitting }) {
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
    getFuelVehicles()
      .then(setVehicles)
      .finally(() => setVehiclesLoading(false));
  }, [open]);

  useEffect(() => {
    if (open) reset(EMPTY_VALUES);
  }, [open, reset]);

  const submit = (values) => {
    onSubmit({
      ...values,
      quantityLiters: Number(values.quantityLiters),
      totalCost: Number(values.totalCost),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log a fuel entry"
      description="Record fuel purchased for a vehicle."
      size="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="signal" size="sm" onClick={handleSubmit(submit)} loading={submitting}>
            Log entry
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(submit)} className="grid grid-cols-1 gap-4" noValidate>
        <div>
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Quantity (liters)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              className={`${FIELD_CLASS} ${fieldBorder(errors.quantityLiters)}`}
              placeholder="45"
              {...register("quantityLiters", { required: "Required.", min: { value: 0.1, message: "Must be greater than 0." } })}
            />
            {errors.quantityLiters && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.quantityLiters.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Total cost (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={`${FIELD_CLASS} ${fieldBorder(errors.totalCost)}`}
              placeholder="4162.50"
              {...register("totalCost", { required: "Required.", min: { value: 0, message: "Cannot be negative." } })}
            />
            {errors.totalCost && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.totalCost.message}</p>}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Date</label>
          <input
            type="date"
            className={`${FIELD_CLASS} ${fieldBorder(errors.fuelDate)}`}
            {...register("fuelDate", { required: "Date is required." })}
          />
          {errors.fuelDate && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.fuelDate.message}</p>}
        </div>
      </form>
    </Modal>
  );
}
