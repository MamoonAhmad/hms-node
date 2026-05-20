/** Local mock persistence for Rooms & Beds (until API exists). */

export const ROOMS_STORAGE_KEY = 'hms_patient_management_rooms';
export const BEDS_STORAGE_KEY = 'hms_patient_management_beds';

const defaultRooms = () => [
  {
    id: 'r1',
    roomNumber: '301',
    displayName: 'Med/Surg 301',
    floor: '3',
    unit: 'East Wing',
    roomType: 'med_surg',
    status: 'active',
    licensedBeds: 2,
    notes: '',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'r2',
    roomNumber: 'ICU-4',
    displayName: 'ICU Isolation',
    floor: '4',
    unit: 'ICU',
    roomType: 'icu',
    status: 'active',
    licensedBeds: 1,
    notes: 'Negative pressure capable',
    updatedAt: new Date().toISOString(),
  },
];

const defaultBeds = () => [
  {
    id: 'b1',
    bedLabel: '301-A',
    roomId: 'r1',
    status: 'available',
    patientName: '',
    service: 'General',
    notes: '',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'b2',
    bedLabel: '301-B',
    roomId: 'r1',
    status: 'occupied',
    patientName: 'Demo Patient',
    service: 'General',
    notes: '',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'b3',
    bedLabel: 'ICU-4-1',
    roomId: 'r2',
    status: 'cleaning',
    patientName: '',
    service: 'ICU',
    notes: '',
    updatedAt: new Date().toISOString(),
  },
];

export function loadRooms() {
  try {
    const raw = localStorage.getItem(ROOMS_STORAGE_KEY);
    if (!raw) {
      const seed = defaultRooms();
      localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : defaultRooms();
  } catch {
    return defaultRooms();
  }
}

export function saveRooms(list) {
  try {
    localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function loadBeds() {
  try {
    const raw = localStorage.getItem(BEDS_STORAGE_KEY);
    if (!raw) {
      const seed = defaultBeds();
      localStorage.setItem(BEDS_STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : defaultBeds();
  } catch {
    return defaultBeds();
  }
}

export function saveBeds(list) {
  try {
    localStorage.setItem(BEDS_STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}
