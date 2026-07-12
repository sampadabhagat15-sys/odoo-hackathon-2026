import { FiChevronDown } from "react-icons/fi";

// options: [{ value, label }] — first option is treated as the "All" state.
export default function FilterDropdown({ label, options, value, onChange }) {
  return (
    <label className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm">
      <span className="text-[var(--color-ink-faint)]">{label}</span>
      <div className="relative flex items-center">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-transparent pr-5 font-medium text-[var(--color-ink)] outline-none"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <FiChevronDown className="pointer-events-none absolute right-0 h-3.5 w-3.5 text-[var(--color-ink-faint)]" />
      </div>
    </label>
  );
}
