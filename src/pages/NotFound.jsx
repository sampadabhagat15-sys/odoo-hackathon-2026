import { Link } from "react-router-dom";
import { FiAlertOctagon } from "react-icons/fi";
import Button from "../components/ui/Button";
import { ROUTES } from "../constants/routes";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--color-bg)] px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-status-danger-soft)] text-[var(--color-status-danger)]">
        <FiAlertOctagon className="h-6 w-6" />
      </span>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">
        Page not found
      </h1>
      <p className="max-w-sm text-sm text-[var(--color-ink-faint)]">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Button as={Link} to={ROUTES.DASHBOARD} variant="signal" className="mt-2">
        Back to dashboard
      </Button>
    </div>
  );
}
