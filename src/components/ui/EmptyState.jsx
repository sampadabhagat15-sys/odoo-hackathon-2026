export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] px-6 py-14 text-center">
      {Icon && (
        <span className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-surface-soft)] text-[var(--color-ink-faint)]">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <p className="font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--color-ink)]">{title}</p>
      {description && <p className="max-w-sm text-sm text-[var(--color-ink-faint)]">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
