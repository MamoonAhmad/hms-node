import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

export const providerScheduleApi = {
  async getAll(params = {}) {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.search) searchParams.set('search', params.search);
    if (params.specialtyId) searchParams.set('specialtyId', params.specialtyId);
    if (params.departmentId) searchParams.set('departmentId', params.departmentId);
    if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) searchParams.set('dateTo', params.dateTo);
    if (params.status) searchParams.set('status', params.status);

    if (params.providerIds?.length) {
      searchParams.set('providerIds', params.providerIds.join(','));
    }
    if (params.days?.length) {
      searchParams.set('days', params.days.join(','));
    }

    const response = await fetch(`${API_BASE_URL}/provider-schedules?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/provider-schedules/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async checkOverlap(params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      if (Array.isArray(value)) {
        searchParams.set(key, value.join(','));
      } else {
        searchParams.set(key, value);
      }
    });

    const response = await fetch(`${API_BASE_URL}/provider-schedules/check-overlap?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async create(data) {
    const response = await fetch(`${API_BASE_URL}/provider-schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async update(id, data) {
    const response = await fetch(`${API_BASE_URL}/provider-schedules/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async toggleStatus(id) {
    const response = await fetch(`${API_BASE_URL}/provider-schedules/${id}/toggle-status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/provider-schedules/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
