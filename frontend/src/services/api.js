const API_BASE_URL = 'http://localhost:3000/api';
const TOKEN_KEY = 'hms_token';

// Re-export from modular API (so @/services/api resolves to this file)
export { authApi } from './api/auth.api.js';
export { locationApi } from './api/location.api.js';
export { departmentApi } from './api/department.api.js';
export { tenantApi } from './api/tenant.api.js';
export { providerApi } from './api/provider.api.js';

function getAuthHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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
    if (params.insuranceProviderId) searchParams.set('insuranceProviderId', params.insuranceProviderId);
    
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
    if (params.provider) searchParams.set('provider', params.provider);
    if (params.date) searchParams.set('date', params.date);
    if (params.patientId) searchParams.set('patientId', params.patientId);

    const response = await fetch(`${API_BASE_URL}/appointments?${searchParams}`);
    return handleResponse(response);
  },

  // Get appointment by ID
  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`);
    return handleResponse(response);
  },

  // Get today's appointments
  async getToday() {
    const response = await fetch(`${API_BASE_URL}/appointments/today`);
    return handleResponse(response);
  },

  // Create a new appointment
  async create(data) {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
      },
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },

  // Delete an appointment
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

export const insuranceProviderApi = {
  // Get all insurance providers with pagination and filters
  async getAll(params = {}) {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.search) searchParams.set('search', params.search);
    if (params.isActive !== undefined) searchParams.set('isActive', params.isActive);

    const response = await fetch(`${API_BASE_URL}/insurance-providers?${searchParams}`);
    return handleResponse(response);
  },

  // Get all active insurance providers (for dropdowns)
  async getActive() {
    const response = await fetch(`${API_BASE_URL}/insurance-providers/active`);
    return handleResponse(response);
  },

  // Get insurance provider by ID
  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/insurance-providers/${id}`);
    return handleResponse(response);
  },

  // Create a new insurance provider
  async create(data) {
    const response = await fetch(`${API_BASE_URL}/insurance-providers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Update an insurance provider
  async update(id, data) {
    const response = await fetch(`${API_BASE_URL}/insurance-providers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Delete an insurance provider
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/insurance-providers/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

export const specialtyApi = {
  async getAll(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.search) searchParams.set('search', params.search);
    if (params.isActive !== undefined) searchParams.set('isActive', params.isActive);

    const response = await fetch(`${API_BASE_URL}/specialties?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  async getActive() {
    const response = await fetch(`${API_BASE_URL}/specialties/active`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  async create(data) {
    const response = await fetch(`${API_BASE_URL}/specialties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  async update(id, data) {
    const response = await fetch(`${API_BASE_URL}/specialties/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/specialties/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

export const subSpecialtyApi = {
  async getAll(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.search) searchParams.set('search', params.search);
    if (params.specialtyId) searchParams.set('specialtyId', params.specialtyId);
    if (params.isActive !== undefined) searchParams.set('isActive', params.isActive);

    const response = await fetch(`${API_BASE_URL}/sub-specialties?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  async create(data) {
    const response = await fetch(`${API_BASE_URL}/sub-specialties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  async update(id, data) {
    const response = await fetch(`${API_BASE_URL}/sub-specialties/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/sub-specialties/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Procedure Categories API
export const procedureCategoryApi = {
  async getAll(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.search) searchParams.set('search', params.search);
    const response = await fetch(`${API_BASE_URL}/procedure-categories?${searchParams}`);
    return handleResponse(response);
  },
  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/procedure-categories/${id}`);
    return handleResponse(response);
  },
  async getAllActive() {
    const response = await fetch(`${API_BASE_URL}/procedure-categories/active`);
    return handleResponse(response);
  },
  async create(data) {
    const response = await fetch(`${API_BASE_URL}/procedure-categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  async update(id, data) {
    const response = await fetch(`${API_BASE_URL}/procedure-categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/procedure-categories/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

// Procedures API
export const procedureApi = {
  async getAll(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.search) searchParams.set('search', params.search);
    if (params.categoryId) searchParams.set('categoryId', params.categoryId);
    const response = await fetch(`${API_BASE_URL}/procedures?${searchParams}`);
    return handleResponse(response);
  },
  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/procedures/${id}`);
    return handleResponse(response);
  },
  async create(data) {
    const response = await fetch(`${API_BASE_URL}/procedures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  async update(id, data) {
    const response = await fetch(`${API_BASE_URL}/procedures/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/procedures/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

// Charge Master API
export const chargeMasterApi = {
  async getAll(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.search) searchParams.set('search', params.search);
    if (params.location) searchParams.set('location', params.location);
    const response = await fetch(`${API_BASE_URL}/charge-master?${searchParams}`);
    return handleResponse(response);
  },
  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/charge-master/${id}`);
    return handleResponse(response);
  },
  async create(data) {
    const response = await fetch(`${API_BASE_URL}/charge-master`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  async update(id, data) {
    const response = await fetch(`${API_BASE_URL}/charge-master/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/charge-master/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

// Users API
export const userApi = {
  async getAll(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.search) searchParams.set('search', params.search);
    const response = await fetch(`${API_BASE_URL}/users?${searchParams}`);
    return handleResponse(response);
  },
  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`);
    return handleResponse(response);
  },
  async create(data) {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  async update(id, data) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

// Roles API
export const roleApi = {
  async getAll(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.search) searchParams.set('search', params.search);
    const response = await fetch(`${API_BASE_URL}/roles?${searchParams}`);
    return handleResponse(response);
  },
  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/roles/${id}`);
    return handleResponse(response);
  },
  async create(data) {
    const response = await fetch(`${API_BASE_URL}/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  async update(id, data) {
    const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

// Permissions API
export const permissionApi = {
  async getAll(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.search) searchParams.set('search', params.search);
    if (params.headerId) searchParams.set('headerId', params.headerId);
    const response = await fetch(`${API_BASE_URL}/permissions?${searchParams}`);
    return handleResponse(response);
  },
  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/permissions/${id}`);
    return handleResponse(response);
  },
  async create(data) {
    const response = await fetch(`${API_BASE_URL}/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  async update(id, data) {
    const response = await fetch(`${API_BASE_URL}/permissions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/permissions/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

// Permission Headers API
export const permissionHeaderApi = {
  async getAll(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.search) searchParams.set('search', params.search);
    const response = await fetch(`${API_BASE_URL}/permission-headers?${searchParams}`);
    return handleResponse(response);
  },
  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/permission-headers/${id}`);
    return handleResponse(response);
  },
  async getAllWithPermissions() {
    const response = await fetch(`${API_BASE_URL}/permission-headers/with-permissions`);
    return handleResponse(response);
  },
  async create(data) {
    const response = await fetch(`${API_BASE_URL}/permission-headers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  async update(id, data) {
    const response = await fetch(`${API_BASE_URL}/permission-headers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/permission-headers/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

// ─── Laboratory Module (mock data until backend exists) ─────────────────────
const LAB_MOCK_STORAGE_KEY = 'hms_lab_mock_data';

function getLabMockData() {
  try {
    const stored = localStorage.getItem(LAB_MOCK_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (_) {}
  const initial = [
    {
      id: 1,
      testId: 'LAB-001',
      testName: 'Complete Blood Count (CBC)',
      department: 'Hematology',
      createdBy: 'Dr. Sarah Smith',
      createdAt: '2025-01-20T10:30:00',
      patientId: 101,
      patient: { name: 'John Doe', mrn: 'MRN-1001', dob: '1980-05-15', gender: 'Male' },
      admission: { admissionId: 'ADM-501', chiefComplaint: 'Chest pain', arrivalMethod: 'Ambulance', roomStatus: 'Roomed', admissionStatus: 'Active' },
      specimenStatus: 'Pending',
      collectionSite: '',
      specimenType: 'Blood',
      collectedBy: '',
      collectionDateTime: '',
      collectionNotes: '',
      specimenNo: '',
      transportCompleted: false,
      originLocation: '',
      originDepartment: '',
      destinationLab: '',
      batchNumber: '',
      transportTimestamp: '',
      transportStaff: '',
      transportCondition: '',
      transportPriority: '',
      transportCarrier: '',
      trackingNumber: '',
      containerType: '',
      transportTemperature: '',
      transportStatus: '',
      transportNotes: '',
      receiveStatus: '',
      receivedTimestamp: '',
      receivedBy: '',
      specimenCondition: '',
      resultStatus: '',
      resultType: '',
      resultDate: '',
      generatedBy: '',
      parameters: [],
      resultNotes: '',
    },
    {
      id: 2,
      testId: 'LAB-002',
      testName: 'Lipid Profile',
      department: 'Chemistry',
      createdBy: 'Dr. John Williams',
      createdAt: '2025-01-20T11:15:00',
      patientId: 102,
      patient: { name: 'Jane Smith', mrn: 'MRN-1002', dob: '1975-08-22', gender: 'Female' },
      admission: { admissionId: 'ADM-502', chiefComplaint: 'Routine checkup', arrivalMethod: 'Walk-in', roomStatus: 'Triage', admissionStatus: 'Active' },
      specimenStatus: 'Collected',
      collectionSite: 'Left Arm',
      specimenType: 'Serum',
      collectedBy: 'Nurse Mary Johnson',
      collectionDateTime: '2025-01-20T13:00:00',
      collectionNotes: 'Fasting sample collected',
      specimenNo: 'SP-20260120-002',
      transportCompleted: false,
      originLocation: 'Ward 3',
      originDepartment: 'Cardiology',
      destinationLab: '',
      batchNumber: '',
      transportTimestamp: '',
      transportStaff: '',
      transportCondition: '',
      transportPriority: '',
      transportCarrier: '',
      trackingNumber: '',
      containerType: '',
      transportTemperature: '',
      transportStatus: '',
      transportNotes: '',
      receiveStatus: '',
      receivedTimestamp: '',
      receivedBy: '',
      specimenCondition: '',
      resultStatus: '',
      resultType: '',
      resultDate: '',
      generatedBy: '',
      parameters: [],
      resultNotes: '',
    },
    {
      id: 3,
      testId: 'LAB-003',
      testName: 'Urine Culture',
      department: 'Microbiology',
      createdBy: 'Dr. Emily Brown',
      createdAt: '2025-01-20T09:00:00',
      patientId: 103,
      patient: { name: 'Robert Lee', mrn: 'MRN-1003', dob: '1990-01-10', gender: 'Male' },
      admission: { admissionId: 'ADM-503', chiefComplaint: 'UTI symptoms', arrivalMethod: 'Walk-in', roomStatus: 'Roomed', admissionStatus: 'Active' },
      specimenStatus: 'Collected',
      collectionSite: 'Urine',
      specimenType: 'Urine',
      collectedBy: 'Lab Technician',
      collectionDateTime: '2025-01-20T10:00:00',
      collectionNotes: 'Mid-stream clean catch',
      specimenNo: 'SP-20260120-003',
      transportCompleted: true,
      originLocation: 'OPD',
      originDepartment: 'Urology',
      destinationLab: 'Microbiology Lab',
      batchNumber: 'BATCH-20260120-1002',
      transportTimestamp: '2025-01-20T10:30:00',
      transportStaff: 'Sara Ali',
      transportCondition: 'Room Temperature',
      transportPriority: 'Routine',
      transportCarrier: 'Lab Staff',
      trackingNumber: 'TRK-0647',
      containerType: 'Sterile Container',
      transportTemperature: '22°C',
      transportStatus: 'Completed',
      transportNotes: 'Delivered on time',
      receiveStatus: 'Pending',
      receivedTimestamp: '',
      receivedBy: '',
      specimenCondition: '',
      resultStatus: '',
      resultType: '',
      resultDate: '',
      generatedBy: '',
      parameters: [],
      resultNotes: '',
    },
    {
      id: 4,
      testId: 'LAB-004',
      testName: 'Basic Metabolic Panel',
      department: 'Chemistry',
      createdBy: 'Dr. Sarah Smith',
      createdAt: '2025-01-21T08:00:00',
      patientId: 101,
      patient: { name: 'John Doe', mrn: 'MRN-1001', dob: '1980-05-15', gender: 'Male' },
      admission: { admissionId: 'ADM-501', chiefComplaint: 'Chest pain', arrivalMethod: 'Ambulance', roomStatus: 'Roomed', admissionStatus: 'Active' },
      specimenStatus: 'Collected',
      collectionSite: 'Right Arm',
      specimenType: 'Serum',
      collectedBy: 'Nurse Jane Doe',
      collectionDateTime: '2025-01-21T08:30:00',
      collectionNotes: 'Fasting',
      specimenNo: 'SP-20260121-004',
      transportCompleted: true,
      originLocation: 'ED',
      originDepartment: 'Emergency Medicine',
      destinationLab: 'Main Laboratory',
      batchNumber: 'BATCH-20260121-0801',
      transportTimestamp: '2025-01-21T09:00:00',
      transportStaff: 'Ahmed Khan',
      transportCondition: 'Refrigerated (2-8°C)',
      transportPriority: 'Stat',
      transportCarrier: 'Lab Staff',
      trackingNumber: 'TRK-0648',
      containerType: 'Vacutainer',
      transportTemperature: '4°C',
      transportStatus: 'Completed',
      transportNotes: '',
      receiveStatus: 'Accepted',
      receivedTimestamp: '2025-01-21T09:15:00',
      receivedBy: 'Lab Tech Mike',
      specimenCondition: 'Good',
      resultStatus: 'Completed',
      resultType: 'Final',
      resultDate: '2025-01-21T11:00:00',
      generatedBy: 'Lab Tech Mike',
      parameters: [
        { name: 'Sodium', resultValue: '140', flag: 'Normal', units: 'mEq/L', referenceRange: '136-145', criticalRange: '', reportableRange: '', analyticalRange: '', method: 'ISE' },
        { name: 'Potassium', resultValue: '4.2', flag: 'Normal', units: 'mEq/L', referenceRange: '3.5-5.0', criticalRange: '', reportableRange: '', analyticalRange: '', method: 'ISE' },
      ],
      resultNotes: '',
    },
    {
      id: 5,
      testId: 'LAB-005',
      testName: 'TSH',
      department: 'Chemistry',
      createdBy: 'Dr. Sarah Smith',
      createdAt: '2025-01-21T09:00:00',
      patientId: 102,
      patient: { name: 'Jane Smith', mrn: 'MRN-1002', dob: '1975-08-22', gender: 'Female' },
      admission: { admissionId: 'ADM-502', chiefComplaint: 'Routine checkup', arrivalMethod: 'Walk-in', roomStatus: 'Triage', admissionStatus: 'Active' },
      specimenStatus: 'Submitted',
      collectionSite: '',
      specimenType: 'Serum',
      collectedBy: '',
      collectionDateTime: '',
      collectionNotes: '',
      specimenNo: '',
      transportCompleted: false,
      originLocation: '',
      originDepartment: '',
      destinationLab: '',
      batchNumber: '',
      transportTimestamp: '',
      transportStaff: '',
      transportCondition: '',
      transportPriority: '',
      transportCarrier: '',
      trackingNumber: '',
      containerType: '',
      transportTemperature: '',
      transportStatus: '',
      transportNotes: '',
      receiveStatus: '',
      receivedTimestamp: '',
      receivedBy: '',
      specimenCondition: '',
      resultStatus: '',
      resultType: '',
      resultDate: '',
      generatedBy: '',
      parameters: [],
      resultNotes: '',
    },
  ];
  try {
    localStorage.setItem(LAB_MOCK_STORAGE_KEY, JSON.stringify(initial));
  } catch (_) {}
  return initial;
}

function saveLabMockData(data) {
  try {
    localStorage.setItem(LAB_MOCK_STORAGE_KEY, JSON.stringify(data));
  } catch (_) {}
}

export const labApi = {
  // Specimen Collection: only Pending + Submitted
  getCollectionList(params = {}) {
    const data = getLabMockData();
    let list = data.filter((r) => r.specimenStatus === 'Pending' || r.specimenStatus === 'Submitted');
    if (params.search) {
      const s = params.search.toLowerCase();
      list = list.filter(
        (r) =>
          (r.testId && r.testId.toLowerCase().includes(s)) ||
          (r.patient?.name && r.patient.name.toLowerCase().includes(s)) ||
          (r.patient?.mrn && r.patient.mrn.toLowerCase().includes(s))
      );
    }
    if (params.testId) list = list.filter((r) => r.testId && r.testId.toLowerCase().includes(String(params.testId).toLowerCase()));
    if (params.patientName) list = list.filter((r) => r.patient?.name && r.patient.name.toLowerCase().includes(String(params.patientName).toLowerCase()));
    if (params.mrn) list = list.filter((r) => r.patient?.mrn && r.patient.mrn.toLowerCase().includes(String(params.mrn).toLowerCase()));
    if (params.specimenStatus) list = list.filter((r) => r.specimenStatus === params.specimenStatus);
    return Promise.resolve({ data: list });
  },

  getPatientSpecimens(patientId, params = {}) {
    const data = getLabMockData();
    let list = data.filter((r) => r.patientId === Number(patientId));
    if (params.testId) list = list.filter((r) => r.testId && r.testId.toLowerCase().includes(String(params.testId).toLowerCase()));
    if (params.testName) list = list.filter((r) => r.testName && r.testName.toLowerCase().includes(String(params.testName).toLowerCase()));
    if (params.specimenType) list = list.filter((r) => r.specimenType === params.specimenType);
    if (params.collectionSite) list = list.filter((r) => r.collectionSite === params.collectionSite);
    if (params.department) list = list.filter((r) => r.department === params.department);
    if (params.specimenStatus) list = list.filter((r) => r.specimenStatus === params.specimenStatus);
    if (params.transportStatus) list = list.filter((r) => r.transportStatus === params.transportStatus);
    return Promise.resolve({ data: list });
  },

  getLabTestById(id) {
    const data = getLabMockData();
    const row = data.find((r) => r.id === Number(id));
    return Promise.resolve(row || null);
  },

  updateLabTest(id, payload) {
    const data = getLabMockData();
    const idx = data.findIndex((r) => r.id === Number(id));
    if (idx === -1) return Promise.reject(new Error('Lab test not found'));
    data[idx] = { ...data[idx], ...payload };
    saveLabMockData(data);
    return Promise.resolve(data[idx]);
  },

  // Specimen Transport: only Specimen Status = Collected
  getTransportList(params = {}) {
    const all = getLabMockData();
    let list = all.filter((r) => r.specimenStatus === 'Collected');
    if (params.search) {
      const s = params.search.toLowerCase();
      list = list.filter(
        (r) =>
          (r.testId && r.testId.toLowerCase().includes(s)) ||
          (r.patient?.name && r.patient.name.toLowerCase().includes(s)) ||
          (r.patient?.mrn && r.patient.mrn.toLowerCase().includes(s))
      );
    }
    return Promise.resolve({ data: list });
  },

  // Specimen Receiver: only Transport Completed = true
  getReceiverList(params = {}) {
    const all = getLabMockData();
    let list = all.filter((r) => r.transportCompleted === true);
    if (params.patientId != null && params.patientId !== '') list = list.filter((r) => r.patientId === Number(params.patientId));
    if (params.testId) list = list.filter((r) => r.testId && r.testId.toLowerCase().includes(String(params.testId).toLowerCase()));
    if (params.specimenNo) list = list.filter((r) => r.specimenNo && r.specimenNo.toLowerCase().includes(String(params.specimenNo).toLowerCase()));
    if (params.patientName) list = list.filter((r) => r.patient?.name && r.patient.name.toLowerCase().includes(String(params.patientName).toLowerCase()));
    if (params.mrn) list = list.filter((r) => r.patient?.mrn && r.patient.mrn.toLowerCase().includes(String(params.mrn).toLowerCase()));
    if (params.testName) list = list.filter((r) => r.testName && r.testName.toLowerCase().includes(String(params.testName).toLowerCase()));
    if (params.department) list = list.filter((r) => r.department === params.department);
    if (params.receiveStatus) list = list.filter((r) => r.receiveStatus === params.receiveStatus);
    if (params.specimenType) list = list.filter((r) => r.specimenType === params.specimenType);
    if (params.collectionSite) list = list.filter((r) => r.collectionSite === params.collectionSite);
    if (params.specimenStatus) list = list.filter((r) => r.specimenStatus === params.specimenStatus);
    if (params.transportStatus) list = list.filter((r) => r.transportStatus === params.transportStatus);
    return Promise.resolve({ data: list });
  },

  // Result Management: only Receive Status = Accepted
  getResultManagementList(params = {}) {
    const all = getLabMockData();
    let list = all.filter((r) => r.receiveStatus === 'Accepted');
    if (params.patientId != null && params.patientId !== '') list = list.filter((r) => r.patientId === Number(params.patientId));
    if (params.testId) list = list.filter((r) => r.testId && r.testId.toLowerCase().includes(String(params.testId).toLowerCase()));
    if (params.testName) list = list.filter((r) => r.testName && r.testName.toLowerCase().includes(String(params.testName).toLowerCase()));
    if (params.specimenStatus) list = list.filter((r) => r.specimenStatus === params.specimenStatus);
    if (params.transportStatus) list = list.filter((r) => r.transportStatus === params.transportStatus);
    if (params.receiveStatus) list = list.filter((r) => r.receiveStatus === params.receiveStatus);
    if (params.resultStatus) list = list.filter((r) => r.resultStatus === params.resultStatus);
    return Promise.resolve({ data: list });
  },

  getResultManagementByPatient() {
    const all = getLabMockData();
    const accepted = all.filter((r) => r.receiveStatus === 'Accepted');
    const byPatient = {};
    accepted.forEach((r) => {
      const pid = r.patientId;
      if (!byPatient[pid]) byPatient[pid] = { patient: r.patient, tests: [] };
      byPatient[pid].tests.push(r);
    });
    return Promise.resolve({ data: Object.values(byPatient) });
  },

  // Outside Labs: list for outside lab orders (same shape as collection list for grouping by patient)
  getOutsideLabsList(params = {}) {
    const data = getLabMockData();
    let list = [...data];
    if (params.search) {
      const s = params.search.toLowerCase();
      list = list.filter(
        (r) =>
          (r.testId && r.testId.toLowerCase().includes(s)) ||
          (r.patient?.name && r.patient.name.toLowerCase().includes(s)) ||
          (r.patient?.mrn && r.patient.mrn.toLowerCase().includes(s))
      );
    }
    if (params.testId) list = list.filter((r) => r.testId && r.testId.toLowerCase().includes(String(params.testId).toLowerCase()));
    if (params.patientName) list = list.filter((r) => r.patient?.name && r.patient.name.toLowerCase().includes(String(params.patientName).toLowerCase()));
    if (params.mrn) list = list.filter((r) => r.patient?.mrn && r.patient.mrn.toLowerCase().includes(String(params.mrn).toLowerCase()));
    return Promise.resolve({ data: list });
  },

  // Outside Labs: patient-specific list with order status, created/updated dates
  getPatientOutsideLabs(patientId, params = {}) {
    const data = getLabMockData();
    let list = data.filter((r) => r.patientId === Number(patientId));
    list = list.map((r) => ({
      ...r,
      orderStatus: r.resultStatus === 'Completed' ? 'Received report' : 'Send out',
      orderCreatedAt: r.createdAt,
      orderUpdatedAt: r.updatedAt || r.createdAt,
    }));
    if (params.testId) list = list.filter((r) => r.testId && r.testId.toLowerCase().includes(String(params.testId).toLowerCase()));
    if (params.testName) list = list.filter((r) => r.testName && r.testName.toLowerCase().includes(String(params.testName).toLowerCase()));
    if (params.orderStatus) list = list.filter((r) => r.orderStatus === params.orderStatus);
    return Promise.resolve({ data: list });
  },

  // Test Catalog
  getTestCatalogList() {
    try {
      const stored = localStorage.getItem('hms_lab_test_catalog');
      const list = stored ? JSON.parse(stored) : [
        { id: 1, testName: 'Complete Blood Count (CBC)', parameterCount: 8 },
        { id: 2, testName: 'Lipid Profile', parameterCount: 5 },
        { id: 3, testName: 'Basic Metabolic Panel', parameterCount: 8 },
      ];
      return Promise.resolve({ data: list });
    } catch (_) {
      return Promise.resolve({ data: [] });
    }
  },

  createTestCatalog(item) {
    const stored = localStorage.getItem('hms_lab_test_catalog');
    const list = stored ? JSON.parse(stored) : [];
    const id = Math.max(0, ...list.map((x) => x.id)) + 1;
    const parameters = item.parameters || [];
    const newItem = {
      id,
      testName: item.testName,
      description: item.description || '',
      parameters,
      parameterCount: parameters.length,
    };
    list.push(newItem);
    localStorage.setItem('hms_lab_test_catalog', JSON.stringify(list));
    return Promise.resolve(newItem);
  },

  deleteTestCatalog(id) {
    const stored = localStorage.getItem('hms_lab_test_catalog');
    const list = stored ? JSON.parse(stored) : [];
    const filtered = list.filter((x) => x.id !== Number(id));
    localStorage.setItem('hms_lab_test_catalog', JSON.stringify(filtered));
    return Promise.resolve();
  },

  getAvailableLabTests() {
    return Promise.resolve({
      data: [
        { id: 'cbc', name: 'Complete Blood Count (CBC)' },
        { id: 'lipid', name: 'Lipid Profile' },
        { id: 'bmp', name: 'Basic Metabolic Panel' },
        { id: 'urine-culture', name: 'Urine Culture' },
        { id: 'tsh', name: 'TSH' },
      ],
    });
  },

  // --- Lab Order Transport (outpatient assigns lab tests; orders sent for collection/transport) ---
  LAB_ORDER_TRANSPORT_KEY: 'hms_lab_order_transport',

  getLabOrderTransportList(params = {}) {
    try {
      const stored = localStorage.getItem(this.LAB_ORDER_TRANSPORT_KEY);
      let list = stored ? JSON.parse(stored) : [];
      if (params.patientId != null && params.patientId !== '') list = list.filter((r) => r.patientId === Number(params.patientId));
      if (params.status) list = list.filter((r) => r.status === params.status);
      if (params.search) {
        const s = String(params.search).toLowerCase();
        list = list.filter(
          (r) =>
            (r.orderNumber && r.orderNumber.toLowerCase().includes(s)) ||
            (r.patient?.name && r.patient.name.toLowerCase().includes(s)) ||
            (r.patient?.mrn && r.patient.mrn.toLowerCase().includes(s))
        );
      }
      if (params.dateFrom) list = list.filter((r) => r.orderDate && new Date(r.orderDate) >= new Date(params.dateFrom));
      if (params.dateTo) list = list.filter((r) => r.orderDate && new Date(r.orderDate) <= new Date(params.dateTo));
      list = list.sort((a, b) => new Date(b.orderDate || 0) - new Date(a.orderDate || 0));
      return Promise.resolve({ data: list });
    } catch (_) {
      return Promise.resolve({ data: [] });
    }
  },

  createLabOrderTransport(payload) {
    const stored = localStorage.getItem(this.LAB_ORDER_TRANSPORT_KEY);
    const list = stored ? JSON.parse(stored) : [];
    const id = list.length ? Math.max(...list.map((x) => x.id)) + 1 : 1;
    const orderNumber = `LOT-${String(id).padStart(5, '0')}`;
    const newOrder = {
      id,
      orderNumber,
      patientId: payload.patientId,
      patient: payload.patient,
      testIds: payload.testIds || [],
      testNames: payload.testNames || [],
      status: 'Draft',
      orderDate: payload.orderDate || new Date().toISOString(),
      orderingProvider: payload.orderingProvider || '',
      clinicalNotes: payload.clinicalNotes || '',
      sentAt: null,
      destination: payload.destination || '',
      createdAt: new Date().toISOString(),
    };
    list.push(newOrder);
    localStorage.setItem(this.LAB_ORDER_TRANSPORT_KEY, JSON.stringify(list));
    return Promise.resolve(newOrder);
  },

  updateLabOrderTransport(id, payload) {
    const stored = localStorage.getItem(this.LAB_ORDER_TRANSPORT_KEY);
    const list = stored ? JSON.parse(stored) : [];
    const idx = list.findIndex((r) => r.id === Number(id));
    if (idx === -1) return Promise.reject(new Error('Order not found'));
    list[idx] = { ...list[idx], ...payload };
    localStorage.setItem(this.LAB_ORDER_TRANSPORT_KEY, JSON.stringify(list));
    return Promise.resolve(list[idx]);
  },

  // --- Lab Report Received (patient brings external lab reports; receive and attach to chart) ---
  LAB_REPORT_RECEIVED_KEY: 'hms_lab_report_received',

  getLabReportReceivedList(params = {}) {
    try {
      const stored = localStorage.getItem(this.LAB_REPORT_RECEIVED_KEY);
      let list = stored ? JSON.parse(stored) : [];
      if (params.patientId != null && params.patientId !== '') list = list.filter((r) => r.patientId === Number(params.patientId));
      if (params.source) list = list.filter((r) => r.source === params.source);
      if (params.search) {
        const s = String(params.search).toLowerCase();
        list = list.filter(
          (r) =>
            (r.patient?.name && r.patient.name.toLowerCase().includes(s)) ||
            (r.patient?.mrn && r.patient.mrn.toLowerCase().includes(s)) ||
            (r.performingLab && r.performingLab.toLowerCase().includes(s))
        );
      }
      if (params.dateFrom) list = list.filter((r) => r.receivedDate && new Date(r.receivedDate) >= new Date(params.dateFrom));
      if (params.dateTo) list = list.filter((r) => r.receivedDate && new Date(r.receivedDate) <= new Date(params.dateTo));
      list = list.sort((a, b) => new Date(b.receivedDate || 0) - new Date(a.receivedDate || 0));
      return Promise.resolve({ data: list });
    } catch (_) {
      return Promise.resolve({ data: [] });
    }
  },

  createLabReportReceived(payload) {
    const stored = localStorage.getItem(this.LAB_REPORT_RECEIVED_KEY);
    const list = stored ? JSON.parse(stored) : [];
    const id = list.length ? Math.max(...list.map((x) => x.id)) + 1 : 1;
    const newReport = {
      id,
      patientId: payload.patientId,
      patient: payload.patient,
      source: payload.source || 'Patient brought',
      receivedDate: payload.receivedDate || new Date().toISOString(),
      receivedBy: payload.receivedBy || '',
      reportDate: payload.reportDate || null,
      performingLab: payload.performingLab || '',
      description: payload.description || '',
      fileName: payload.fileName || null,
      hasAttachment: Boolean(payload.attachmentData),
      attachmentData: payload.attachmentData || null,
      createdAt: new Date().toISOString(),
    };
    list.push(newReport);
    localStorage.setItem(this.LAB_REPORT_RECEIVED_KEY, JSON.stringify(list));
    return Promise.resolve(newReport);
  },
};

// Facility config for order routing (onsite vs external)
export const facilityConfigApi = {
  async getConfig(locationId) {
    const params = locationId ? `?locationId=${encodeURIComponent(locationId)}` : '';
    const response = await fetch(`${API_BASE_URL}/facility-config${params}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Patient orders (persisted, routed by facility config)
export const orderApi = {
  async createOrders({ patientId, appointmentId, locationId, orders, orderedBy }) {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        patientId,
        appointmentId: appointmentId || null,
        locationId: locationId || null,
        orders,
        orderedBy: orderedBy || null,
      }),
    });
    return handleResponse(response);
  },
  async getOrders(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.patientId) searchParams.set('patientId', params.patientId);
    if (params.appointmentId) searchParams.set('appointmentId', params.appointmentId);
    if (params.category) searchParams.set('category', params.category);
    if (params.destination) searchParams.set('destination', params.destination);
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    const response = await fetch(`${API_BASE_URL}/orders?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
