import api, { mockDelay } from "./api";

// Set to false once POST /auth/login exists on the backend.
const USE_MOCKS = false;

// Demo directory for the mock. Any of these emails + password "password123"
// will authenticate. Swapping USE_MOCKS to false removes this entirely.
const MOCK_USERS = [
  { id: "u1", name: "Priya Nair", email: "fleet.manager@transitops.io", role: "fleet_manager" },
  { id: "u2", name: "Alex Menon", email: "driver@transitops.io", role: "driver" },
  { id: "u3", name: "Rhea Kapoor", email: "safety.officer@transitops.io", role: "safety_officer" },
  { id: "u4", name: "Karan Shah", email: "finance@transitops.io", role: "financial_analyst" },
];

// Backend returns { id, email, full_name, role, is_active } — mapped here
// to { id, email, name, role } so the rest of the app (built against the
// mock's shape, which used `name`) doesn't need to change anywhere else.
function userFromBackend(u) {
  return {
    id: u.id,
    name: u.full_name,
    email: u.email,
    role: u.role,
  };
}

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

  // Backend wraps every response as { success, message, data: {...} } —
  // the actual payload is response.data.data, not response.data.
  const { data: envelope } = await api.post("/auth/login", { email, password });
  const token = envelope.data.access_token;
  const user = userFromBackend(envelope.data.user);

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

export default { login, logout, getStoredUser, getStoredToken, MOCK_USERS };
