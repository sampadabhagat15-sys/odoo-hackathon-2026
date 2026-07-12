import { STATUS_TONE } from "../../constants/status";

const TONE_CLASSES = {
  available: "text-[var(--color-status-available)] bg-[var(--color-status-available-soft)]",
  ontrip: "text-[var(--color-status-ontrip)] bg-[var(--color-status-ontrip-soft)]",
  shop: "text-[var(--color-status-shop)] bg-[var(--color-status-shop-soft)]",
  retired: "text-[var(--color-status-retired)] bg-[var(--color-status-retired-soft)]",
  danger: "text-[var(--color-status-danger)] bg-[var(--color-status-danger-soft)]",
};

// Usage: <StatusBadge value="On Trip" /> — tone is resolved automatically
// from STATUS_TONE, or pass tone="danger" explicitly to override.
export default function StatusBadge({ value, tone }) {
  const resolvedTone = tone || STATUS_TONE[value] || "retired";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${TONE_CLASSES[resolvedTone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {value}
    </span>
  );
}
