import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

export const permissionApi = {
  // Get all permissions with pagination and filters
  async getAll(params = {}) {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.search) searchParams.set('search', params.search);
    if (params.resource) searchParams.set('resource', params.resource);
    
    const response = await fetch(`${API_BASE_URL}/permissions?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get permission by ID
  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/permissions/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Create a new permission
  async create(data) {
    const response = await fetch(`${API_BASE_URL}/permissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Update a permission
  async update(id, data) {
    const response = await fetch(`${API_BASE_URL}/permissions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Delete a permission
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/permissions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

