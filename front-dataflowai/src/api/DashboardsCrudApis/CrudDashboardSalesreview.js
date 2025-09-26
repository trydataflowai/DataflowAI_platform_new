// CrudDashboardSalesreview.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/';

function _getAuthHeaders() {
  const token = localStorage.getItem('token') || '';
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token.replace(/^Bearer\s*/i, '')}` : '',
  };
}

// helper to build query string
function buildQuery(params = {}) {
  const esc = encodeURIComponent;
  return Object.keys(params)
    .filter(k => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .map(k => `${esc(k)}=${esc(params[k])}`).join('&');
}

export const fetchDashSales = async (params = {}) => {
  const qs = buildQuery(params);
  const url = `${API_BASE_URL}api/dashboard_salesreview/${qs ? `?${qs}` : ''}`;
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

export const createDashSale = async (payload) => {
  const res = await fetch(`${API_BASE_URL}api/dashboard_salesreview/`, {
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

export const updateDashSale = async (id, payload) => {
  const res = await fetch(`${API_BASE_URL}api/dashboard_salesreview/${id}/`, {
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

export const deleteDashSale = async (id) => {
  const res = await fetch(`${API_BASE_URL}api/dashboard_salesreview/${id}/`, {
    method: 'DELETE',
    headers: _getAuthHeaders(),
  });
  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }
  return true;
};

// Bulk delete filtered records
export const bulkDeleteDashSales = async (filters = {}) => {
  const url = `${API_BASE_URL}api/dashboard_salesreview/bulk-delete/`;
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
