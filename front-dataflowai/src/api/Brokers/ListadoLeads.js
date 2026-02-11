// src/api/Brokers/ListadoLeads.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/';

async function _fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = options.headers || {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // si body existe y no es FormData, poner Content-Type JSON
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }
  const opts = { ...options, headers };
  const res = await fetch(url, opts);
  return res;
}

export const obtenerLeadsBroker = async (query = '') => {
  const url = `${API_BASE_URL}brokers/leads/${query ? `?q=${encodeURIComponent(query)}` : ''}`;
  const res = await _fetchWithAuth(url, { method: 'GET' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error obteniendo leads: ${res.status} - ${text}`);
  }
  return await res.json();
};

export const crearLead = async (payload) => {
  // payload no debe contener id_broker
  const res = await _fetchWithAuth(`${API_BASE_URL}brokers/leads/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail || JSON.stringify(body) || `Error creando lead: ${res.status}`);
  }
  return await res.json();
};

export const editarLead = async (id, payload) => {
  const res = await _fetchWithAuth(`${API_BASE_URL}brokers/leads/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail || JSON.stringify(body) || `Error editando lead: ${res.status}`);
  }
  return await res.json();
};

export const importarLeads = async (file) => {
  const form = new FormData();
  form.append('file', file);
  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_BASE_URL}brokers/leads/import/`, {
    method: 'POST',
    headers,
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error importando leads: ${res.status} - ${text}`);
  }
  return await res.json();
};
