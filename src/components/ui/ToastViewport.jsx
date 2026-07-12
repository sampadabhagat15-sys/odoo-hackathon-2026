import { FiCheckCircle, FiAlertTriangle, FiXCircle, FiInfo, FiX } from "react-icons/fi";
import { useToastList } from "../../context/ToastContext";

const ICONS = {
  success: FiCheckCircle,
  error: FiXCircle,
  warning: FiAlertTriangle,
  info: FiInfo,
};

const TONES = {
  success: "border-l-[var(--color-status-available)] text-[var(--color-status-available)]",
  error: "border-l-[var(--color-status-danger)] text-[var(--color-status-danger)]",
  warning: "border-l-[var(--color-status-shop)] text-[var(--color-status-shop)]",
  info: "border-l-[var(--color-status-ontrip)] text-[var(--color-status-ontrip)]",
};

export default function ToastViewport() {
  const { toasts, dismiss } = useToastList();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex w-80 flex-col gap-2">
      {toasts.map((t) => {
        const Icon = ICONS[t.type] || FiInfo;
        return (
          <div
            key={t.id}
            className={`animate-toast-in flex items-start gap-2.5 rounded-[var(--radius-control)] border-l-4 bg-[var(--color-surface)] px-3.5 py-3 shadow-lg shadow-black/5 ring-1 ring-[var(--color-border)] ${TONES[t.type]}`}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="flex-1 text-sm leading-snug text-[var(--color-ink)]">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
            >
              <FiX className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
