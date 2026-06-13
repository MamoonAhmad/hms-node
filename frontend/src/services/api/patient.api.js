import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

export const patientApi = {
  // Get all patients with pagination and filters
  async getAll(params = {}) {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.search) searchParams.set('search', params.search);
    if (params.gender) searchParams.set('gender', params.gender);
    if (params.mrn) searchParams.set('mrn', params.mrn);
    if (params.firstName) searchParams.set('firstName', params.firstName);
    if (params.lastName) searchParams.set('lastName', params.lastName);
    if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) searchParams.set('dateTo', params.dateTo);
    if (params.registrationStatus) searchParams.set('registrationStatus', params.registrationStatus);
    if (params.consentForm) searchParams.set('consentForm', params.consentForm);
    if (params.insuranceType) searchParams.set('insuranceType', params.insuranceType);
    if (params.listTab) searchParams.set('listTab', params.listTab);
    if (params.insuranceProviderId) searchParams.set('insuranceProviderId', params.insuranceProviderId);
    if (params.providerIds?.length) searchParams.set('providerIds', params.providerIds.join(','));
    if (params.insurancePayerIds?.length) searchParams.set('insurancePayerIds', params.insurancePayerIds.join(','));

    const response = await fetch(`${API_BASE_URL}/patients?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async checkDuplicates(data) {
    const response = await fetch(`${API_BASE_URL}/patients/check-duplicates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async assignToMe(id) {
    const response = await fetch(`${API_BASE_URL}/patients/${id}/assign-me`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get patient by ID
  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Create a new patient
  async create(data) {
    const response = await fetch(`${API_BASE_URL}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
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
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Delete a patient
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

