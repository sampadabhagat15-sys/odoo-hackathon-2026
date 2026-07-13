import api, { mockDelay } from "./api";
import { VEHICLE_STATUS } from "../constants/status";
import { VEHICLE_TYPES } from "../constants/vehicle";

// Flip to true to fall back to mock data for offline/demo use.
const USE_MOCKS = false;

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

// backend snake_case -> frontend camelCase
function fromBackend(v) {
  return {
    id: v.id,
    registrationNumber: v.registration_number,
    name: v.name,
    type: v.type,
    maxLoadCapacityKg: v.max_load_capacity,
    odometerKm: v.odometer,
    acquisitionCost: v.acquisition_cost,
    status: v.status,
    region: v.region,
  };
}

// frontend camelCase -> backend snake_case, for create/update payloads
function toBackend(payload) {
  return {
    registration_number: payload.registrationNumber,
    name: payload.name,
    type: payload.type,
    max_load_capacity: payload.maxLoadCapacityKg,
    odometer: payload.odometerKm,
    acquisition_cost: payload.acquisitionCost,
    status: payload.status,
    region: payload.region,
  };
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

  // Backend only supports type, status_filter, region as query params —
  // no search, no sortBy, no pagination. Fetch the (type/status-filtered)
  // list, then do search + sort + pagination client-side, same as mock.
  const params = {};
  if (type !== "all") params.type = type;
  if (status !== "all") params.status_filter = status;

  const { data } = await api.get("/vehicles", { params });
  let list = data.data.map(fromBackend);

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (v) => v.registrationNumber.toLowerCase().includes(q) || v.name.toLowerCase().includes(q)
    );
  }

  list = sortList(list, sortBy, sortDir);
  const total = list.length;
  const items = paginate(list, page, pageSize);

  return { items, total, page, pageSize };
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
  const { data } = await api.post("/vehicles", toBackend(payload));
  return fromBackend(data.data);
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
  const { data } = await api.put(`/vehicles/${id}`, toBackend(payload));
  return fromBackend(data.data);
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
