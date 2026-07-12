import { useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { VEHICLE_TYPES } from "../../constants/vehicle";
import { VEHICLE_STATUS } from "../../constants/status";

const FIELD_CLASS =
  "w-full rounded-[var(--radius-control)] border bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-[var(--color-signal)]";

function fieldBorder(hasError) {
  return hasError ? "border-[var(--color-status-danger)]" : "border-[var(--color-border)]";
}

export default function VehicleFormModal({ open, onClose, onSubmit, vehicle, submitting }) {
  const isEdit = !!vehicle;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      registrationNumber: "",
      name: "",
      type: VEHICLE_TYPES[0],
      maxLoadCapacityKg: "",
      odometerKm: "",
      acquisitionCost: "",
      status: VEHICLE_STATUS.AVAILABLE,
      region: "North",
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        vehicle
          ? { ...vehicle }
          : {
              registrationNumber: "",
              name: "",
              type: VEHICLE_TYPES[0],
              maxLoadCapacityKg: "",
              odometerKm: "",
              acquisitionCost: "",
              status: VEHICLE_STATUS.AVAILABLE,
              region: "North",
            }
      );
    }
  }, [open, vehicle, reset]);

  const submit = (values) => {
    onSubmit({
      ...values,
      maxLoadCapacityKg: Number(values.maxLoadCapacityKg),
      odometerKm: Number(values.odometerKm),
      acquisitionCost: Number(values.acquisitionCost),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit vehicle" : "Register a new vehicle"}
      description={isEdit ? `Updating ${vehicle.registrationNumber}` : "Add a vehicle to the fleet master list."}
      size="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="signal" size="sm" onClick={handleSubmit(submit)} loading={submitting}>
            {isEdit ? "Save changes" : "Register vehicle"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(submit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Registration number</label>
          <input
            className={`${FIELD_CLASS} font-[family-name:var(--font-mono)] ${fieldBorder(errors.registrationNumber)}`}
            placeholder="DL-05C-1234"
            {...register("registrationNumber", { required: "Registration number is required." })}
          />
          {errors.registrationNumber && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.registrationNumber.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Vehicle name / model</label>
          <input
            className={`${FIELD_CLASS} ${fieldBorder(errors.name)}`}
            placeholder="Tata Ace"
            {...register("name", { required: "Vehicle name is required." })}
          />
          {errors.name && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.name.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Type</label>
          <select className={`${FIELD_CLASS} ${fieldBorder()}`} {...register("type")}>
            {VEHICLE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Region</label>
          <select className={`${FIELD_CLASS} ${fieldBorder()}`} {...register("region")}>
            {["North", "South", "East", "West"].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Max load capacity (kg)</label>
          <input
            type="number"
            min="1"
            className={`${FIELD_CLASS} ${fieldBorder(errors.maxLoadCapacityKg)}`}
            placeholder="1000"
            {...register("maxLoadCapacityKg", { required: "Required.", min: { value: 1, message: "Must be greater than 0." } })}
          />
          {errors.maxLoadCapacityKg && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.maxLoadCapacityKg.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Odometer (km)</label>
          <input
            type="number"
            min="0"
            className={`${FIELD_CLASS} ${fieldBorder(errors.odometerKm)}`}
            placeholder="12500"
            {...register("odometerKm", { required: "Required.", min: { value: 0, message: "Cannot be negative." } })}
          />
          {errors.odometerKm && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.odometerKm.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Acquisition cost (₹)</label>
          <input
            type="number"
            min="0"
            className={`${FIELD_CLASS} ${fieldBorder(errors.acquisitionCost)}`}
            placeholder="850000"
            {...register("acquisitionCost", { required: "Required.", min: { value: 0, message: "Cannot be negative." } })}
          />
          {errors.acquisitionCost && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.acquisitionCost.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Status</label>
          <select className={`${FIELD_CLASS} ${fieldBorder()}`} {...register("status")}>
            {Object.values(VEHICLE_STATUS).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {!isEdit && (
            <p className="mt-1 text-xs text-[var(--color-ink-faint)]">New vehicles default to Available.</p>
          )}
        </div>
      </form>
    </Modal>
  );
}
