import { useForm } from "react-hook-form";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { FiActivity, FiMail, FiLock, FiArrowRight } from "react-icons/fi";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ROUTES } from "../constants/routes";
import { ROLE_LABELS } from "../constants/roles";
import authService from "../services/auth";
import Button from "../components/ui/Button";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: "", password: "" } });

  if (isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname || ROUTES.DASHBOARD} replace />;
  }

  const onSubmit = async (values) => {
    setServerError("");
    try {
      const user = await login(values);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}.`);
      navigate(location.state?.from?.pathname || ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      setServerError(err.message || "Unable to sign in.");
    }
  };

  const fillDemo = (email) => {
    setValue("email", email, { shouldValidate: true });
    setValue("password", "password123", { shouldValidate: true });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: console panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[var(--color-console)] p-10 lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-signal)] text-[var(--color-console)]">
            <FiActivity className="h-5 w-5" />
          </span>
          <span className="font-[family-name:var(--font-display)] text-lg font-semibold text-white">
            TransitOps
          </span>
        </div>

        <div className="relative">
          <p className="font-[family-name:var(--font-display)] text-[26px] font-semibold leading-snug text-white">
            One console for every vehicle, driver, and dispatch.
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--color-console-ink-soft)]">
            Replace spreadsheets and logbooks with a single operations
            platform — from vehicle registration to fuel, maintenance, and
            fleet-wide analytics.
          </p>

          {/* Signature route-line motif */}
          <div className="mt-8 space-y-3">
            {["Fleet Manager", "Driver", "Safety Officer", "Financial Analyst"].map((role, i) => (
              <div key={role} className="route-line flex items-center gap-3 text-xs text-[var(--color-console-ink-soft)]">
                <span className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-console-soft)] font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-signal)] ring-1 ring-[var(--color-console-border)]">
                  {i + 1}
                </span>
                <span className="relative z-10 bg-[var(--color-console)] pr-2">{role}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-[var(--color-console-ink-soft)]">
          © {new Date().getFullYear()} TransitOps · Smart Transport Operations Platform
        </p>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center bg-[var(--color-bg)] p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-signal)] text-[var(--color-console)]">
              <FiActivity className="h-4 w-4" />
            </span>
            <span className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-ink)]">
              TransitOps
            </span>
          </div>

          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">
            Sign in
          </h2>
          <p className="mt-1.5 text-sm text-[var(--color-ink-faint)]">
            Enter your credentials to access the operations console.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">
                Email address
              </label>
              <div className="relative">
                <FiMail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-faint)]" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@transitops.io"
                  aria-invalid={!!errors.email}
                  className={`w-full rounded-[var(--radius-control)] border bg-[var(--color-surface)] py-2.5 pl-9 pr-3 text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)] focus:ring-2 focus:ring-[var(--color-signal)] ${
                    errors.email ? "border-[var(--color-status-danger)]" : "border-[var(--color-border)]"
                  }`}
                  {...register("email", {
                    required: "Email is required.",
                    pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email address." },
                  })}
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-[var(--color-status-danger)]">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">
                Password
              </label>
              <div className="relative">
                <FiLock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-faint)]" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                  className={`w-full rounded-[var(--radius-control)] border bg-[var(--color-surface)] py-2.5 pl-9 pr-3 text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)] focus:ring-2 focus:ring-[var(--color-signal)] ${
                    errors.password ? "border-[var(--color-status-danger)]" : "border-[var(--color-border)]"
                  }`}
                  {...register("password", {
                    required: "Password is required.",
                    minLength: { value: 6, message: "Password must be at least 6 characters." },
                  })}
                />
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-[var(--color-status-danger)]">{errors.password.message}</p>}
            </div>

            {serverError && (
              <p className="rounded-[var(--radius-control)] bg-[var(--color-status-danger-soft)] px-3 py-2 text-xs text-[var(--color-status-danger)]">
                {serverError}
              </p>
            )}

            <Button type="submit" variant="signal" className="w-full" loading={isSubmitting}>
              Sign in <FiArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-7 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] p-3.5">
            <p className="mb-2.5 text-xs font-medium text-[var(--color-ink-soft)]">
              Demo accounts (password: password123)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {authService.MOCK_USERS.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => fillDemo(u.email)}
                  className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-ink-soft)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal-dim)]"
                >
                  {ROLE_LABELS[u.role]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
