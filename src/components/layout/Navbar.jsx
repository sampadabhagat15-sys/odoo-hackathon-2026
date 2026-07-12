import { useState, useRef, useEffect } from "react";
import { FiMenu, FiChevronDown, FiLogOut, FiUser } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { ROLE_LABELS } from "../../constants/roles";

export default function Navbar({ onToggleSidebar, onToggleMobile, pageTitle }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = (user?.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-soft)] lg:hidden"
          aria-label="Open navigation"
        >
          <FiMenu className="h-5 w-5" />
        </button>
        <button
          onClick={onToggleSidebar}
          className="hidden h-9 w-9 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-soft)] lg:flex"
          aria-label="Collapse navigation"
        >
          <FiMenu className="h-5 w-5" />
        </button>
        <h1 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-ink)] sm:text-lg">
          {pageTitle}
        </h1>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2.5 rounded-[var(--radius-control)] py-1.5 pl-1.5 pr-2.5 hover:bg-[var(--color-surface-soft)]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-console)] text-xs font-semibold text-white">
            {initials}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-medium leading-tight text-[var(--color-ink)]">{user?.name}</span>
            <span className="block text-xs leading-tight text-[var(--color-ink-faint)]">
              {ROLE_LABELS[user?.role] || "—"}
            </span>
          </span>
          <FiChevronDown className="h-4 w-4 text-[var(--color-ink-faint)]" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg shadow-black/5">
            <button className="flex w-full items-center gap-2 px-3.5 py-2 text-sm text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-soft)]">
              <FiUser className="h-4 w-4" /> My profile
            </button>
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 px-3.5 py-2 text-sm text-[var(--color-status-danger)] hover:bg-[var(--color-status-danger-soft)]"
            >
              <FiLogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
