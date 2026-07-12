import authService from "./auth";

const DELAY_MS = 400;
function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), DELAY_MS));
}

const NOTIFICATIONS_KEY = "transitops_notification_prefs";
const APPEARANCE_KEY = "transitops_appearance";

const DEFAULT_NOTIFICATIONS = {
  tripStatusUpdates: true,
  maintenanceDue: true,
  fuelLogReminders: false,
  expenseApprovals: true,
  driverLicenseExpiry: true,
};

const DEFAULT_APPEARANCE = {
  theme: "light", // "light" | "dark" — see note in Settings.jsx re: dark tokens
};

// ---- Profile ----------------------------------------------------------

export async function getProfile() {
  const user = authService.getStoredUser();
  return delay(user);
}

export async function updateProfile(payload) {
  const current = authService.getStoredUser();
  const updated = { ...current, ...payload };
  localStorage.setItem("transitops_user", JSON.stringify(updated));
  return delay(updated);
}

// ---- Password / security ----------------------------------------------

// Mock only — validates against the same "password123" every MOCK_USERS
// account uses in auth.js. Swap for a real /auth/change-password call once
// the backend exists; the function signature stays the same.
export async function changePassword({ currentPassword }) {
  await delay(null);
  if (currentPassword !== "password123") {
    const err = new Error("Current password is incorrect.");
    err.code = "INVALID_CURRENT_PASSWORD";
    throw err;
  }
  return { success: true };
}

// ---- Notification preferences ------------------------------------------

export async function getNotificationPreferences() {
  const raw = localStorage.getItem(NOTIFICATIONS_KEY);
  const prefs = raw ? JSON.parse(raw) : DEFAULT_NOTIFICATIONS;
  return delay(prefs);
}

export async function updateNotificationPreferences(prefs) {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(prefs));
  return delay(prefs);
}

// ---- Appearance ---------------------------------------------------------

export async function getAppearance() {
  const raw = localStorage.getItem(APPEARANCE_KEY);
  const appearance = raw ? JSON.parse(raw) : DEFAULT_APPEARANCE;
  return delay(appearance);
}

export async function updateAppearance(appearance) {
  localStorage.setItem(APPEARANCE_KEY, JSON.stringify(appearance));
  return delay(appearance);
}
