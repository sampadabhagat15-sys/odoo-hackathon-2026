export default function ChartCard({ title, subtitle, action, children, height = 260 }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--color-ink)]">
            {title}
          </h3>
          {subtitle && <p className="mt-0.5 text-xs text-[var(--color-ink-faint)]">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div style={{ height }}>{children}</div>
    </div>
  );
}
