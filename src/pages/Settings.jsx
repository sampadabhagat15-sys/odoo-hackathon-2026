import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  FiUser,
  FiBell,
  FiLock,
  FiSun,
  FiMoon,
  FiShield,
} from "react-icons/fi";

import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ROLES, ROLE_LABELS, ROUTE_ACCESS } from "../constants/roles";
import {
  updateProfile,
  changePassword,
  getNotificationPreferences,
  updateNotificationPreferences,
  getAppearance,
  updateAppearance,
} from "../services/settings";

// Same input styling convention as the form modals (DriverFormModal etc.) —
// kept local here; pull it into a shared util if you've already extracted
// FIELD_CLASS/fieldBorder elsewhere.
const FIELD_CLASS =
  "w-full rounded-[var(--radius-control)] border bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-signal)]";
function fieldBorder(hasError) {
  return hasError ? "border-[var(--color-status-danger)]" : "border-[var(--color-border)]";
}

const NOTIFICATION_LABELS = {
  tripStatusUpdates: "Trip status updates",
  maintenanceDue: "Maintenance due reminders",
  fuelLogReminders: "Fuel log reminders",
  expenseApprovals: "Expense approval activity",
  driverLicenseExpiry: "Driver license expiry alerts",
};

const NAV_ITEMS = [
  { key: "profile", label: "Profile", icon: FiUser },
  { key: "notifications", label: "Notifications", icon: FiBell },
  { key: "security", label: "Password & Security", icon: FiLock },
  { key: "appearance", label: "Appearance", icon: FiSun },
  { key: "access", label: "Role & Access", icon: FiShield, adminOnly: true },
];

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center justify-between py-3">
      <span className="text-sm text-[var(--color-ink-soft)]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-[var(--color-signal)]" : "bg-[var(--color-border)]"
        }`}
      >
        <span
          className={`block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}

function SectionCard({ title, description, children }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h2 className="font-[var(--font-display)] text-lg text-[var(--color-ink)]">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-[var(--color-ink-faint)]">{description}</p>
      )}
      <div className="mt-6">{children}</div>
    </div>
  );
}

function ProfileSection() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { name: user?.name || "", email: user?.email || "" } });

  async function onSubmit(values) {
    setSubmitting(true);
    try {
      const updated = await updateProfile(values);
      updateUser?.(updated);
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(err.message || "Could not update profile.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SectionCard title="Profile" description="Your account details.">
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-[var(--color-ink-soft)]">Name</label>
          <input
            className={`${FIELD_CLASS} ${fieldBorder(errors.name)} mt-1`}
            {...register("name", { required: "Name is required" })}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.name.message}</p>
          )}
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--color-ink-soft)]">Email</label>
          <input
            type="email"
            className={`${FIELD_CLASS} ${fieldBorder(errors.email)} mt-1`}
            {...register("email", { required: "Email is required" })}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-[var(--color-status-danger)]">{errors.email.message}</p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-[var(--color-ink-soft)]">Role</label>
          <div className="mt-1 inline-block rounded-[var(--radius-control)] bg-[var(--color-surface-soft)] px-3 py-2 text-sm text-[var(--color-ink-faint)]">
            {ROLE_LABELS[user?.role] || user?.role}
          </div>
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit" variant="signal" loading={submitting}>
            Save changes
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}

function NotificationsSection() {
  const toast = useToast();
  const [prefs, setPrefs] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getNotificationPreferences().then(setPrefs);
  }, []);

  async function handleToggle(key, value) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    try {
      await updateNotificationPreferences(next);
    } catch {
      toast.error("Could not save notification preference.");
    } finally {
      setSaving(false);
    }
  }

  if (!prefs) return null;

  return (
    <SectionCard
      title="Notifications"
      description="Choose what you want to be notified about."
    >
      <div className="divide-y divide-[var(--color-border-soft)]">
        {Object.keys(NOTIFICATION_LABELS).map((key) => (
          <Toggle
            key={key}
            label={NOTIFICATION_LABELS[key]}
            checked={!!prefs[key]}
            onChange={(value) => handleToggle(key, value)}
          />
        ))}
      </div>
      {saving && <p className="mt-2 text-xs text-[var(--color-ink-faint)]">Saving…</p>}
    </SectionCard>
  );
}

function SecuritySection() {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const newPassword = watch("newPassword");

  async function onSubmit(values) {
    setSubmitting(true);
    try {
      await changePassword(values);
      toast.success("Password updated.");
      reset();
    } catch (err) {
      toast.error(err.message || "Could not update password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SectionCard title="Password & Security" description="Update your account password.">
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-[var(--color-ink-soft)]">
            Current password
          </label>
          <input
            type="password"
            className={`${FIELD_CLASS} ${fieldBorder(errors.currentPassword)} mt-1`}
            {...register("currentPassword", { required: "Current password is required" })}
          />
          {errors.currentPassword && (
            <p className="mt-1 text-xs text-[var(--color-status-danger)]">
              {errors.currentPassword.message}
            </p>
          )}
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--color-ink-soft)]">New password</label>
          <input
            type="password"
            className={`${FIELD_CLASS} ${fieldBorder(errors.newPassword)} mt-1`}
            {...register("newPassword", {
              required: "New password is required",
              minLength: { value: 8, message: "At least 8 characters" },
            })}
          />
          {errors.newPassword && (
            <p className="mt-1 text-xs text-[var(--color-status-danger)]">
              {errors.newPassword.message}
            </p>
          )}
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--color-ink-soft)]">
            Confirm new password
          </label>
          <input
            type="password"
            className={`${FIELD_CLASS} ${fieldBorder(errors.confirmPassword)} mt-1`}
            {...register("confirmPassword", {
              required: "Please confirm your new password",
              validate: (value) => value === newPassword || "Passwords do not match",
            })}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-[var(--color-status-danger)]">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit" variant="signal" loading={submitting}>
            Update password
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}

function AppearanceSection() {
  const toast = useToast();
  const [appearance, setAppearance] = useState(null);

  useEffect(() => {
    getAppearance().then(setAppearance);
  }, []);

  async function handleSelect(theme) {
    const next = { ...appearance, theme };
    setAppearance(next);
    try {
      await updateAppearance(next);
      document.documentElement.setAttribute("data-theme", theme);
      toast.success(`Switched to ${theme} theme.`);
    } catch {
      toast.error("Could not save appearance preference.");
    }
  }

  if (!appearance) return null;

  return (
    <SectionCard
      title="Appearance"
      description="Light is fully supported today. Dark applies the toggle and persists your choice — dark color tokens aren't defined in index.css yet, so add those to @theme before shipping it."
    >
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => handleSelect("light")}
          className={`flex items-center gap-2 rounded-[var(--radius-control)] border px-4 py-2 text-sm ${
            appearance.theme === "light"
              ? "border-[var(--color-signal)] text-[var(--color-ink)]"
              : "border-[var(--color-border)] text-[var(--color-ink-faint)]"
          }`}
        >
          <FiSun /> Light
        </button>
        <button
          type="button"
          onClick={() => handleSelect("dark")}
          className={`flex items-center gap-2 rounded-[var(--radius-control)] border px-4 py-2 text-sm ${
            appearance.theme === "dark"
              ? "border-[var(--color-signal)] text-[var(--color-ink)]"
              : "border-[var(--color-border)] text-[var(--color-ink-faint)]"
          }`}
        >
          <FiMoon /> Dark
        </button>
      </div>
    </SectionCard>
  );
}

function AccessSection() {
  const routeEntries = Object.entries(ROUTE_ACCESS);

  return (
    <SectionCard
      title="Role & Access"
      description="Which roles can reach each module. Read-only — reflects constants/roles.js."
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border-soft)] text-[var(--color-ink-faint)]">
              <th className="py-2 pr-4 font-medium">Module</th>
              <th className="py-2 font-medium">Allowed roles</th>
            </tr>
          </thead>
          <tbody>
            {routeEntries.map(([route, roles]) => (
              <tr key={route} className="border-b border-[var(--color-border-soft)] last:border-0">
                <td className="py-3 pr-4 capitalize text-[var(--color-ink)]">{route}</td>
                <td className="py-3 text-[var(--color-ink-soft)]">
                  {roles.map((r) => ROLE_LABELS[r]).join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const [active, setActive] = useState("profile");

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || user?.role === ROLES.FLEET_MANAGER
  );

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
      <nav className="space-y-1">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              className={`flex w-full items-center gap-2 rounded-[var(--radius-control)] px-3 py-2 text-left text-sm ${
                isActive
                  ? "bg-[var(--color-surface-soft)] font-medium text-[var(--color-ink)]"
                  : "text-[var(--color-ink-faint)] hover:text-[var(--color-ink-soft)]"
              }`}
            >
              <Icon /> {item.label}
            </button>
          );
        })}
      </nav>

      <div>
        {active === "profile" && <ProfileSection />}
        {active === "notifications" && <NotificationsSection />}
        {active === "security" && <SecuritySection />}
        {active === "appearance" && <AppearanceSection />}
        {active === "access" && user?.role === ROLES.FLEET_MANAGER && <AccessSection />}
      </div>
    </div>
  );
}
