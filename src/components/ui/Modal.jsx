import { useEffect } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";

const SIZES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export default function Modal({ open, onClose, title, description, size = "md", children, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative w-full ${SIZES[size]} max-h-[90vh] overflow-y-auto rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-xl shadow-black/10`}
      >
        <div className="flex items-start justify-between border-b border-[var(--color-border-soft)] px-5 py-4">
          <div>
            <h2 id="modal-title" className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-ink)]">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-xs text-[var(--color-ink-faint)]">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-ink-faint)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-ink)]"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4">{children}</div>

        {footer && <div className="flex justify-end gap-2 border-t border-[var(--color-border-soft)] px-5 py-3.5">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
