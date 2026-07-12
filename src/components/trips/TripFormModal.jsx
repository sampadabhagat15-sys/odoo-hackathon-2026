import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { CARGO_TYPES, REGIONS } from "../../constants/trip";
import { TRIP_STATUS } from "../../constants/status";
import { getAssignableDrivers, getAssignableVehicles } from "../../services/trip";

const FIELD_CLASS =
  "w-full rounded-[var(--radius-control)] border bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-[var(--color-signal)]";

function fieldBorder(hasError) {
  return hasError ? "border-[var(--color-status-danger)]" : "border-[var(--color-border)]";
}

const EMPTY_VALUES = {
  origin: "",
  destination: "",
  region: REGIONS[0],
  vehicleId: "",
  driverId: "",
  cargoType: CARGO_TYPES[0],
  cargoWeightKg: "",
  distanceKm: "",
  departureDate: "",
  expectedArrival: "",
  status: TRIP_STATUS.DRAFT,
};

export default function TripFormModal({ open, onClose, onSubmit, trip, submitting }) {
  const isEdit = !!trip;

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
    Promise.all([getAssignableVehicles(), getAssignableDrivers()])
      .then(([v, d]) => {
        setVehicles(v);
        setDrivers(d);
      })
      .finally(() => setOptionsLoading(false));
  }, [open]);

  useEffect(() => {
    if (open) reset(trip ? { ...trip } : EMPTY_VALUES);
  }, [open, trip, reset]);

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
      title={isEdit ? "Edit trip" : "Schedule a new trip"}
      description={isEdit ? `Updating ${trip.tripCode}` : "Assign a vehicle and driver to a new trip."}
      size="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="signal" size="sm" onClick={handleSubmit(submit)} loading={submitting}>
            {isEdit ? "Save changes" : "Schedule trip"}
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
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Region</label>
          <select className={`${FIELD_CLASS} ${fieldBorder()}`} {...register("region")}>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Cargo type</label>
          <select className={`${FIELD_CLASS} ${fieldBorder()}`} {...register("cargoType")}>
            {CARGO_TYPES.map((c) => (
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
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Distance (km)</label>
          <input
            type="number"
            min="1"
            className={`${FIELD_CLASS} ${fieldBorder(errors.distanceKm)}`}
            placeholder="280"
            {...register("distanceKm", { required: "Required.", min: { value: 1, message: "Must be greater than 0." } })}
          />
          {errors.distanceKm && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.distanceKm.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Departure date</label>
          <input
            type="date"
            className={`${FIELD_CLASS} ${fieldBorder(errors.departureDate)}`}
            {...register("departureDate", { required: "Departure date is required." })}
          />
          {errors.departureDate && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.departureDate.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Expected arrival</label>
          <input
            type="date"
            className={`${FIELD_CLASS} ${fieldBorder(errors.expectedArrival)}`}
            {...register("expectedArrival", { required: "Expected arrival is required." })}
          />
          {errors.expectedArrival && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.expectedArrival.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Status</label>
          <select className={`${FIELD_CLASS} ${fieldBorder()}`} {...register("status")}>
            {Object.values(TRIP_STATUS).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {!isEdit && <p className="mt-1 text-xs text-[var(--color-ink-faint)]">New trips default to Draft.</p>}
        </div>
      </form>
    </Modal>
  );
}
