import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { MAINTENANCE_TYPES } from "../../constants/maintenance";
import { MAINTENANCE_STATUS } from "../../constants/status";
import { getMaintenanceVehicles } from "../../services/maintenance";

const FIELD_CLASS =
  "w-full rounded-[var(--radius-control)] border bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-[var(--color-signal)]";

function fieldBorder(hasError) {
  return hasError ? "border-[var(--color-status-danger)]" : "border-[var(--color-border)]";
}

const EMPTY_VALUES = {
  vehicleId: "",
  type: MAINTENANCE_TYPES[0],
  description: "",
  serviceCenter: "",
  odometerKm: "",
  cost: "",
  scheduledDate: "",
  completedDate: "",
  status: MAINTENANCE_STATUS.SCHEDULED,
};

export default function MaintenanceFormModal({ open, onClose, onSubmit, record, submitting }) {
  const isEdit = !!record;

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
    if (open) reset(record ? { ...record, completedDate: record.completedDate || "" } : EMPTY_VALUES);
  }, [open, record, reset]);

  const submit = (values) => {
    onSubmit({
      ...values,
      odometerKm: Number(values.odometerKm),
      cost: Number(values.cost),
      completedDate: values.completedDate || null,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit work order" : "Create a work order"}
      description={isEdit ? `Updating ${record.workOrderCode}` : "Log a maintenance job for a vehicle."}
      size="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="signal" size="sm" onClick={handleSubmit(submit)} loading={submitting}>
            {isEdit ? "Save changes" : "Create work order"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(submit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
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

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Type</label>
          <select className={`${FIELD_CLASS} ${fieldBorder()}`} {...register("type")}>
            {MAINTENANCE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Description</label>
          <textarea
            rows={2}
            className={`${FIELD_CLASS} resize-none ${fieldBorder(errors.description)}`}
            placeholder="What was done or needs to be done"
            {...register("description", { required: "Description is required." })}
          />
          {errors.description && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.description.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Service center</label>
          <input
            className={`${FIELD_CLASS} ${fieldBorder(errors.serviceCenter)}`}
            placeholder="Speedy Fleet Garage, Delhi"
            {...register("serviceCenter", { required: "Service center is required." })}
          />
          {errors.serviceCenter && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.serviceCenter.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Odometer at service (km)</label>
          <input
            type="number"
            min="0"
            className={`${FIELD_CLASS} ${fieldBorder(errors.odometerKm)}`}
            placeholder="10120"
            {...register("odometerKm", { required: "Required.", min: { value: 0, message: "Cannot be negative." } })}
          />
          {errors.odometerKm && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.odometerKm.message}</p>}
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
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Scheduled date</label>
          <input
            type="date"
            className={`${FIELD_CLASS} ${fieldBorder(errors.scheduledDate)}`}
            {...register("scheduledDate", { required: "Scheduled date is required." })}
          />
          {errors.scheduledDate && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.scheduledDate.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Completed date</label>
          <input type="date" className={`${FIELD_CLASS} ${fieldBorder()}`} {...register("completedDate")} />
          <p className="mt-1 text-xs text-[var(--color-ink-faint)]">Leave blank if not yet completed.</p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Status</label>
          <select className={`${FIELD_CLASS} ${fieldBorder()}`} {...register("status")}>
            {Object.values(MAINTENANCE_STATUS).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {!isEdit && <p className="mt-1 text-xs text-[var(--color-ink-faint)]">New work orders default to Scheduled.</p>}
        </div>
      </form>
    </Modal>
  );
}
