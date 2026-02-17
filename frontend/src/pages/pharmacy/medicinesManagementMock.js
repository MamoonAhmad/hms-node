const now = new Date();
const formatDate = (d) => d.toISOString().slice(0, 10);

export const medicinesMock = [
  { id: 1, medicationName: 'Lidocaine 1%', emrId: 'EMR-001', genericName: 'Lidocaine', ndc: '00113-0462-10', drugType: 'Injection', unitOfPurchase: 'Vial', quantity: 100, lastInventoryDate: formatDate(now), currentQuantity: 85 },
  { id: 2, medicationName: 'Amoxicillin 500mg', emrId: 'EMR-002', genericName: 'Amoxicillin', ndc: '00093-1071-05', drugType: 'Capsule', unitOfPurchase: 'Bottle', quantity: 500, lastInventoryDate: formatDate(now), currentQuantity: 320 },
  { id: 3, medicationName: 'Metformin 500mg', emrId: 'EMR-003', genericName: 'Metformin HCl', ndc: '00078-0215-05', drugType: 'Tablet', unitOfPurchase: 'Bottle', quantity: 1000, lastInventoryDate: formatDate(now), currentQuantity: 450 },
  { id: 4, medicationName: 'Omeprazole 20mg', emrId: 'EMR-004', genericName: 'Omeprazole', ndc: '00378-0215-05', drugType: 'Capsule', unitOfPurchase: 'Bottle', quantity: 100, lastInventoryDate: formatDate(now), currentQuantity: 62 },
  { id: 5, medicationName: 'Insulin Glargine', emrId: 'EMR-005', genericName: 'Insulin glargine', ndc: '00028-3215-05', drugType: 'Injection', unitOfPurchase: 'Box', quantity: 25, lastInventoryDate: formatDate(now), currentQuantity: 18 },
];

const STORAGE_KEY = 'pharmacy_medicines_management_v1';

export function loadMedicines() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return medicinesMock;
}

export function saveMedicines(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}
