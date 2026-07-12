import api, { mockDelay } from "./api";

// Set to true to fall back to mock login for offline/demo use.
const USE_MOCKS = false;

// Demo directory for the mock. Any of these emails + password "password123"
// will authenticate when USE_MOCKS is true.
// NOTE: "driver" role removed — the real backend's role set is
// admin, fleet_manager, dispatcher, safety_officer, financial_analyst.
const MOCK_USERS = [
  { id: "u1", name: "Priya Nair", email: "fleet.manager@transitops.io", role: "fleet_manager" },
  { id: "u2", name: "Alex Menon", email: "driver@transitops.io", role: "dispatcher" },
  { id: "u3", name: "Rhea Kapoor", email: "safety.officer@transitops.io", role: "safety_officer" },
  { id: "u4", name: "Karan Shah", email: "finance@transitops.io", role: "financial_analyst" },
];

async function login({ email, password }) {
  if (USE_MOCKS) {
    await mockDelay(500);
    const user = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || password !== "password123") {
      const err = new Error("Invalid email or password.");
      err.code = "INVALID_CREDENTIALS";
      throw err;
    }
    const token = `mock-token-${user.id}-${Date.now()}`;
    localStorage.setItem("transitops_token", token);
    localStorage.setItem("transitops_user", JSON.stringify(user));
    return { user, token };
  }

  // Backend wraps every response in { success, message, data }, and the
  // real payload shape is { data: { access_token, user } } — not the
  // flat { token, user } the mock used.
  const { data } = await api.post("/auth/login", { email, password });
  const token = data.data.access_token;
  const user = data.data.user;
  localStorage.setItem("transitops_token", token);
  localStorage.setItem("transitops_user", JSON.stringify(user));
  return { user, token };
}

function logout() {
  localStorage.removeItem("transitops_token");
  localStorage.removeItem("transitops_user");
}

function getStoredUser() {
  const raw = localStorage.getItem("transitops_user");
  return raw ? JSON.parse(raw) : null;
}

function getStoredToken() {
  return localStorage.getItem("transitops_token");
}

// NOTE: there's no POST /auth/register wired here yet — the backend has no
// self-serve signup, so test accounts need to be created directly (ask Sam
// for a seed list, or call POST /auth/register manually via Postman/curl
// once, per test user, before you can log in as them here).

export default { login, logout, getStoredUser, getStoredToken, MOCK_USERS };
