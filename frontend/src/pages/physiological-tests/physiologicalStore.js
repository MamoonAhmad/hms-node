import { createMockPhysiologicalData } from './mockPhysiologicalData';

const STORAGE_KEY = 'physiological_tests_store_v1';

export function loadPhysiologicalStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  const initial = createMockPhysiologicalData();
  savePhysiologicalStore(initial);
  return initial;
}

export function savePhysiologicalStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function updateOrder(orderId, patch) {
  const store = loadPhysiologicalStore();
  const orders = store.orders.map((o) => (o.id === orderId ? { ...o, ...patch } : o));
  const next = { ...store, orders };
  savePhysiologicalStore(next);
  return next;
}

export function getPatientById(store, patientId) {
  return store.patients.find((p) => p.id === patientId) || null;
}

export function getOrdersByPatientId(store, patientId) {
  return store.orders.filter((o) => o.patientId === patientId);
}

export function getOrdersByPatientIdOnsite(store, patientId) {
  return store.orders.filter((o) => o.patientId === patientId && !o.isOutside);
}

export function getOrdersByPatientIdOutside(store, patientId) {
  return store.orders.filter((o) => o.patientId === patientId && o.isOutside);
}

export function getOrderById(store, orderId) {
  return store.orders.find((o) => o.id === orderId) || null;
}
