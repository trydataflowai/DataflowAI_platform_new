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

/**
 * Cambia la contraseña (ya lo tenías)
 */
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

/**
 * Obtiene todos los usuarios que pertenecen a la misma empresa del usuario autenticado
 * GET /perfil/usuarios/
 */
export const obtenerUsuariosEmpresa = async () => {
  return await requestWithToken('perfil/usuarios/', {
    method: 'GET'
  });
};

/**
 * Crea un usuario en la misma empresa (respeta limites del plan)
 * POST /perfil/usuarios/
 * Body: { nombres, apellidos, correo, contrasena, contrasena_confirm, id_permiso_acceso?, id_estado? }
 */
export const crearUsuario = async (payload) => {
  return await requestWithToken('perfil/usuarios/', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

/**
 * Elimina un usuario (solo si pertenece a la misma empresa)
 * DELETE /perfil/usuarios/<id_usuario>/
 */
export const eliminarUsuario = async (id_usuario) => {
  return await requestWithToken(`perfil/usuarios/${id_usuario}/`, {
    method: 'DELETE'
  });
};

/**
 * Cambia el estado de un usuario (solo si pertenece a la misma empresa)
 * PATCH /perfil/usuarios/<id_usuario>/estado/
 * body: { id_estado }
 */
export const cambiarEstadoUsuario = async (id_usuario, id_estado) => {
  return await requestWithToken(`perfil/usuarios/${id_usuario}/estado/`, {
    method: 'PATCH',
    body: JSON.stringify({ id_estado })
  });
};

/**
 * Obtiene la lista de permisos/roles
 * GET /perfil/permisos/
 */
export const obtenerPermisos = async () => {
  return await requestWithToken('perfil/permisos/', {
    method: 'GET'
  });
};
