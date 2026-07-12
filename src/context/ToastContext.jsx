import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);
let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, { type = "info", duration = 4000 } = {}) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, message, type }]);
      if (duration) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const toast = {
    success: (msg, opts) => push(msg, { ...opts, type: "success" }),
    error: (msg, opts) => push(msg, { ...opts, type: "error" }),
    info: (msg, opts) => push(msg, { ...opts, type: "info" }),
    warning: (msg, opts) => push(msg, { ...opts, type: "warning" }),
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx.toast;
}

export function useToastList() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToastList must be used within a ToastProvider");
  return ctx;
}
