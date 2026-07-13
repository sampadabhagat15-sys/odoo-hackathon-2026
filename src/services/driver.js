import api, { mockDelay } from "./api";
import { DRIVER_STATUS } from "../constants/status";
import { LICENSE_CATEGORIES } from "../constants/driver";
import { isPast } from "../utils/date";

// Flip to true to fall back to mock data for offline/demo use.
const USE_MOCKS = false;

const FIRST_NAMES = [
  "Alex", "Priya", "Rahul", "Sneha", "Karan", "Meera", "Arjun", "Divya",
  "Rohan", "Ananya", "Vikram", "Isha", "Nikhil", "Pooja", "Aditya", "Kavya",
  "Suresh", "Neha", "Manoj", "Ritu",
];
const LAST_NAMES = [
  "Menon", "Nair", "Sharma", "Gupta", "Reddy", "Iyer", "Rao", "Kapoor",
  "Verma", "Joshi",
];

function randomPhone(i) {
  return `+91 9${String(800000000 + i * 37421).slice(0, 9)}`;
}

function licenseExpiry(i) {
  const offsets = [-40, -10, 15, 45, 180, 365, 730, 1095];
  const days = offsets[i % offsets.length];
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

let MOCK_DRIVERS = Array.from({ length: 20 }).map((_, i) => {
  const statusCycle = [
    DRIVER_STATUS.AVAILABLE,
    DRIVER_STATUS.AVAILABLE,
    DRIVER_STATUS.ON_TRIP,
    DRIVER_STATUS.OFF_DUTY,
    DRIVER_STATUS.AVAILABLE,
    DRIVER_STATUS.SUSPENDED,
  ];
  return {
    id: `drv_${i + 1}`,
    name: `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[i % LAST_NAMES.length]}`,
    licenseNumber: `DL-${1420 + i}-${20180000 + i * 113}`,
    licenseCategory: LICENSE_CATEGORIES[i % LICENSE_CATEGORIES.length],
    licenseExpiry: licenseExpiry(i),
    contactNumber: randomPhone(i),
    safetyScore: [92, 78, 65, 88, 95, 55, 71, 84][i % 8],
    status: statusCycle[i % statusCycle.length],
  };
});

function paginate(list, page, pageSize) {
  const start = (page - 1) * pageSize;
  return list.slice(start, start + pageSize);
}

function sortList(list, sortBy, sortDir) {
  if (!sortBy) return list;
  const dir = sortDir === "desc" ? -1 : 1;
  return [...list].sort((a, b) => {
    const av = a[sortBy];
    const bv = b[sortBy];
    if (typeof av === "string") return av.localeCompare(bv) * dir;
    return (av - bv) * dir;
  });
}

// backend snake_case -> frontend camelCase
function fromBackend(d) {
  return {
    id: d.id,
    name: d.name,
    licenseNumber: d.license_number,
    licenseCategory: d.license_category,
    licenseExpiry: d.license_expiry_date,
    contactNumber: d.contact_number,
    safetyScore: d.safety_score,
    status: d.status,
  };
}

// frontend camelCase -> backend snake_case, for create/update payloads
function toBackend(payload) {
  return {
    name: payload.name,
    license_number: payload.licenseNumber,
    license_category: payload.licenseCategory,
    license_expiry_date: payload.licenseExpiry,
    contact_number: payload.contactNumber,
    safety_score: payload.safetyScore,
    status: payload.status,
  };
}

async function getAll({ search = "", status = "all", license = "all", sortBy = "name", sortDir = "asc", page = 1, pageSize = 8 } = {}) {
  if (USE_MOCKS) {
    await mockDelay(400);
    let list = [...MOCK_DRIVERS];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((d) => d.name.toLowerCase().includes(q) || d.licenseNumber.toLowerCase().includes(q));
    }
    if (status !== "all") list = list.filter((d) => d.status === status);
    if (license !== "all") list = list.filter((d) => d.licenseCategory === license);

    list = sortList(list, sortBy, sortDir);
    const total = list.length;
    const items = paginate(list, page, pageSize);

    return { items, total, page, pageSize };
  }

  const params = {};
  if (status !== "all") params.status_filter = status;

  const { data } = await api.get("/drivers", { params });
  let list = data.data.map(fromBackend);

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter((d) => d.name.toLowerCase().includes(q) || d.licenseNumber.toLowerCase().includes(q));
  }
  if (license !== "all") list = list.filter((d) => d.licenseCategory === license);

  list = sortList(list, sortBy, sortDir);
  const total = list.length;
  const items = paginate(list, page, pageSize);

  return { items, total, page, pageSize };
}

async function create(payload) {
  if (USE_MOCKS) {
    await mockDelay(400);
    const exists = MOCK_DRIVERS.some((d) => d.licenseNumber.toLowerCase() === payload.licenseNumber.toLowerCase());
    if (exists) {
      const err = new Error("A driver with this license number already exists.");
      err.code = "DUPLICATE_LICENSE_NUMBER";
      throw err;
    }
    const driver = { id: `drv_${Date.now()}`, status: DRIVER_STATUS.AVAILABLE, ...payload };
    MOCK_DRIVERS = [driver, ...MOCK_DRIVERS];
    return driver;
  }
  const { data } = await api.post("/drivers", toBackend(payload));
  return fromBackend(data.data);
}

async function update(id, payload) {
  if (USE_MOCKS) {
    await mockDelay(400);
    const dup = MOCK_DRIVERS.some(
      (d) => d.id !== id && d.licenseNumber.toLowerCase() === payload.licenseNumber.toLowerCase()
    );
    if (dup) {
      const err = new Error("A driver with this license number already exists.");
      err.code = "DUPLICATE_LICENSE_NUMBER";
      throw err;
    }
    MOCK_DRIVERS = MOCK_DRIVERS.map((d) => (d.id === id ? { ...d, ...payload } : d));
    return MOCK_DRIVERS.find((d) => d.id === id);
  }
  const { data } = await api.put(`/drivers/${id}`, toBackend(payload));
  return fromBackend(data.data);
}

// NOTE: the backend has no DELETE /drivers/{id} — only POST
// /drivers/{id}/suspend, which sets status to Suspended rather than
// actually removing the record.
async function remove(id) {
  if (USE_MOCKS) {
    await mockDelay(350);
    MOCK_DRIVERS = MOCK_DRIVERS.filter((d) => d.id !== id);
    return { success: true };
  }
  const { data } = await api.post(`/drivers/${id}/suspend`);
  return fromBackend(data.data);
}

const suspend = remove;

// Un-suspends a driver: POST /drivers/{id}/reactivate, sets status back
// to Available. Backend rejects this if the driver isn't currently
// Suspended (e.g. calling it twice, or on a driver that's Off Duty).
async function reactivate(id) {
  if (USE_MOCKS) {
    await mockDelay(350);
    MOCK_DRIVERS = MOCK_DRIVERS.map((d) => (d.id === id ? { ...d, status: DRIVER_STATUS.AVAILABLE } : d));
    return MOCK_DRIVERS.find((d) => d.id === id);
  }
  const { data } = await api.post(`/drivers/${id}/reactivate`);
  return fromBackend(data.data);
}

function isEligibleForDispatch(driver) {
  return driver.status === DRIVER_STATUS.AVAILABLE && !isPast(driver.licenseExpiry);
}

export default { getAll, create, update, remove, suspend, reactivate, isEligibleForDispatch };
