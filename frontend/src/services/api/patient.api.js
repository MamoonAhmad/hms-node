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
    if (params.departmentId) searchParams.set('departmentId', params.departmentId);

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

  async deleteWithConfirmation(id, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${id}/delete-confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async getEncounters(id) {
    const response = await fetch(`${API_BASE_URL}/patients/${id}/encounters`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getDocuments(id, params = {}) {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.documentType) searchParams.set('documentType', params.documentType);
    if (params.category) searchParams.set('category', params.category);
    if (params.source) searchParams.set('source', params.source);
    if (params.status) searchParams.set('status', params.status);
    if (params.uploadedBy) searchParams.set('uploadedBy', params.uploadedBy);
    if (params.encounterId) searchParams.set('encounterId', params.encounterId);
    if (params.patientVisible !== undefined) searchParams.set('patientVisible', params.patientVisible);
    if (params.confidential !== undefined) searchParams.set('confidential', params.confidential);
    if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) searchParams.set('dateTo', params.dateTo);
    if (params.includeArchived) searchParams.set('includeArchived', 'true');
    const qs = searchParams.toString();
    const url = `${API_BASE_URL}/patients/${id}/documents${qs ? `?${qs}` : ''}`;
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async createDocument(patientId, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async getDocumentVersions(patientId, documentId) {
    const response = await fetch(
      `${API_BASE_URL}/patients/${patientId}/documents/${documentId}/versions`,
      { headers: getAuthHeaders() },
    );
    return handleResponse(response);
  },

  async replaceDocument(patientId, documentId, data) {
    const response = await fetch(
      `${API_BASE_URL}/patients/${patientId}/documents/${documentId}/replace`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      },
    );
    return handleResponse(response);
  },

  async updateDocumentStatus(patientId, documentId, status) {
    const response = await fetch(
      `${API_BASE_URL}/patients/${patientId}/documents/${documentId}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ status }),
      },
    );
    return handleResponse(response);
  },

  async logDocumentAudit(patientId, documentId, action) {
    const response = await fetch(
      `${API_BASE_URL}/patients/${patientId}/documents/${documentId}/audit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ action }),
      },
    );
    return handleResponse(response);
  },

  async updateDocument(patientId, documentId, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/documents/${documentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteDocument(patientId, documentId) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/documents/${documentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getTimeline(id) {
    const response = await fetch(`${API_BASE_URL}/patients/${id}/timeline`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getSummary(id, params = {}) {
    const searchParams = new URLSearchParams();
    if (params.encounterId) searchParams.set('encounterId', params.encounterId);
    const qs = searchParams.toString();
    const url = `${API_BASE_URL}/patients/${id}/summary${qs ? `?${qs}` : ''}`;
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getProblems(id, params = {}) {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    const qs = searchParams.toString();
    const url = `${API_BASE_URL}/patients/${id}/problems${qs ? `?${qs}` : ''}`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(response);
  },

  async createProblem(patientId, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/problems`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateProblem(patientId, problemId, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/problems/${problemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateProblemStatus(patientId, problemId, status, extras = {}) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/problems/${problemId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ status, ...extras }),
    });
    return handleResponse(response);
  },

  async deleteProblem(patientId, problemId) {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/problems/${problemId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

