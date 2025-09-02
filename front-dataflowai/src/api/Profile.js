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
 * Perfil (usuario + empresa)
 * GET /perfil/me/
 * PATCH /perfil/me/
 */
export const obtenerMiPerfil = async () => {
  return await requestWithToken('perfil/me/', { method: 'GET' });
};

export const actualizarMiUsuario = async (payload) => {
  // payload: { nombres?, apellidos?, correo? }
  return await requestWithToken('perfil/me/', {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
};

/**
 * Empresa del usuario
 * GET /perfil/empresa/
 * PATCH /perfil/empresa/
 */
export const obtenerEmpresa = async () => {
  return await requestWithToken('perfil/empresa/', { method: 'GET' });
};

export const actualizarEmpresa = async (payload) => {
  // payload: { nombre_empresa?, direccion?, telefono?, ciudad?, pais?, prefijo_pais?, correo?, pagina_web? }
  return await requestWithToken('perfil/empresa/', {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
};

/**
 * Usuarios / administración
 */
export const obtenerUsuariosEmpresa = async () => {
  return await requestWithToken('perfil/usuarios/', {
    method: 'GET'
  });
};

export const crearUsuario = async (payload) => {
  return await requestWithToken('perfil/usuarios/', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const eliminarUsuario = async (id_usuario) => {
  return await requestWithToken(`perfil/usuarios/${id_usuario}/`, {
    method: 'DELETE'
  });
};

export const cambiarEstadoUsuario = async (id_usuario, id_estado) => {
  return await requestWithToken(`perfil/usuarios/${id_usuario}/estado/`, {
    method: 'PATCH',
    body: JSON.stringify({ id_estado })
  });
};

/**
 * Cambiar rol de usuario (PATCH /perfil/usuarios/<id>/rol/)
 * body: { id_permiso_acceso }
 */
export const cambiarRolUsuario = async (id_usuario, id_permiso_acceso) => {
  return await requestWithToken(`perfil/usuarios/${id_usuario}/rol/`, {
    method: 'PATCH',
    body: JSON.stringify({ id_permiso_acceso })
  });
};

export const obtenerPermisos = async () => {
  return await requestWithToken('perfil/permisos/', {
    method: 'GET'
  });
};
