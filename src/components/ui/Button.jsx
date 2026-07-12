const VARIANTS = {
  primary: "bg-[var(--color-console)] text-white hover:bg-[var(--color-console-soft)]",
  signal: "bg-[var(--color-signal)] text-[var(--color-console)] hover:brightness-95",
  ghost: "bg-transparent text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-soft)]",
  outline: "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)]",
  danger: "bg-[var(--color-status-danger)] text-white hover:brightness-95",
};

const SIZES = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-[38px] px-4 text-sm gap-2",
};

export default function Button({
  as: As = "button",
  variant = "primary",
  size = "md",
  icon: Icon,
  loading = false,
  disabled = false,
  className = "",
  children,
  ...props
}) {
  return (
    <As
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-[var(--radius-control)] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
      ) : (
        Icon && <Icon className="h-4 w-4" />
      )}
      {children}
    </As>
  );
}
