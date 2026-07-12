import { useEffect, useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";

export default function SearchBar({ value, onChange, placeholder = "Search…", debounceMs = 300 }) {
  const [local, setLocal] = useState(value);

  useEffect(() => setLocal(value), [value]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (local !== value) onChange(local);
    }, debounceMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  return (
    <div className="relative w-full max-w-xs">
      <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-faint)]" />
      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-9 pr-8 text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)] focus:ring-2 focus:ring-[var(--color-signal)]"
      />
      {local && (
        <button
          onClick={() => setLocal("")}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
        >
          <FiX className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
