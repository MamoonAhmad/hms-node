// Mock data for Outside Laboratories (replace with API when backend is ready)

const LOGGED_IN_PROVIDER = { id: 1, name: 'Dr. John Smith', npi: '1234567890' };

const MOCK_PATIENTS = [
  { id: 1, firstName: 'Alice', lastName: 'Johnson', dob: '1985-03-12', mrn: 'MRN001' },
  { id: 2, firstName: 'Bob', lastName: 'Williams', dob: '1990-07-22', mrn: 'MRN002' },
  { id: 3, firstName: 'Carol', lastName: 'Brown', dob: '1978-11-05', mrn: 'MRN003' },
];

const LAB_TESTS = [
  { id: 'cbc', name: 'Complete Blood Count (CBC)' },
  { id: 'bmp', name: 'Basic Metabolic Panel (BMP)' },
  { id: 'lipid', name: 'Lipid Panel' },
  { id: 'tsh', name: 'TSH' },
  { id: 'hba1c', name: 'HbA1c' },
  { id: 'lft', name: 'Liver Function Test (LFT)' },
  { id: 'urinalysis', name: 'Urinalysis' },
  { id: 'culture', name: 'Culture & Sensitivity' },
];

let nextOrderId = 500;
let nextLabId = 10;
let nextReportId = 1;

let externalLabs = [
  { id: 1, labName: 'City Diagnostic Lab', contactNumber: '(555) 111-2222', address: '123 Main St', status: 'active', deleted: false },
  { id: 2, labName: 'Metro Pathology', contactNumber: '(555) 333-4444', address: '456 Oak Ave', status: 'active', deleted: false },
  { id: 3, labName: 'Valley Clinical Lab', contactNumber: '(555) 555-6666', address: '789 Pine Rd', status: 'inactive', deleted: false },
];

let labOrders = [
  {
    id: 499,
    orderId: 'LAB-499',
    patientId: 1,
    patientName: 'Alice Johnson',
    orderingProviderId: 1,
    orderingProviderName: 'Dr. John Smith',
    labTestIds: ['cbc', 'bmp'],
    labTestNames: 'CBC, BMP',
    clinicalIndication: 'Annual wellness',
    externalLabId: 1,
    externalLabName: 'City Diagnostic Lab',
    priority: 'Routine',
    patientInstructions: 'Fasting required 12 hours',
    orderDate: '2025-02-08',
    status: 'Ordered',
    uploadedReports: [],
    providerReviewed: false,
    providerComments: '',
  },
];

let manualReports = [];

export const outsideLabsStore = {
  getLoggedInProvider() {
    return Promise.resolve(LOGGED_IN_PROVIDER);
  },

  getPatients(search = '') {
    const q = (search || '').toLowerCase().trim();
    const list = q
      ? MOCK_PATIENTS.filter(
          (p) =>
            `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
            p.mrn?.toLowerCase().includes(q)
        )
      : MOCK_PATIENTS;
    return Promise.resolve(list);
  },

  getLabTests() {
    return Promise.resolve(LAB_TESTS);
  },

  getExternalLabs(activeOnly = false) {
    const list = activeOnly ? externalLabs.filter((l) => l.status === 'active') : externalLabs;
    return Promise.resolve(list);
  },

  getLabOrders(filters = {}) {
    let result = [...labOrders];
    if (filters.dateFrom) result = result.filter((o) => o.orderDate >= filters.dateFrom);
    if (filters.dateTo) result = result.filter((o) => o.orderDate <= filters.dateTo);
    if (filters.status) result = result.filter((o) => o.status === filters.status);
    if (filters.externalLabId) result = result.filter((o) => Number(o.externalLabId) === Number(filters.externalLabId));
    if (filters.providerId) result = result.filter((o) => Number(o.orderingProviderId) === Number(filters.providerId));
    return Promise.resolve(result);
  },

  getOrderById(id) {
    const order = labOrders.find((o) => o.id === Number(id));
    return Promise.resolve(order ? { ...order } : null);
  },

  createLabOrder(data) {
    const patient = MOCK_PATIENTS.find((p) => p.id === Number(data.patientId));
    const lab = data.externalLabId ? externalLabs.find((l) => l.id === Number(data.externalLabId)) : null;
    const tests = LAB_TESTS.filter((t) => (data.labTestIds || []).includes(t.id));
    const id = nextOrderId++;
    const orderId = `LAB-${id}`;
    const orderDate = data.orderDate || new Date().toISOString().split('T')[0];
    const externalLabName = lab?.labName || (data.externalLabName && data.externalLabName.trim()) || '';
    const order = {
      id,
      orderId,
      patientId: data.patientId,
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : '',
      orderingProviderId: LOGGED_IN_PROVIDER.id,
      orderingProviderName: LOGGED_IN_PROVIDER.name,
      labTestIds: data.labTestIds || [],
      labTestNames: tests.map((t) => t.name).join(', '),
      clinicalIndication: data.clinicalIndication || '',
      externalLabId: data.externalLabId || null,
      externalLabName,
      priority: data.priority || 'Routine',
      patientInstructions: data.patientInstructions || '',
      orderDate,
      status: data.status || 'Ordered',
      uploadedReports: [],
      providerReviewed: false,
      providerComments: '',
    };
    labOrders.push(order);
    return Promise.resolve(order);
  },

  uploadReport(orderId, data) {
    const order = labOrders.find((o) => o.id === Number(orderId));
    if (!order) return Promise.reject(new Error('Order not found'));
    const report = {
      id: nextReportId++,
      reportType: data.reportType || 'PDF',
      fileName: data.fileName || 'report',
      testDate: data.testDate,
      reportReceivedDate: data.reportReceivedDate,
      remarks: data.remarks || '',
    };
    order.uploadedReports = order.uploadedReports || [];
    order.uploadedReports.push(report);
    order.status = 'Result Received';
    return Promise.resolve(order);
  },

  markResultReceived(orderId) {
    const order = labOrders.find((o) => o.id === Number(orderId));
    if (!order) return Promise.reject(new Error('Order not found'));
    order.status = 'Result Received';
    return Promise.resolve(order);
  },

  markReviewed(orderId, comments) {
    const order = labOrders.find((o) => o.id === Number(orderId));
    if (!order) return Promise.reject(new Error('Order not found'));
    order.providerReviewed = true;
    order.providerComments = comments ?? order.providerComments;
    order.status = order.status === 'Result Received' ? 'Reviewed' : order.status;
    return Promise.resolve(order);
  },

  addProviderComments(orderId, comments) {
    const order = labOrders.find((o) => o.id === Number(orderId));
    if (!order) return Promise.reject(new Error('Order not found'));
    order.providerComments = comments;
    return Promise.resolve(order);
  },

  // External Lab Master CRUD
  getExternalLabsList() {
    return Promise.resolve(externalLabs.filter((l) => !l.deleted));
  },

  createExternalLab(data) {
    const id = nextLabId++;
    const lab = {
      id,
      labName: data.labName?.trim() || '',
      contactNumber: data.contactNumber?.trim() || '',
      address: data.address?.trim() || '',
      status: data.status || 'active',
      deleted: false,
    };
    externalLabs.push(lab);
    return Promise.resolve(lab);
  },

  updateExternalLab(id, data) {
    const idx = externalLabs.findIndex((l) => l.id === Number(id));
    if (idx === -1) return Promise.reject(new Error('Lab not found'));
    externalLabs[idx] = { ...externalLabs[idx], ...data };
    return Promise.resolve(externalLabs[idx]);
  },

  toggleLabStatus(id) {
    const idx = externalLabs.findIndex((l) => l.id === Number(id));
    if (idx === -1) return Promise.reject(new Error('Lab not found'));
    externalLabs[idx].status = externalLabs[idx].status === 'active' ? 'inactive' : 'active';
    return Promise.resolve(externalLabs[idx]);
  },

  getManualReports() {
    return Promise.resolve([...manualReports]);
  },

  // Manual report (no order)
  saveManualReport(data) {
    const patient = MOCK_PATIENTS.find((p) => p.id === Number(data.patientId));
    const labName = (data.externalLabName && data.externalLabName.trim()) || '';
    const report = {
      id: nextReportId++,
      patientId: data.patientId,
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : '',
      externalLabId: null,
      externalLabName: labName,
      testNames: data.testNames || '',
      testDate: data.testDate,
      fileName: data.fileName || '',
      remarks: data.remarks || '',
      source: 'External Report – No Order',
    };
    manualReports.push(report);
    return Promise.resolve(report);
  },
};
