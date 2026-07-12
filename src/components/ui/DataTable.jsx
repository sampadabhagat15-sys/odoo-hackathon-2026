import { FiChevronUp, FiChevronDown } from "react-icons/fi";
import { TableSkeleton } from "./Loader";

// columns: [{ key, label, sortable?, align?, render?: (row) => node }]
export default function DataTable({ columns, rows, sortBy, sortDir, onSort, loading, emptyState }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-soft)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)] ${
                    col.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => onSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-[var(--color-ink)]"
                    >
                      {col.label}
                      <span className="flex flex-col leading-none">
                        <FiChevronUp
                          className={`-mb-0.5 h-2.5 w-2.5 ${sortBy === col.key && sortDir === "asc" ? "text-[var(--color-signal-dim)]" : "opacity-40"}`}
                        />
                        <FiChevronDown
                          className={`h-2.5 w-2.5 ${sortBy === col.key && sortDir === "desc" ? "text-[var(--color-signal-dim)]" : "opacity-40"}`}
                        />
                      </span>
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  <TableSkeleton rows={6} cols={columns.length} />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12">
                  {emptyState}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--color-border-soft)] last:border-b-0 hover:bg-[var(--color-surface-soft)]">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`whitespace-nowrap px-4 py-3 text-[var(--color-ink)] ${col.align === "right" ? "text-right" : "text-left"}`}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
