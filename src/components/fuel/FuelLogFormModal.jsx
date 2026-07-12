import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { FUEL_TYPES } from "../../constants/fuel";
import { getFuelVehicles, getFuelDrivers } from "../../services/fuel";

const FIELD_CLASS =
  "w-full rounded-[var(--radius-control)] border bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-[var(--color-signal)]";

function fieldBorder(hasError) {
  return hasError ? "border-[var(--color-status-danger)]" : "border-[var(--color-border)]";
}

const EMPTY_VALUES = {
  vehicleId: "",
  driverId: "",
  fuelType: FUEL_TYPES[0],
  quantityLiters: "",
  costPerLiter: "",
  odometerKm: "",
  station: "",
  fuelDate: "",
};

export default function FuelLogFormModal({ open, onClose, onSubmit, log, submitting }) {
  const isEdit = !!log;

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
    Promise.all([getFuelVehicles(), getFuelDrivers()])
      .then(([v, d]) => {
        setVehicles(v);
        setDrivers(d);
      })
      .finally(() => setOptionsLoading(false));
  }, [open]);

  useEffect(() => {
    if (open) reset(log ? { ...log } : EMPTY_VALUES);
  }, [open, log, reset]);

  const submit = (values) => {
    onSubmit({
      ...values,
      quantityLiters: Number(values.quantityLiters),
      costPerLiter: Number(values.costPerLiter),
      odometerKm: Number(values.odometerKm),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit fuel log" : "Log a fuel entry"}
      description={isEdit ? `Updating ${log.logCode}` : "Record a refuelling entry for a vehicle."}
      size="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="signal" size="sm" onClick={handleSubmit(submit)} loading={submitting}>
            {isEdit ? "Save changes" : "Log entry"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(submit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
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
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Fuel type</label>
          <select className={`${FIELD_CLASS} ${fieldBorder()}`} {...register("fuelType")}>
            {FUEL_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Fuel date</label>
          <input
            type="date"
            className={`${FIELD_CLASS} ${fieldBorder(errors.fuelDate)}`}
            {...register("fuelDate", { required: "Fuel date is required." })}
          />
          {errors.fuelDate && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.fuelDate.message}</p>}
        </div>

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
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Cost per liter (₹)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className={`${FIELD_CLASS} ${fieldBorder(errors.costPerLiter)}`}
            placeholder="92.50"
            {...register("costPerLiter", { required: "Required.", min: { value: 0, message: "Cannot be negative." } })}
          />
          {errors.costPerLiter && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.costPerLiter.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Odometer (km)</label>
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
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">Station</label>
          <input
            className={`${FIELD_CLASS} ${fieldBorder(errors.station)}`}
            placeholder="Indian Oil, NH8 Delhi"
            {...register("station", { required: "Station is required." })}
          />
          {errors.station && <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.station.message}</p>}
        </div>
      </form>
    </Modal>
  );
}
