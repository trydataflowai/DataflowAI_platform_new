const API_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const RESOURCE = 'obtener/conetcom_pagos/';
const IMPORT_RESOURCE = 'importar/conetcom_pagos';

const getAuthToken = () => {
  const raw =
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('access') ||
    '';
  const token = String(raw).replace(/^Bearer\s*/i, '').trim();
  if (!token || token === 'undefined' || token === 'null') return '';
  return token;
};

const defaultOptions = () => {
  const token = getAuthToken();
  return {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
};

const buildQuery = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.append(k, v);
  });
  return qs.toString();
};

export const obtenerConetcomPagos = async (params = {}) => {
  if (!getAuthToken()) throw new Error('No hay sesion activa. Inicia sesion nuevamente.');
  const query = buildQuery(params);
  const res = await fetch(`${API_URL}/${RESOURCE}${query ? `?${query}` : ''}`, {
    ...defaultOptions(),
    method: 'GET',
  });
  if (res.status === 401) throw new Error('Sesion invalida o expirada. Vuelve a iniciar sesion.');
  if (!res.ok) throw new Error('Error al obtener conetcom_pagos');
  return await res.json();
};

export const obtenerConetcomPago = async (id) => {
  const res = await fetch(`${API_URL}/${RESOURCE}${id}/`, {
    ...defaultOptions(),
    method: 'GET',
  });
  if (!res.ok) throw new Error('Error al obtener detalle de conetcom_pagos');
  return await res.json();
};

export const crearConetcomPago = async (datos) => {
  const res = await fetch(`${API_URL}/${RESOURCE}`, {
    ...defaultOptions(),
    method: 'POST',
    body: JSON.stringify(datos),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(JSON.stringify(body));
  return body;
};

export const actualizarConetcomPago = async (id, datos, usarPut = false) => {
  const res = await fetch(`${API_URL}/${RESOURCE}${id}/`, {
    ...defaultOptions(),
    method: usarPut ? 'PUT' : 'PATCH',
    body: JSON.stringify(datos),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(JSON.stringify(body));
  return body;
};

export const eliminarConetcomPago = async (id) => {
  const res = await fetch(`${API_URL}/${RESOURCE}${id}/`, {
    ...defaultOptions(),
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 204) throw new Error('Error al eliminar conetcom_pagos');
  return true;
};

export const importarConetcomPagos = async (file) => {
  if (!getAuthToken()) throw new Error('No hay sesion activa. Inicia sesion nuevamente.');
  const formData = new FormData();
  formData.append('file', file);
  const token = getAuthToken();
  const res = await fetch(`${API_URL}/${IMPORT_RESOURCE}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(JSON.stringify(body));
  return body;
};
