// DashboardApiCrudTiendas.js
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

// Ajusta BASE si tu endpoint tiene prefijo (ej: /api/tiendas/). Aquí asumimos: <API_BASE_URL>/tiendas/
const BASE = `${API_BASE_URL}tiendas/`;

/**
 * Listar tiendas (opcional query params)
 * params: { search, page, page_size, ... }
 */
export const fetchTiendas = async (params = {}) => {
  const qs = buildQuery(params);
  const url = `${BASE}${qs ? `?${qs}` : ''}`;
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

/**
 * Obtener una tienda por id
 */
export const fetchTienda = async (id) => {
  const res = await fetch(`${BASE}${id}/`, {
    method: 'GET',
    headers: _getAuthHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }
  return await res.json();
};

/**
 * Crear tienda
 * payload: { nombre_tienda, direccion_tienda, horario_tienda, ciudad, telefono, email, canal, estado }
 * id_empresa NO se debe incluir: backend lo toma del token.
 */
export const createTienda = async (payload) => {
  const res = await fetch(BASE, {
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

/**
 * Actualizar tienda (PATCH por defecto)
 */
export const updateTienda = async (id, payload, usePut = false) => {
  const res = await fetch(`${BASE}${id}/`, {
    method: usePut ? 'PUT' : 'PATCH',
    headers: _getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(json ? JSON.stringify(json) : `Error ${res.status}`);
  }
  return await res.json();
};

/**
 * Eliminar tienda
 */
export const deleteTienda = async (id) => {
  const res = await fetch(`${BASE}${id}/`, {
    method: 'DELETE',
    headers: _getAuthHeaders(),
  });
  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }
  return true;
};

/**
 * Exportar (si tu backend soporta export endpoint similar)
 * Ajusta la ruta si tu backend difiere.
 */
export const exportTiendas = async (filters = {}) => {
  const qs = buildQuery(filters);
  const url = `${BASE}export/${qs ? `?${qs}` : ''}`;
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
  let filename = 'tiendas.xlsx';
  const match = /filename="?([^"]+)"?/.exec(contentDisposition);
  if (match && match[1]) filename = match[1];
  return { blob, filename };
};
