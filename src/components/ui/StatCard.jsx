// trend is optional: { direction: 'up' | 'down', label: '+4 today' }
export default function StatCard({ label, value, icon: Icon, trend, accent = false }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">
          {label}
        </p>
        {Icon && (
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              accent
                ? "bg-[var(--color-signal-soft)] text-[var(--color-signal-dim)]"
                : "bg-[var(--color-surface-soft)] text-[var(--color-ink-soft)]"
            }`}
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">
        {value}
      </p>
      {trend && (
        <p
          className={`mt-1 text-xs font-medium ${
            trend.direction === "up" ? "text-[var(--color-status-available)]" : "text-[var(--color-status-danger)]"
          }`}
        >
          {trend.direction === "up" ? "↑" : "↓"} {trend.label}
        </p>
      )}
    </div>
  );
}
