// front-dataflowai/src/api/FormBuilder.js
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/';

async function handleResponse(res) {
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch(e) { data = text; }
  if (!res.ok) {
    const err = (data && (data.detail || data.message)) || data || res.statusText;
    throw new Error(typeof err === 'string' ? err : JSON.stringify(err));
  }
  return data;
}

function authHeaders() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export const obtenerInfoUsuario = async () => {
  const res = await fetch(`${API_BASE}usuario/info/`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const createForm = async (payload) => {
  const res = await fetch(`${API_BASE}formularios/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

export const getForm = async (slug) => {
  const res = await fetch(`${API_BASE}formularios/${encodeURIComponent(slug)}/`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const submitForm = async (slug, dataObj) => {
  const res = await fetch(`${API_BASE}formularios/${encodeURIComponent(slug)}/submit/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: dataObj }),
  });
  return handleResponse(res);
};

export const getResponses = async (slug) => {
  const res = await fetch(`${API_BASE}formularios/${encodeURIComponent(slug)}/respuestas/`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
};
