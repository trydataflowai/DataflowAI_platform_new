// DashboardApiCrudVentas.js
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

const BASE = `${API_BASE_URL}DashVeinte/Ventas/`;
const BASE_TIENDAS = `${API_BASE_URL}tiendas/`;
const BASE_PRODUCTOS = `${API_BASE_URL}DashVeinte/Prodcutos/`; // si usaste antes esa ruta

export const fetchDashVeinteVentas = async (params = {}) => {
  const qs = buildQuery(params);
  const url = `${BASE}${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, { method: 'GET', headers: _getAuthHeaders() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }
  return await res.json();
};

export const fetchDashVeinteVenta = async (id) => {
  const res = await fetch(`${BASE}${id}/`, { method: 'GET', headers: _getAuthHeaders() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }
  return await res.json();
};

export const createDashVeinteVenta = async (payload) => {
  const res = await fetch(BASE, { method: 'POST', headers: _getAuthHeaders(), body: JSON.stringify(payload) });
  if (!res.ok) {
    const json = await res.json().catch(()=>null);
    throw new Error(json ? JSON.stringify(json) : `Error ${res.status}`);
  }
  return await res.json();
};

export const updateDashVeinteVenta = async (id, payload, usePut = false) => {
  const res = await fetch(`${BASE}${id}/`, { method: usePut ? 'PUT' : 'PATCH', headers: _getAuthHeaders(), body: JSON.stringify(payload) });
  if (!res.ok) {
    const json = await res.json().catch(()=>null);
    throw new Error(json ? JSON.stringify(json) : `Error ${res.status}`);
  }
  return await res.json();
};

export const deleteDashVeinteVenta = async (id) => {
  const res = await fetch(`${BASE}${id}/`, { method: 'DELETE', headers: _getAuthHeaders() });
  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }
  return true;
};

export const fetchTiendasForSelect = async () => {
  const res = await fetch(BASE_TIENDAS, { method: 'GET', headers: _getAuthHeaders() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }
  return await res.json();
};

export const fetchProductosForSelect = async () => {
  const res = await fetch(BASE_PRODUCTOS, { method: 'GET', headers: _getAuthHeaders() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }
  return await res.json();
};
