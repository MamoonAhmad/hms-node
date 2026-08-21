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

  async getSummary(id, params = {}) {
    const searchParams = new URLSearchParams();
    if (params.encounterId) searchParams.set('encounterId', params.encounterId);
    if (params.mrn) searchParams.set('mrn', params.mrn);
    const query = searchParams.toString();
    const response = await fetch(
      `${API_BASE_URL}/patients/${id}/summary${query ? `?${query}` : ''}`,
      { headers: getAuthHeaders() },
    );
    return handleResponse(response);
  },

  async getAppointmentHistory(id) {
    const response = await fetch(`${API_BASE_URL}/patients/${id}/appointment-history`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getLedger(id) {
    const response = await fetch(`${API_BASE_URL}/patients/${id}/ledger`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getChart(id) {
    const response = await fetch(`${API_BASE_URL}/patients/${id}/chart`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async updateChartStatus(id, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${id}/chart-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async verifyEligibility(id, data = {}) {
    const response = await fetch(`${API_BASE_URL}/patients/${id}/eligibility`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async postPayment(id, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${id}/ledger/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async postCharge(id, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${id}/ledger/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async allocatePayment(id, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${id}/ledger/allocate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async postEra(id, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${id}/ledger/era`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async getAging(id) {
    const response = await fetch(`${API_BASE_URL}/patients/${id}/aging`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async listInsurances(id) {
    const response = await fetch(`${API_BASE_URL}/patients/${id}/insurances`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async createInsurance(id, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${id}/insurances`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateInsurance(id, insuranceId, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${id}/insurances/${insuranceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deactivateInsurance(id, insuranceId) {
    const response = await fetch(`${API_BASE_URL}/patients/${id}/insurances/${insuranceId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getGuarantor(id) {
    const response = await fetch(`${API_BASE_URL}/patients/${id}/guarantor`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async upsertGuarantor(id, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${id}/guarantor`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async mergePatient(targetId, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${targetId}/merge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async getWorklists(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.set('limit', params.limit);
    const query = searchParams.toString();
    const response = await fetch(
      `${API_BASE_URL}/patients/worklists${query ? `?${query}` : ''}`,
      { headers: getAuthHeaders() },
    );
    return handleResponse(response);
  },

  async updateCollectionStatus(id, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${id}/collection-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async reverseLedgerEntry(id, txnId, data = {}) {
    const response = await fetch(`${API_BASE_URL}/patients/${id}/ledger/${txnId}/reverse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async createStatement(id, data = {}) {
    const response = await fetch(`${API_BASE_URL}/patients/${id}/statements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async markStatement(id, statementId, action) {
    const response = await fetch(`${API_BASE_URL}/patients/${id}/statements/${statementId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ action }),
    });
    return handleResponse(response);
  },

  async createClaim(id, data = {}) {
    const response = await fetch(`${API_BASE_URL}/patients/${id}/claims`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateClaim(id, claimId, data) {
    const response = await fetch(`${API_BASE_URL}/patients/${id}/claims/${claimId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async listConsentForms() {
    const response = await fetch(`${API_BASE_URL}/patients/consent-forms`, {
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

