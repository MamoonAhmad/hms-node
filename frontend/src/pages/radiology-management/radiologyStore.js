import { createMockRadiologyData } from './mockRadiologyData';

const STORAGE_KEY = 'radiology_management_store_v1';

/** Empty store — no seeded dummy patients/orders. */
function emptyStore() {
  return { patients: [], orders: [] };
}

export function loadRadiologyStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Drop legacy mock seed (ids like p-1001 from createMockRadiologyData)
      const hasLegacyMock =
        Array.isArray(parsed?.patients) &&
        parsed.patients.some((p) => String(p?.id || '').startsWith('p-100'));
      if (hasLegacyMock) {
        const cleared = emptyStore();
        saveRadiologyStore(cleared);
        return cleared;
      }
      return parsed;
    }
  } catch {
    // ignore
  }
  const initial = emptyStore();
  saveRadiologyStore(initial);
  return initial;
}

export function saveRadiologyStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function updateOrder(orderId, patch) {
  const store = loadRadiologyStore();
  const orders = store.orders.map((o) => (o.id === orderId ? { ...o, ...patch } : o));
  const next = { ...store, orders };
  saveRadiologyStore(next);
  return next;
}

export function getPatientById(store, patientId) {
  return store.patients.find((p) => p.id === patientId) || null;
}

export function getOrdersByPatientId(store, patientId) {
  return store.orders.filter((o) => o.patientId === patientId);
}

export function getOrderById(store, orderId) {
  return store.orders.find((o) => o.id === orderId) || null;
}

// Keep export so older imports don't break; do not use for new listings.
export { createMockRadiologyData };
