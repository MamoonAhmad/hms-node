const API_BASE_URL = 'http://localhost:5000/api';

async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || 'An error occurred');
  }
  return data;
}

export const patientApi = {
  // Get all patients with pagination and filters
  async getAll(params = {}) {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.search) searchParams.set('search', params.search);
    if (params.gender) searchParams.set('gender', params.gender);
    if (params.insuranceProvider) searchParams.set('insuranceProvider', params.insuranceProvider);
    
    const response = await fetch(`${API_BASE_URL}/patients?${searchParams}`);
    return handleResponse(response);
  },

  // Get patient by ID
  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`);
    return handleResponse(response);
  },

  // Create a new patient
  async create(data) {
    const response = await fetch(`${API_BASE_URL}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Update a patient
  async update(id, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Delete a patient
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};


