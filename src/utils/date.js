export function formatDate(isoDate) {
  if (!isoDate) return "—";
  return new Date(isoDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function isPast(isoDate) {
  if (!isoDate) return false;
  return new Date(isoDate).getTime() < Date.now();
}

// True when the date falls within the next `days` days (and hasn't already passed).
export function isWithinDays(isoDate, days) {
  if (!isoDate) return false;
  const diff = new Date(isoDate).getTime() - Date.now();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}
