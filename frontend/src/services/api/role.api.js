import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

export const roleApi = {
  // Get all roles with pagination and filters
  async getAll(params = {}) {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.search) searchParams.set('search', params.search);
    if (params.isActive !== undefined && params.isActive !== '') {
      searchParams.set('isActive', params.isActive);
    }
    
    const response = await fetch(`${API_BASE_URL}/roles?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get role by ID
  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Create a new role
  async create(data) {
    const response = await fetch(`${API_BASE_URL}/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Update a role
  async update(id, data) {
    const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Delete a role
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
