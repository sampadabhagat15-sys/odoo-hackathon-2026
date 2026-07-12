import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

export default function Pagination({ page, pageSize, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border-soft)] px-4 py-3">
      <p className="text-xs text-[var(--color-ink-faint)]">
        {total === 0 ? "No results" : `Showing ${start}–${end} of ${total}`}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border)] text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-soft)] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <FiChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="px-1.5 text-xs font-medium text-[var(--color-ink-soft)]">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border)] text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-soft)] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <FiChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
