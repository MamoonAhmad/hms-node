import { API_BASE_URL, getAuthHeaders, handleResponse } from './client';

function qs(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      searchParams.set(key, String(value));
    }
  });
  const s = searchParams.toString();
  return s ? `?${s}` : '';
}

async function get(path, params) {
  const response = await fetch(`${API_BASE_URL}${path}${qs(params)}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

async function post(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body || {}),
  });
  return handleResponse(response);
}

async function patch(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body || {}),
  });
  return handleResponse(response);
}

async function put(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body || {}),
  });
  return handleResponse(response);
}

async function del(path) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export const rcmApi = {
  listClaims: (params) => get('/rcm/claims', params),
  getClaim: (id) => get(`/rcm/claims/${id}`),
  createClaim: (body) => post('/rcm/claims', body),
  updateClaim: (id, body) => put(`/rcm/claims/${id}`, body),
  deleteClaim: (id) => del(`/rcm/claims/${id}`),
  copyClaim: (id) => post(`/rcm/claims/${id}/copy`),
  splitClaim: (id, body) => post(`/rcm/claims/${id}/split`, body),
  chargeHistory: (id) => get(`/rcm/claims/${id}/charge-history`),
  electronicPreview: (id) => get(`/rcm/claims/${id}/electronic-preview`),
  printClaim: (id) => get(`/rcm/claims/${id}/print`),
  scrubClaim: (id) => post(`/rcm/claims/${id}/scrub`),
  submitClaim: (id, body) => post(`/rcm/claims/${id}/submit`, body),
  voidClaim: (id, reason) => post(`/rcm/claims/${id}/void`, { reason }),
  acknowledgeClaim: (id, body) => post(`/rcm/claims/${id}/acknowledge`, body),
  simulateEra: (claimId, body) => post(`/rcm/claims/${claimId}/simulate-era`, body),
  verifyEligibility: (body) => post('/rcm/eligibility/verify', body),

  listEras: (params) => get('/rcm/era', params),
  importEra: (body) => post('/rcm/era/import', body),
  postEra: (id) => post(`/rcm/era/${id}/post`),

  listDenials: (params) => get('/rcm/denials', params),
  createDenial: (body) => post('/rcm/denials', body),
  createAppeal: (denialId, body) => post(`/rcm/denials/${denialId}/appeals`, body),
  decideAppeal: (appealId, body) => post(`/rcm/appeals/${appealId}/decide`, body),

  listFollowUps: (params) => get('/rcm/follow-ups', params),
  createFollowUp: (body) => post('/rcm/follow-ups', body),
  completeFollowUp: (id) => post(`/rcm/follow-ups/${id}/complete`),

  listCollections: (params) => get('/rcm/collections', params),
  placeCollections: (body) => post('/rcm/collections', body),
  updateCollections: (id, body) => patch(`/rcm/collections/${id}`, body),

  listStatementCycles: (params) => get('/rcm/statement-cycles', params),
  runStatementCycle: (body) => post('/rcm/statement-cycles', body),
  markStatementCycleSent: (id) => post(`/rcm/statement-cycles/${id}/mark-sent`),

  reportDashboard: () => get('/rcm/reports/dashboard'),
  report: (slug, params) => get(`/rcm/reports/${slug}`, params),

  searchCharges: (params) => get('/rcm/charge-capture/search', params),
};
