import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

export const appointmentApi = {
  // Get all appointments with pagination and filters
  async getAll(params = {}) {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.search) searchParams.set('search', params.search);
    if (params.status) searchParams.set('status', params.status);
    if (params.appointmentType) searchParams.set('appointmentType', params.appointmentType);
    if (params.department) searchParams.set('department', params.department);
    if (params.date) searchParams.set('date', params.date);
    if (params.patientId) searchParams.set('patientId', params.patientId);

    const response = await fetch(`${API_BASE_URL}/appointments?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get appointment by ID
  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get today's appointments
  async getToday() {
    const response = await fetch(`${API_BASE_URL}/appointments/today`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Create a new appointment
  async create(data) {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Update an appointment
  async update(id, data) {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Update appointment status
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

  // Delete an appointment
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

