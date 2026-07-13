import { useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

const FIELD_CLASS =
  "w-full rounded-[var(--radius-control)] border bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-[var(--color-signal)]";

function fieldBorder(hasError) {
  return hasError ? "border-[var(--color-status-danger)]" : "border-[var(--color-border)]";
}

const EMPTY_VALUES = {
  finalOdometer: "",
  fuelConsumedLiters: "",
};

// Collects the two fields the backend requires to mark a Dispatched trip
// Completed: final odometer reading (used to compute actual distance and
// update the vehicle's odometer) and fuel consumed (used for fuel
// efficiency reporting).
export default function CompleteTripModal({ open, onClose, onSubmit, trip, submitting }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: EMPTY_VALUES });

  useEffect(() => {
    if (open) reset(EMPTY_VALUES);
  }, [open, reset]);

  const submit = (values) => {
    onSubmit({
      finalOdometer: Number(values.finalOdometer),
      fuelConsumedLiters: Number(values.fuelConsumedLiters),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Complete trip"
      description={trip ? `${trip.origin} → ${trip.destination}` : ""}
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="signal" size="sm" onClick={handleSubmit(submit)} loading={submitting}>
            Mark completed
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(submit)} className="grid grid-cols-1 gap-4" noValidate>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">
            Final odometer reading
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            className={`${FIELD_CLASS} ${fieldBorder(errors.finalOdometer)}`}
            placeholder="e.g. 45230"
            {...register("finalOdometer", {
              required: "Required.",
              min: { value: 0, message: "Must be 0 or greater." },
            })}
          />
          {errors.finalOdometer && (
            <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.finalOdometer.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">
            Fuel consumed (liters)
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            className={`${FIELD_CLASS} ${fieldBorder(errors.fuelConsumedLiters)}`}
            placeholder="e.g. 32.5"
            {...register("fuelConsumedLiters", {
              required: "Required.",
              min: { value: 0, message: "Must be 0 or greater." },
            })}
          />
          {errors.fuelConsumedLiters && (
            <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.fuelConsumedLiters.message}</p>
          )}
        </div>
      </form>
    </Modal>
  );
}