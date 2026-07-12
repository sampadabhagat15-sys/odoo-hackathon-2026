import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { getAssignableDrivers, getAssignableVehicles } from "../../services/trip";

const FIELD_CLASS =
  "w-full rounded-[var(--radius-control)] border bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-[var(--color-signal)]";

function fieldBorder(hasError) {
  return hasError ? "border-[var(--color-status-danger)]" : "border-[var(--color-border)]";
}

const EMPTY_VALUES = {
  origin: "",
  destination: "",
  vehicleId: "",
  driverId: "",
  cargoWeightKg: "",
  distanceKm: "",
};

// Create-only: the backend has no generic PATCH/PUT for trips, only the
// dispatch/complete/cancel action endpoints — so this modal never edits an
// existing trip, only creates new ones.
export default function TripFormModal({ open, onClose, onSubmit, submitting }) {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
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
    // includeAll defaults to false here — only Available vehicles/drivers
    // are offered when scheduling a new trip.
    Promise.all([getAssignableVehicles(), getAssignableDrivers()])
      .then(([v, d]) => {
        setVehicles(v);
        setDrivers(d);
      })
      .finally(() => setOptionsLoading(false));
  }, [open]);

  useEffect(() => {
    if (open) reset(EMPTY_VALUES);
  }, [open, reset]);

  const submit = (values) => {
    onSubmit({
      ...values,
      cargoWeightKg: Number(values.cargoWeightKg),
      distanceKm: Number(values.distanceKm),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule a new trip"
      description="Assign a vehicle and driver to a new trip."
      size="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="signal" size="sm" onClick={handleSubmit(submit)} loading={submitting}>
            Schedule trip
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(submit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Origin</label>
          <input
            className={`${FIELD_CLASS} ${fieldBorder(errors.origin)}`}
            placeholder="Delhi"
            {...register("origin", { required: "Origin is required." })}
          />
          {errors.origin && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.origin.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Destination</label>
          <input
            className={`${FIELD_CLASS} ${fieldBorder(errors.destination)}`}
            placeholder="Jaipur"
            {...register("destination", { required: "Destination is required." })}
          />
          {errors.destination && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.destination.message}</p>}
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
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Driver</label>
          <select
            className={`${FIELD_CLASS} ${fieldBorder(errors.driverId)}`}
            disabled={optionsLoading}
            {...register("driverId", { required: "Select a driver." })}
          >
            <option value="">{optionsLoading ? "Loading…" : "Select a driver"}</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          {errors.driverId && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.driverId.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Cargo weight (kg)</label>
          <input
            type="number"
            min="1"
            className={`${FIELD_CLASS} ${fieldBorder(errors.cargoWeightKg)}`}
            placeholder="620"
            {...register("cargoWeightKg", { required: "Required.", min: { value: 1, message: "Must be greater than 0." } })}
          />
          {errors.cargoWeightKg && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.cargoWeightKg.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Planned distance (km)</label>
          <input
            type="number"
            min="1"
            className={`${FIELD_CLASS} ${fieldBorder(errors.distanceKm)}`}
            placeholder="280"
            {...register("distanceKm", { required: "Required.", min: { value: 1, message: "Must be greater than 0." } })}
          />
          {errors.distanceKm && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.distanceKm.message}</p>}
        </div>
      </form>
    </Modal>
  );
}
