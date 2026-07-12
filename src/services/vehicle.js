import api, { mockDelay } from "./api";
import { VEHICLE_STATUS } from "../constants/status";
import { VEHICLE_TYPES } from "../constants/vehicle";

// Flip to false once the real /vehicles endpoints exist. Every function
// below already matches the shape a REST API would use, so that's the only
// change needed — no component code changes.
const USE_MOCKS = true;

const NAMES = [
  "Ashok Leyland Dost", "Tata Ace", "Mahindra Bolero Pickup", "Eicher Pro 2049",
  "Tata 407 Gold", "Force Traveller", "Mahindra Furio 7", "Tata Ultra 1518",
  "Ashok Leyland Boss", "Bharat Benz 1617", "Tata Winger", "Mahindra Supro",
  "Eicher Skyline Pro", "Tata Signa 2825", "Ashok Leyland Partner",
];

const REGIONS = ["North", "South", "East", "West"];

function makeRegNumber(i) {
  const codes = ["DL", "KA", "MH", "TN", "GJ"];
  const code = codes[i % codes.length];
  return `${code}-${(i % 20) + 1}${String.fromCharCode(65 + (i % 5))}-${1000 + i * 7}`;
}

let MOCK_VEHICLES = Array.from({ length: 26 }).map((_, i) => {
  const statusCycle = [
    VEHICLE_STATUS.AVAILABLE,
    VEHICLE_STATUS.AVAILABLE,
    VEHICLE_STATUS.ON_TRIP,
    VEHICLE_STATUS.IN_SHOP,
    VEHICLE_STATUS.AVAILABLE,
    VEHICLE_STATUS.RETIRED,
  ];
  return {
    id: `veh_${i + 1}`,
    registrationNumber: makeRegNumber(i),
    name: NAMES[i % NAMES.length],
    type: VEHICLE_TYPES[i % VEHICLE_TYPES.length],
    maxLoadCapacityKg: [500, 750, 1000, 1500, 2000, 3000][i % 6],
    odometerKm: 8000 + i * 1370,
    acquisitionCost: 650000 + i * 41500,
    status: statusCycle[i % statusCycle.length],
    region: REGIONS[i % REGIONS.length],
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

async function getAll({ search = "", status = "all", type = "all", sortBy = "registrationNumber", sortDir = "asc", page = 1, pageSize = 8 } = {}) {
  if (USE_MOCKS) {
    await mockDelay(400);
    let list = [...MOCK_VEHICLES];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (v) => v.registrationNumber.toLowerCase().includes(q) || v.name.toLowerCase().includes(q)
      );
    }
    if (status !== "all") list = list.filter((v) => v.status === status);
    if (type !== "all") list = list.filter((v) => v.type === type);

    list = sortList(list, sortBy, sortDir);
    const total = list.length;
    const items = paginate(list, page, pageSize);

    return { items, total, page, pageSize };
  }
  const { data } = await api.get("/vehicles", { params: { search, status, type, sortBy, sortDir, page, pageSize } });
  return data;
}

async function create(payload) {
  if (USE_MOCKS) {
    await mockDelay(400);
    const exists = MOCK_VEHICLES.some(
      (v) => v.registrationNumber.toLowerCase() === payload.registrationNumber.toLowerCase()
    );
    if (exists) {
      const err = new Error("A vehicle with this registration number already exists.");
      err.code = "DUPLICATE_REG_NUMBER";
      throw err;
    }
    const vehicle = { id: `veh_${Date.now()}`, status: VEHICLE_STATUS.AVAILABLE, ...payload };
    MOCK_VEHICLES = [vehicle, ...MOCK_VEHICLES];
    return vehicle;
  }
  const { data } = await api.post("/vehicles", payload);
  return data;
}

async function update(id, payload) {
  if (USE_MOCKS) {
    await mockDelay(400);
    const dup = MOCK_VEHICLES.some(
      (v) => v.id !== id && v.registrationNumber.toLowerCase() === payload.registrationNumber.toLowerCase()
    );
    if (dup) {
      const err = new Error("A vehicle with this registration number already exists.");
      err.code = "DUPLICATE_REG_NUMBER";
      throw err;
    }
    MOCK_VEHICLES = MOCK_VEHICLES.map((v) => (v.id === id ? { ...v, ...payload } : v));
    return MOCK_VEHICLES.find((v) => v.id === id);
  }
  const { data } = await api.put(`/vehicles/${id}`, payload);
  return data;
}

async function remove(id) {
  if (USE_MOCKS) {
    await mockDelay(350);
    MOCK_VEHICLES = MOCK_VEHICLES.filter((v) => v.id !== id);
    return { success: true };
  }
  const { data } = await api.delete(`/vehicles/${id}`);
  return data;
}

export default { getAll, create, update, remove };
