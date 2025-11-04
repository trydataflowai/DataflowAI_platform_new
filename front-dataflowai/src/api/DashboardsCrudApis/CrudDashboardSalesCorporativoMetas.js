// CrudDashboardSalesCorporativoMetas.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/';

function _getAuthHeaders() {
  const token = localStorage.getItem('token') || '';
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token.replace(/^Bearer\s*/i, '')}` : '',
  };
}

function buildQuery(params = {}) {
  const esc = encodeURIComponent;
  const qs = Object.keys(params)
    .filter(k => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .map(k => `${esc(k)}=${esc(params[k])}`).join('&');
  return qs;
}

export const fetchDashMetas = async (params = {}) => {
  const qs = buildQuery(params);
  const url = `${API_BASE_URL}dashboard_salescorporativometas/product15/${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: _getAuthHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }
  return await res.json();
};

export const createDashMeta = async (payload) => {
  const res = await fetch(`${API_BASE_URL}dashboard_salescorporativometas/product15/`, {
    method: 'POST',
    headers: _getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(json ? JSON.stringify(json) : `Error ${res.status}`);
  }
  return await res.json();
};

export const updateDashMeta = async (id, payload) => {
  const res = await fetch(`${API_BASE_URL}dashboard_salescorporativometas/product15/${id}/`, {
    method: 'PATCH',
    headers: _getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(json ? JSON.stringify(json) : `Error ${res.status}`);
  }
  return await res.json();
};

export const deleteDashMeta = async (id) => {
  const res = await fetch(`${API_BASE_URL}dashboard_salescorporativometas/product15/${id}/`, {
    method: 'DELETE',
    headers: _getAuthHeaders(),
  });
  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }
  return true;
};

export const bulkDeleteDashMetas = async (filters = {}) => {
  const url = `${API_BASE_URL}dashboard_salescorporativometas/product15/bulk-delete/`;
  const res = await fetch(url, {
    method: 'POST',
    headers: _getAuthHeaders(),
    body: JSON.stringify(filters),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(json ? JSON.stringify(json) : `Error ${res.status}`);
  }
  return await res.json(); // { deleted: n }
};

export const exportDashMetas = async (filters = {}) => {
  const qs = buildQuery(filters);
  const url = `${API_BASE_URL}dashboard_salescorporativometas/product15/export/${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: _getAuthHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }
  const blob = await res.blob();
  const contentDisposition = res.headers.get('Content-Disposition') || '';
  let filename = 'dashboard_salescorporativometas.xlsx';
  const match = /filename="?([^"]+)"?/.exec(contentDisposition);
  if (match && match[1]) filename = match[1];
  return { blob, filename };
};
