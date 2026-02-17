import { createMockRadiologyData } from './mockRadiologyData';

const STORAGE_KEY = 'radiology_management_store_v1';

export function loadRadiologyStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  const initial = createMockRadiologyData();
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

