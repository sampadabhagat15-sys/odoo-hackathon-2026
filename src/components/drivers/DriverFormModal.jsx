import { useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { LICENSE_CATEGORIES } from "../../constants/driver";
import { DRIVER_STATUS } from "../../constants/status";

const FIELD_CLASS =
  "w-full rounded-[var(--radius-control)] border bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-[var(--color-signal)]";

function fieldBorder(hasError) {
  return hasError ? "border-[var(--color-status-danger)]" : "border-[var(--color-border)]";
}

const EMPTY_VALUES = {
  name: "",
  licenseNumber: "",
  licenseCategory: LICENSE_CATEGORIES[0],
  licenseExpiry: "",
  contactNumber: "",
  safetyScore: 90,
  status: DRIVER_STATUS.AVAILABLE,
};

export default function DriverFormModal({ open, onClose, onSubmit, driver, submitting }) {
  const isEdit = !!driver;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: EMPTY_VALUES });

  useEffect(() => {
    if (open) reset(driver ? { ...driver } : EMPTY_VALUES);
  }, [open, driver, reset]);

  const submit = (values) => {
    onSubmit({ ...values, safetyScore: Number(values.safetyScore) });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit driver" : "Add a new driver"}
      description={isEdit ? `Updating ${driver.name}` : "Add a driver profile to the roster."}
      size="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="signal" size="sm" onClick={handleSubmit(submit)} loading={submitting}>
            {isEdit ? "Save changes" : "Add driver"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(submit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Full name</label>
          <input
            className={`${FIELD_CLASS} ${fieldBorder(errors.name)}`}
            placeholder="Alex Menon"
            {...register("name", { required: "Name is required." })}
          />
          {errors.name && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.name.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">License number</label>
          <input
            className={`${FIELD_CLASS} font-[family-name:var(--font-mono)] ${fieldBorder(errors.licenseNumber)}`}
            placeholder="DL-1420-20180113"
            {...register("licenseNumber", { required: "License number is required." })}
          />
          {errors.licenseNumber && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.licenseNumber.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">License category</label>
          <select className={`${FIELD_CLASS} ${fieldBorder()}`} {...register("licenseCategory")}>
            {LICENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">License expiry date</label>
          <input
            type="date"
            className={`${FIELD_CLASS} ${fieldBorder(errors.licenseExpiry)}`}
            {...register("licenseExpiry", { required: "Expiry date is required." })}
          />
          {errors.licenseExpiry && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.licenseExpiry.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Contact number</label>
          <input
            className={`${FIELD_CLASS} ${fieldBorder(errors.contactNumber)}`}
            placeholder="+91 98XXXXXXXX"
            {...register("contactNumber", { required: "Contact number is required." })}
          />
          {errors.contactNumber && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.contactNumber.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Safety score (0–100)</label>
          <input
            type="number"
            min="0"
            max="100"
            className={`${FIELD_CLASS} ${fieldBorder(errors.safetyScore)}`}
            {...register("safetyScore", {
              required: "Required.",
              min: { value: 0, message: "Minimum is 0." },
              max: { value: 100, message: "Maximum is 100." },
            })}
          />
          {errors.safetyScore && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.safetyScore.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Status</label>
          <select className={`${FIELD_CLASS} ${fieldBorder()}`} {...register("status")}>
            {Object.values(DRIVER_STATUS).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {!isEdit && <p className="mt-1 text-xs text-[var(--color-ink-faint)]">New drivers default to Available.</p>}
        </div>
      </form>
    </Modal>
  );
}
