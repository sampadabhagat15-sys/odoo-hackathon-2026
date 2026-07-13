import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { getMaintenanceVehicles } from "../../services/maintenance";

const FIELD_CLASS =
  "w-full rounded-[var(--radius-control)] border bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-[var(--color-signal)]";

function fieldBorder(hasError) {
  return hasError ? "border-[var(--color-status-danger)]" : "border-[var(--color-border)]";
}

const EMPTY_VALUES = {
  vehicleId: "",
  description: "",
  cost: "",
  startDate: "",
};

// Create-only — the backend has no update endpoint for maintenance
// records, only create (which auto-sets the vehicle to In Shop) and
// close (handled separately in Maintenance.jsx, not this modal).
export default function MaintenanceFormModal({ open, onClose, onSubmit, submitting }) {
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
    getMaintenanceVehicles()
      .then(setVehicles)
      .finally(() => setVehiclesLoading(false));
  }, [open]);

  useEffect(() => {
    if (open) reset(EMPTY_VALUES);
  }, [open, reset]);

  const submit = (values) => {
    onSubmit({
      ...values,
      cost: Number(values.cost),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create a work order"
      description="Starts the vehicle's maintenance — it will move to In Shop and be removed from dispatch until this is closed."
      size="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="signal" size="sm" onClick={handleSubmit(submit)} loading={submitting}>
            Create work order
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(submit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
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
          {!vehiclesLoading && vehicles.length === 0 && (
            <p className="mt-1 text-xs text-[var(--color-ink-faint)]">
              No Available vehicles right now — a vehicle already On Trip, In Shop, or Retired can't start new maintenance.
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Description</label>
          <textarea
            rows={2}
            className={`${FIELD_CLASS} resize-none ${fieldBorder(errors.description)}`}
            placeholder="e.g. 10,000 km service — oil, filters, brake check (Speedy Fleet Garage, Delhi)"
            {...register("description", { required: "Description is required." })}
          />
          {errors.description && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.description.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Cost (₹)</label>
          <input
            type="number"
            min="0"
            className={`${FIELD_CLASS} ${fieldBorder(errors.cost)}`}
            placeholder="4200"
            {...register("cost", { required: "Required.", min: { value: 0, message: "Cannot be negative." } })}
          />
          {errors.cost && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.cost.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Start date</label>
          <input
            type="date"
            className={`${FIELD_CLASS} ${fieldBorder(errors.startDate)}`}
            {...register("startDate", { required: "Start date is required." })}
          />
          {errors.startDate && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.startDate.message}</p>}
        </div>
      </form>
    </Modal>
  );
}
