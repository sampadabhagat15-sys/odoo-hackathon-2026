import api, { mockDelay } from "./api";
import { DRIVER_STATUS } from "../constants/status";
import { LICENSE_CATEGORIES } from "../constants/driver";
import { isPast } from "../utils/date";

// Flip to false once the real /drivers endpoints exist.
const USE_MOCKS = true;

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
  // Spread expiries: some already expired, some expiring soon, most valid for years.
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
  const { data } = await api.get("/drivers", { params: { search, status, license, sortBy, sortDir, page, pageSize } });
  return data;
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
  const { data } = await api.post("/drivers", payload);
  return data;
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
  const { data } = await api.put(`/drivers/${id}`, payload);
  return data;
}

async function remove(id) {
  if (USE_MOCKS) {
    await mockDelay(350);
    MOCK_DRIVERS = MOCK_DRIVERS.filter((d) => d.id !== id);
    return { success: true };
  }
  const { data } = await api.delete(`/drivers/${id}`);
  return data;
}

// Convenience used by Trip Management later: only drivers eligible for dispatch
// (Available, valid license). Kept here since it's a driver-data concern.
function isEligibleForDispatch(driver) {
  return driver.status === DRIVER_STATUS.AVAILABLE && !isPast(driver.licenseExpiry);
}

export default { getAll, create, update, remove, isEligibleForDispatch };
