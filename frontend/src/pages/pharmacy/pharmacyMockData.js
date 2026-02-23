// Mock data for Pharmacy Dashboard (Medication Analytics & Inventory Reports)

const now = new Date();
const last7 = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

export const MEDICATION_STATUSES = ['Pending', 'Dispatched', 'Completed', 'Cancelled', 'Ordered'];

export const medicationOrdersMock = [
  { id: 1, status: 'Pending', orderDate: last7(0).toISOString(), dispatchDate: null, createdAt: last7(0).toISOString() },
  { id: 2, status: 'Dispatched', orderDate: last7(1).toISOString(), dispatchDate: last7(0).toISOString(), createdAt: last7(1).toISOString() },
  { id: 3, status: 'Completed', orderDate: last7(2).toISOString(), dispatchDate: last7(1).toISOString(), createdAt: last7(2).toISOString() },
  { id: 4, status: 'Cancelled', orderDate: last7(3).toISOString(), dispatchDate: null, createdAt: last7(3).toISOString() },
  { id: 5, status: 'Ordered', orderDate: last7(0).toISOString(), dispatchDate: null, createdAt: last7(0).toISOString() },
  ...Array.from({ length: 45 }, (_, i) => ({
    id: 6 + i,
    status: MEDICATION_STATUSES[i % 5],
    orderDate: last7(i % 7).toISOString(),
    dispatchDate: i % 3 === 0 ? last7(i % 7).toISOString() : null,
    createdAt: last7(i % 7).toISOString(),
  })),
];

export const dailyOrdersMock = Array.from({ length: 14 }, (_, i) => ({
  date: last7(13 - i).toISOString().slice(0, 10),
  orders: 12 + Math.floor(Math.random() * 20),
  dispatched: 8 + Math.floor(Math.random() * 12),
}));

export const tatMock = Array.from({ length: 10 }, (_, i) => ({
  day: last7(9 - i).toISOString().slice(0, 10),
  avgTat: 25 + Math.floor(Math.random() * 30),
  benchmark: 45,
}));

export const topMedicationsMock = [
  { name: 'Amoxicillin 500mg', count: 120 },
  { name: 'Lisinopril 10mg', count: 98 },
  { name: 'Metformin 500mg', count: 95 },
  { name: 'Omeprazole 20mg', count: 88 },
  { name: 'Amlodipine 5mg', count: 76 },
  { name: 'Atorvastatin 20mg', count: 72 },
  { name: 'Gabapentin 300mg', count: 65 },
  { name: 'Losartan 50mg', count: 60 },
  { name: 'Sertraline 50mg', count: 55 },
  { name: 'Albuterol Inhaler', count: 50 },
];

export const routesMock = [
  { name: 'Oral', value: 45 },
  { name: 'Injection', value: 20 },
  { name: 'IV', value: 15 },
  { name: 'Topical', value: 10 },
  { name: 'Inhalation', value: 6 },
  { name: 'Other', value: 4 },
];

export const topPrescribersMock = [
  { name: 'Dr. Sarah Smith', count: 85 },
  { name: 'Dr. John Williams', count: 72 },
  { name: 'Dr. Emily Brown', count: 68 },
  { name: 'Dr. Michael Davis', count: 55 },
  { name: 'Dr. Lisa Anderson', count: 48 },
];

export const peakHoursMock = Array.from({ length: 24 }, (_, h) => ({
  hour: `${h}:00`,
  orders: h >= 8 && h <= 18 ? 15 + Math.floor(Math.random() * 25) : Math.floor(Math.random() * 8),
}));

// Inventory
export const STOCK_STATUSES = ['In Stock', 'Low Stock', 'Critical Stock', 'Out of Stock'];
export const DRUG_TYPES = ['Tablet', 'Capsule', 'Inhaler', 'Injection', 'Liquid', 'Cream', 'Other'];

export const inventoryItemsMock = [
  { id: 1, name: 'Amoxicillin 500mg', quantity: 120, drugType: 'Capsule', status: 'In Stock' },
  { id: 2, name: 'Metformin 500mg', quantity: 3, drugType: 'Tablet', status: 'Low Stock' },
  { id: 3, name: 'Insulin Glargine', quantity: 0, drugType: 'Injection', status: 'Out of Stock' },
  { id: 4, name: 'Albuterol Inhaler', quantity: 25, drugType: 'Inhaler', status: 'In Stock' },
  { id: 5, name: 'Omeprazole 20mg', quantity: 2, drugType: 'Capsule', status: 'Critical Stock' },
  ...Array.from({ length: 25 }, (_, i) => ({
    id: 6 + i,
    name: `Medication ${i + 1}`,
    quantity: Math.floor(Math.random() * 150),
    drugType: DRUG_TYPES[i % DRUG_TYPES.length],
    status: ['In Stock', 'Low Stock', 'Critical Stock', 'Out of Stock'][i % 4],
  })),
];

export const stockLevelDistributionMock = [
  { name: 'In Stock', value: 45 },
  { name: 'Low Stock', value: 25 },
  { name: 'Critical Stock', value: 15 },
  { name: 'Out of Stock', value: 15 },
];

export const drugTypeDistributionMock = DRUG_TYPES.map((t, i) => ({
  name: t,
  value: [30, 22, 12, 14, 10, 7, 5][i],
}));

// E-prescribe / Patient list
export const prescriptionPatientsMock = [
  {
    id: 'P1',
    name: 'John Doe',
    mrn: 'MRN-1001',
    dob: '1980-05-15',
    age: 44,
    gender: 'Male',
    admission: { erId: 'ER-501', complaint: 'Chest pain', arrivalMethod: 'Ambulance', status: 'Roomed' },
    medicationCount: 5,
    lastUpdated: last7(0).toISOString(),
    updatedBy: 'Dr. Smith',
  },
  {
    id: 'P2',
    name: 'Jane Smith',
    mrn: 'MRN-1002',
    dob: '1975-08-22',
    age: 49,
    gender: 'Female',
    admission: { erId: 'ER-502', complaint: 'Routine checkup', arrivalMethod: 'Walk-in', status: 'Triage' },
    medicationCount: 3,
    lastUpdated: last7(1).toISOString(),
    updatedBy: 'Nurse Jane',
  },
  {
    id: 'P3',
    name: 'Robert Lee',
    mrn: 'MRN-1003',
    dob: '1990-01-10',
    age: 35,
    gender: 'Male',
    admission: { erId: 'ER-503', complaint: 'UTI symptoms', arrivalMethod: 'Walk-in', status: 'Roomed' },
    medicationCount: 4,
    lastUpdated: last7(0).toISOString(),
    updatedBy: 'Dr. Brown',
  },
];

export const patientMedicationsMock = (patientId) => [
  {
    id: 'M1',
    dateTime: last7(0).toISOString(),
    createdBy: 'Dr. Smith',
    medicationName: 'Amoxicillin 500mg',
    drugProduct: 'Amoxil',
    dosage: '1 capsule TID',
    description: 'Antibiotic',
    comment: 'Take with food',
    priority: 'Routine',
    status: 'Dispatched',
  },
  {
    id: 'M2',
    dateTime: last7(1).toISOString(),
    createdBy: 'Dr. Smith',
    medicationName: 'Lisinopril 10mg',
    drugProduct: 'Prinivil',
    dosage: '1 tablet daily',
    description: 'ACE inhibitor',
    comment: '',
    priority: 'Routine',
    status: 'Pending',
  },
  {
    id: 'M3',
    dateTime: last7(0).toISOString(),
    createdBy: 'Nurse Jane',
    medicationName: 'Omeprazole 20mg',
    drugProduct: 'Prilosec',
    dosage: '1 capsule before breakfast',
    description: 'PPI',
    comment: '',
    priority: 'Urgent',
    status: 'Ordered',
  },
];

export const patientAllergiesMock = (patientId) => [
  { id: 'A1', allergen: 'Penicillin', reaction: 'Rash', severity: 'Moderate' },
  { id: 'A2', allergen: 'Sulfa', reaction: 'Nausea', severity: 'Mild' },
];
