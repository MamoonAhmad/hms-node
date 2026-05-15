// Mock data for Provider Block Hours (replace with API when backend is ready)
import { providerSchedulesStore } from '@/pages/providers/schedule/providerSchedulesMock';

let nextBlockId = 500;

let blocks = [
  {
    id: 499,
    providerId: 1,
    providerName: 'John Smith',
    days: ['Mon'],
    startTime: '12:00',
    endTime: '13:00',
    effectiveStartDate: '2025-02-01',
    effectiveEndDate: null,
    locations: ['Main Building'],
    reason: 'Lunch break',
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
  return (days1 || []).some((d) => (days2 || []).includes(d));
}

function blockOverlaps(existing, candidate) {
  if (Number(existing.providerId) !== Number(candidate.providerId)) return false;
  if (existing.status !== 'Active' || candidate.status !== 'Active') return false;
  if (!daysOverlap(existing.days, candidate.days)) return false;
  if (
    !dateRangeOverlaps(
      existing.effectiveStartDate,
      existing.effectiveEndDate,
      candidate.effectiveStartDate,
      candidate.effectiveEndDate
    )
  ) {
    return false;
  }
  if (!timeRangesOverlap(existing.startTime, existing.endTime, candidate.startTime, candidate.endTime)) return false;
  return true;
}

async function isWithinProviderSchedule(candidate) {
  const schedules = await providerSchedulesStore.getSchedules({ providerId: candidate.providerId });
  const activeSchedules = schedules.filter((s) => (s.displayStatus || s.status) === 'Active');
  if (activeSchedules.length === 0) return false;

  // For each selected day, there must exist at least one schedule that:
  // - includes that day
  // - has a date range overlapping block date range
  // - fully contains the block's time range
  const startMin = timeToMinutes(candidate.startTime);
  const endMin = timeToMinutes(candidate.endTime);

  return (candidate.days || []).every((day) => {
    const match = activeSchedules.find((s) => {
      if (!(s.days || []).includes(day)) return false;
      if (!dateRangeOverlaps(s.effectiveStartDate, s.effectiveEndDate, candidate.effectiveStartDate, candidate.effectiveEndDate)) return false;
      const schedStart = timeToMinutes(s.startTime);
      const schedEnd = timeToMinutes(s.endTime);
      return schedStart <= startMin && schedEnd >= endMin;
    });
    return !!match;
  });
}

export const providerBlockHoursStore = {
  getProviders(activeOnly = false) {
    return providerSchedulesStore.getProviders(activeOnly);
  },

  getDaysOptions() {
    return providerSchedulesStore.getDaysOptions();
  },

  getLocations() {
    return providerSchedulesStore.getLocations();
  },

  getBlocks(filters = {}) {
    let list = blocks.filter((b) => !b.deleted);
    if (filters.providerId) list = list.filter((b) => Number(b.providerId) === Number(filters.providerId));
    if (filters.day) list = list.filter((b) => (b.days || []).includes(filters.day));
    if (filters.status) list = list.filter((b) => b.status === filters.status);
    return Promise.resolve(list.map((b) => ({ ...b })));
  },

  async checkOverlap({ providerId, startTime, endTime, days, effectiveStartDate, effectiveEndDate, excludeBlockId }) {
    const candidate = {
      providerId,
      startTime,
      endTime,
      days: days || [],
      effectiveStartDate,
      effectiveEndDate: effectiveEndDate || null,
      status: 'Active',
    };

    const conflict = blocks.find((b) => {
      if (b.deleted) return false;
      if (excludeBlockId && b.id === Number(excludeBlockId)) return false;
      return blockOverlaps(b, candidate);
    });
    return Promise.resolve(!!conflict);
  },

  async validateWithinSchedule({ providerId, startTime, endTime, days, effectiveStartDate, effectiveEndDate }) {
    return isWithinProviderSchedule({
      providerId,
      startTime,
      endTime,
      days,
      effectiveStartDate,
      effectiveEndDate: effectiveEndDate || null,
    });
  },

  async createBlock(data) {
    const providerList = await providerSchedulesStore.getProviders(false);
    const provider = providerList.find((p) => Number(p.id) === Number(data.providerId));
    if (!provider) return Promise.reject(new Error('Provider not found'));
    if (provider.status !== 'Active') return Promise.reject(new Error('Only active providers can be blocked'));

    const id = nextBlockId++;
    const block = {
      id,
      providerId: data.providerId,
      providerName: provider ? provider.name : '',
      days: data.days || [],
      startTime: data.startTime || '09:00',
      endTime: data.endTime || '10:00',
      effectiveStartDate: data.effectiveStartDate,
      effectiveEndDate: data.effectiveEndDate || null,
      locations: Array.isArray(data.locations) ? data.locations : [],
      reason: String(data.reason || '').trim(),
      status: data.status || 'Active',
      deleted: false,
    };
    blocks.push(block);
    return Promise.resolve(block);
  },

  async updateBlock(id, data) {
    const idx = blocks.findIndex((b) => b.id === Number(id) && !b.deleted);
    if (idx === -1) return Promise.reject(new Error('Block not found'));
    const providerId = data.providerId !== undefined ? data.providerId : blocks[idx].providerId;
    const providerList = await providerSchedulesStore.getProviders(false);
    const provider = providerList.find((p) => Number(p.id) === Number(providerId));

    blocks[idx] = {
      ...blocks[idx],
      ...data,
      providerId,
      providerName: provider ? provider.name : blocks[idx].providerName,
      effectiveEndDate: data.effectiveEndDate === '' ? null : (data.effectiveEndDate ?? blocks[idx].effectiveEndDate),
      locations: data.locations !== undefined ? (Array.isArray(data.locations) ? data.locations : blocks[idx].locations) : blocks[idx].locations,
      reason: data.reason !== undefined ? String(data.reason || '').trim() : blocks[idx].reason,
    };
    return Promise.resolve(blocks[idx]);
  },

  toggleBlockStatus(id) {
    const idx = blocks.findIndex((b) => b.id === Number(id) && !b.deleted);
    if (idx === -1) return Promise.reject(new Error('Block not found'));
    blocks[idx].status = blocks[idx].status === 'Active' ? 'Inactive' : 'Active';
    return Promise.resolve(blocks[idx]);
  },

  deleteBlock(id) {
    const idx = blocks.findIndex((b) => b.id === Number(id) && !b.deleted);
    if (idx === -1) return Promise.reject(new Error('Block not found'));
    blocks[idx].deleted = true;
    return Promise.resolve(blocks[idx]);
  },
};

