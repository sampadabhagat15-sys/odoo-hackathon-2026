export function Spinner({ size = 20 }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-signal)]"
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}

export function PageLoader({ label = "Loading…" }) {
  return (
    <div className="flex h-full min-h-[240px] w-full flex-col items-center justify-center gap-3 text-[var(--color-ink-faint)]">
      <Spinner size={28} />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="w-full">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-[var(--color-border-soft)] px-4 py-3.5">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="h-3.5 flex-1 animate-pulse rounded bg-[var(--color-surface-soft)]"
              style={{ animationDelay: `${(r + c) * 40}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="h-3 w-20 animate-pulse rounded bg-[var(--color-surface-soft)]" />
      <div className="mt-4 h-6 w-16 animate-pulse rounded bg-[var(--color-surface-soft)]" />
    </div>
  );
}
