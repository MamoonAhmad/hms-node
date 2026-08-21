import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

function buildSearchParams(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, value);
    }
  });
  return searchParams;
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body || {}),
  });
  return handleResponse(response);
}

async function putJson(url, body) {
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body || {}),
  });
  return handleResponse(response);
}

export const appointmentApi = {
  async getAll(params = {}) {
    const searchParams = buildSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/appointments?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getStatusCounts(params = {}) {
    const searchParams = buildSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/appointments/status-counts?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getAvailableDates(params = {}) {
    const searchParams = buildSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/appointments/availability/dates?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getAvailableSlots(params = {}) {
    const searchParams = buildSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/appointments/availability/slots?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getHistory(id) {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}/history`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getToday() {
    const response = await fetch(`${API_BASE_URL}/appointments/today`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async create(data) {
    return postJson(`${API_BASE_URL}/appointments`, data);
  },

  async update(id, data) {
    return putJson(`${API_BASE_URL}/appointments/${id}`, data);
  },

  async updateStatus(id, status) {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },

  async getPolicy() {
    const response = await fetch(`${API_BASE_URL}/appointments/policy`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async updatePolicy(body) {
    return putJson(`${API_BASE_URL}/appointments/policy`, body);
  },

  async getReasonCodes(category) {
    const searchParams = buildSearchParams({ category });
    const response = await fetch(`${API_BASE_URL}/appointments/reason-codes?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getPolicyPreview(id, action) {
    const searchParams = buildSearchParams({ action });
    const response = await fetch(
      `${API_BASE_URL}/appointments/${id}/policy-preview?${searchParams}`,
      { headers: getAuthHeaders() },
    );
    return handleResponse(response);
  },

  async cancel(id, body) {
    return postJson(`${API_BASE_URL}/appointments/${id}/cancel`, body);
  },

  async markNoShow(id, body) {
    return postJson(`${API_BASE_URL}/appointments/${id}/no-show`, body);
  },

  async reschedule(id, body) {
    return postJson(`${API_BASE_URL}/appointments/${id}/reschedule`, body);
  },

  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async verifyEligibility(id, body = {}) {
    return postJson(`${API_BASE_URL}/appointments/${id}/eligibility`, body);
  },

  async getEligibility(id) {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}/eligibility`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async setCoverage(id, body) {
    return putJson(`${API_BASE_URL}/appointments/${id}/coverage`, body);
  },

  async confirm(id) {
    return postJson(`${API_BASE_URL}/appointments/${id}/confirm`);
  },

  async markArrived(id) {
    return postJson(`${API_BASE_URL}/appointments/${id}/arrive`);
  },

  async checkIn(id, body = {}) {
    return postJson(`${API_BASE_URL}/appointments/${id}/check-in`, body);
  },

  async markReady(id) {
    return postJson(`${API_BASE_URL}/appointments/${id}/ready`);
  },

  async startVisit(id) {
    return postJson(`${API_BASE_URL}/appointments/${id}/start`);
  },

  async complete(id) {
    return postJson(`${API_BASE_URL}/appointments/${id}/complete`);
  },

  async checkOut(id, body = {}) {
    return postJson(`${API_BASE_URL}/appointments/${id}/check-out`, body);
  },

  async getLedger(id) {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}/ledger`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async collectPayment(id, body) {
    return postJson(`${API_BASE_URL}/appointments/${id}/payments`, body);
  },

  async createAuthorization(id, body) {
    return postJson(`${API_BASE_URL}/appointments/${id}/authorization`, body);
  },

  async getAuthorizations(id) {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}/authorization`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getNotifications(id) {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}/notifications`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async sendNotification(id, body) {
    return postJson(`${API_BASE_URL}/appointments/${id}/notifications`, body);
  },

  async assignRoom(id, body) {
    return postJson(`${API_BASE_URL}/appointments/${id}/room-assignment`, body);
  },

  async releaseRoom(id) {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}/room-assignment`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async upsertTelehealth(id, body) {
    return putJson(`${API_BASE_URL}/appointments/${id}/telehealth`, body);
  },

  async createReferral(id, body) {
    return postJson(`${API_BASE_URL}/appointments/${id}/referral`, body);
  },

  async createRecurring(body) {
    return postJson(`${API_BASE_URL}/appointments/recurring`, body);
  },

  async getWeekCalendar(params = {}) {
    const searchParams = buildSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/appointments/calendar/week?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getReports(params = {}) {
    const searchParams = buildSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/appointments/reports?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async listRooms() {
    const response = await fetch(`${API_BASE_URL}/appointments/rooms`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async runAutoNoShow() {
    return postJson(`${API_BASE_URL}/appointments/jobs/auto-no-show`);
  },

  async getTransitions(id) {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}/transitions`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
