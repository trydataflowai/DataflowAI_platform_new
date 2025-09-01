// src/api/Profile.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function joinUrl(base, path) {
  const b = (base || '').replace(/\/+$/, '');
  const p = (path || '').replace(/^\/+/, '');
  if (!b) return `/${p}`;
  return `${b}/${p}`;
}

async function requestWithToken(path, options = {}) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No token found');

  const headers = options.headers || {};
  headers['Authorization'] = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const url = joinUrl(API_BASE_URL, path);

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    let json = null;
    try { json = JSON.parse(text); } catch (e) {}
    const errMsg = json?.error || json?.detail || text || 'Error en la petición';
    const error = new Error(errMsg);
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) return null;
  return await res.json();
}

export const cambiarContrasena = async (contrasena_actual, contrasena_nueva) => {
  const body = {
    contrasena_actual,
    contrasena_nueva,
  };
  return await requestWithToken('editar/perfil/contrasena', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
};
