// Mock data for Provider Schedules (replace with API when backend is ready)

const DEFAULT_CLINIC_NAME = 'Main Clinic';

const MOCK_PROVIDERS = [
  { id: 1, firstName: 'John', lastName: 'Smith', specialty: 'Cardiology', subSpecialty: 'Interventional', status: 'Active' },
  { id: 2, firstName: 'Sarah', lastName: 'Johnson', specialty: 'Pediatrics', subSpecialty: 'General', status: 'Active' },
  { id: 3, firstName: 'Michael', lastName: 'Brown', specialty: 'Internal Medicine', subSpecialty: '', status: 'Active' },
  { id: 4, firstName: 'Emily', lastName: 'Davis', specialty: 'Orthopedics', subSpecialty: 'Sports Medicine', status: 'Inactive' },
];

const DAYS_OPTIONS = [
  { value: 'Mon', label: 'Monday' },
  { value: 'Tue', label: 'Tuesday' },
  { value: 'Wed', label: 'Wednesday' },
  { value: 'Thu', label: 'Thursday' },
  { value: 'Fri', label: 'Friday' },
  { value: 'Sat', label: 'Saturday' },
  { value: 'Sun', label: 'Sunday' },
];

const SLOT_DURATIONS = [10, 15, 20, 30];
const APPOINTMENT_TYPES = ['New', 'Follow-up', 'Both'];

let nextScheduleId = 100;
let schedules = [
  {
    id: 99,
    providerId: 1,
    providerName: 'John Smith',
    clinicName: DEFAULT_CLINIC_NAME,
    specialty: 'Cardiology',
    subSpecialty: 'Interventional',
    days: ['Mon', 'Wed', 'Fri'],
    startTime: '09:00',
    endTime: '17:00',
    sameTimeForAllDays: true,
    slotDuration: 30,
    appointmentType: 'Both',
    maxAppointmentsPerSlot: 2,
    locationRoom: 'Room 101',
    teleconsultationAllowed: true,
    effectiveStartDate: '2025-01-01',
    effectiveEndDate: null,
    status: 'Active',
    deleted: false,
  },
];

function timeToMinutes(t) {
  const [h, m] = (t || '00:00').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function dateRangeOverlaps(start1, end1, start2, end2) {
  const s1 = start1 ? new Date(start1).getTime() : 0;
  const e1 = end1 ? new Date(end1).getTime() : Number.MAX_SAFE_INTEGER;
  const s2 = start2 ? new Date(start2).getTime() : 0;
  const e2 = end2 ? new Date(end2).getTime() : Number.MAX_SAFE_INTEGER;
  return s1 < e2 && e1 > s2;
}

function timeRangesOverlap(start1, end1, start2, end2) {
  const a = timeToMinutes(start1);
  const b = timeToMinutes(end1);
  const c = timeToMinutes(start2);
  const d = timeToMinutes(end2);
  return a < d && b > c;
}

function daysOverlap(days1, days2) {
  return days1.some((d) => days2.includes(d));
}

export const providerSchedulesStore = {
  getDefaultClinicName() {
    return Promise.resolve(DEFAULT_CLINIC_NAME);
  },

  getProviders(activeOnly = false) {
    const list = activeOnly ? MOCK_PROVIDERS.filter((p) => p.status === 'Active') : MOCK_PROVIDERS;
    return Promise.resolve(
      list.map((p) => ({
        ...p,
        name: `${p.firstName} ${p.lastName}`,
      }))
    );
  },

  getDaysOptions() {
    return Promise.resolve(DAYS_OPTIONS);
  },

  getSlotDurations() {
    return Promise.resolve(SLOT_DURATIONS);
  },

  getAppointmentTypes() {
    return Promise.resolve(APPOINTMENT_TYPES);
  },

  getSchedules(filters = {}) {
    let list = schedules.filter((s) => !s.deleted);
    if (filters.providerId) list = list.filter((s) => Number(s.providerId) === Number(filters.providerId));
    if (filters.specialty) list = list.filter((s) => (s.specialty || '').toLowerCase().includes(String(filters.specialty).toLowerCase()));
    if (filters.day) list = list.filter((s) => (s.days || []).includes(filters.day));
    if (filters.status) list = list.filter((s) => s.status === filters.status);
    // Auto-mark expired as inactive for display
    const today = new Date().toISOString().split('T')[0];
    return Promise.resolve(
      list.map((s) => {
        const expired = s.effectiveEndDate && s.effectiveEndDate < today;
        return { ...s, displayStatus: expired ? 'Inactive' : s.status };
      })
    );
  },

  getScheduleById(id) {
    const s = schedules.find((s) => s.id === Number(id) && !s.deleted);
    return Promise.resolve(s ? { ...s } : null);
  },

  checkOverlap({ providerId, startTime, endTime, days, effectiveStartDate, effectiveEndDate, excludeScheduleId }) {
    const conflict = schedules.find((s) => {
      if (s.deleted) return false;
      if (excludeScheduleId && s.id === Number(excludeScheduleId)) return false;
      if (Number(s.providerId) !== Number(providerId)) return false;
      if (!daysOverlap(s.days || [], days || [])) return false;
      if (!dateRangeOverlaps(s.effectiveStartDate, s.effectiveEndDate, effectiveStartDate, effectiveEndDate)) return false;
      if (!timeRangesOverlap(s.startTime, s.endTime, startTime, endTime)) return false;
      return true;
    });
    return Promise.resolve(!!conflict);
  },

  createSchedule(data) {
    const provider = MOCK_PROVIDERS.find((p) => p.id === Number(data.providerId));
    if (!provider) return Promise.reject(new Error('Provider not found'));
    if (provider.status !== 'Active') return Promise.reject(new Error('Only active providers can be scheduled'));
    const id = nextScheduleId++;
    const schedule = {
      id,
      providerId: data.providerId,
      providerName: provider ? `${provider.firstName} ${provider.lastName}` : '',
      clinicName: data.clinicName || DEFAULT_CLINIC_NAME,
      specialty: data.specialty || provider?.specialty || '',
      subSpecialty: data.subSpecialty ?? provider?.subSpecialty ?? '',
      days: data.days || [],
      startTime: data.startTime || '09:00',
      endTime: data.endTime || '17:00',
      sameTimeForAllDays: data.sameTimeForAllDays !== false,
      slotDuration: data.slotDuration || 30,
      appointmentType: data.appointmentType || 'Both',
      maxAppointmentsPerSlot: data.maxAppointmentsPerSlot ?? 1,
      locationRoom: data.locationRoom || null,
      teleconsultationAllowed: !!data.teleconsultationAllowed,
      effectiveStartDate: data.effectiveStartDate || new Date().toISOString().split('T')[0],
      effectiveEndDate: data.effectiveEndDate || null,
      status: data.status || 'Active',
      deleted: false,
    };
    schedules.push(schedule);
    return Promise.resolve(schedule);
  },

  updateSchedule(id, data) {
    const idx = schedules.findIndex((s) => s.id === Number(id) && !s.deleted);
    if (idx === -1) return Promise.reject(new Error('Schedule not found'));
    const providerId = data.providerId !== undefined ? data.providerId : schedules[idx].providerId;
    const provider = MOCK_PROVIDERS.find((p) => p.id === Number(providerId));
    schedules[idx] = {
      ...schedules[idx],
      ...data,
      providerName: provider ? `${provider.firstName} ${provider.lastName}` : schedules[idx].providerName,
      specialty: data.specialty !== undefined ? data.specialty : (provider?.specialty ?? schedules[idx].specialty),
      subSpecialty: data.subSpecialty !== undefined ? data.subSpecialty : (provider?.subSpecialty ?? schedules[idx].subSpecialty),
    };
    return Promise.resolve(schedules[idx]);
  },

  toggleScheduleStatus(id) {
    const idx = schedules.findIndex((s) => s.id === Number(id) && !s.deleted);
    if (idx === -1) return Promise.reject(new Error('Schedule not found'));
    schedules[idx].status = schedules[idx].status === 'Active' ? 'Inactive' : 'Active';
    return Promise.resolve(schedules[idx]);
  },

  deleteSchedule(id) {
    const idx = schedules.findIndex((s) => s.id === Number(id) && !s.deleted);
    if (idx === -1) return Promise.reject(new Error('Schedule not found'));
    schedules[idx].deleted = true;
    return Promise.resolve(schedules[idx]);
  },
};
