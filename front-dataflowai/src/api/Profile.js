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

  // Si el body no es FormData, ponemos JSON
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
 * Cambia la contraseña del usuario autenticado
 * PATCH /editar/perfil/contrasena
 * body: { contrasena_actual, contrasena_nueva }
 */
export const cambiarContrasena = async (contrasena_actual, contrasena_nueva) => {
  const body = { contrasena_actual, contrasena_nueva };
  return await requestWithToken('editar/perfil/contrasena', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
};

/**
 * Obtener mi perfil (usuario + empresa)
 * GET /perfil/me/
 */
export const obtenerMiPerfil = async () => {
  return await requestWithToken('perfil/me/', { method: 'GET' });
};

/**
 * Actualizar datos del usuario autenticado
 * PATCH /perfil/me/
 */
export const actualizarMiUsuario = async (payload) => {
  // Si se envía correo, normalizar
  if (payload.correo) payload.correo = payload.correo.trim().toLowerCase();
  return await requestWithToken('perfil/me/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
};

/**
 * Obtener info de la empresa del usuario autenticado
 * GET /perfil/empresa/
 */
export const obtenerEmpresa = async () => {
  return await requestWithToken('perfil/empresa/', { method: 'GET' });
};

/**
 * Actualizar empresa
 * PATCH /perfil/empresa/
 */
export const actualizarEmpresa = async (payload) => {
  return await requestWithToken('perfil/empresa/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
};

/* =========================
   Usuarios / Administración
   ========================= */

/**
 * GET /perfil/usuarios/
 */
export const obtenerUsuariosEmpresa = async () => {
  return await requestWithToken('perfil/usuarios/', { method: 'GET' });
};

/**
 * POST /perfil/usuarios/
 * payload: { nombres, apellidos, correo, contrasena, contrasena_confirm, id_area, id_permiso_acceso?, id_estado? }
 */
export const crearUsuario = async (payload) => {
  if (payload.correo) {
    payload.correo = payload.correo.trim().toLowerCase();
  }
  // id_area debe ser number si viene
  if (payload.id_area) payload.id_area = Number(payload.id_area);
  if (payload.id_permiso_acceso) payload.id_permiso_acceso = Number(payload.id_permiso_acceso);
  if (payload.id_estado) payload.id_estado = Number(payload.id_estado);

  return await requestWithToken('perfil/usuarios/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

/**
 * DELETE /perfil/usuarios/<id_usuario>/
 */
export const eliminarUsuario = async (id_usuario) => {
  return await requestWithToken(`perfil/usuarios/${id_usuario}/`, {
    method: 'DELETE',
  });
};

/**
 * PATCH /perfil/usuarios/<id_usuario>/estado/
 * body: { id_estado }
 */
export const cambiarEstadoUsuario = async (id_usuario, id_estado) => {
  return await requestWithToken(`perfil/usuarios/${id_usuario}/estado/`, {
    method: 'PATCH',
    body: JSON.stringify({ id_estado }),
  });
};

/**
 * PATCH /perfil/usuarios/<id_usuario>/rol/
 * body: { id_permiso_acceso }
 */
export const cambiarRolUsuario = async (id_usuario, id_permiso_acceso) => {
  return await requestWithToken(`perfil/usuarios/${id_usuario}/rol/`, {
    method: 'PATCH',
    body: JSON.stringify({ id_permiso_acceso }),
  });
};

/* =========================
   Permisos y Áreas
   ========================= */

/**
 * GET /perfil/permisos/
 */
export const obtenerPermisos = async () => {
  return await requestWithToken('perfil/permisos/', { method: 'GET' });
};

/**
 * GET /perfil/areas/
 */
export const obtenerAreas = async () => {
  return await requestWithToken('perfil/areas/', { method: 'GET' });
};

/* =========================
   Endpoints AsgDashboard (si existen)
   ========================= */

/**
 * GET /asg/perfil/usuarios/
 */
export const AsgDashboard_obtenerUsuariosEmpresa = async () => {
  return await requestWithToken('asg/perfil/usuarios/', { method: 'GET' });
};

/**
 * GET /asg/perfil/productos/
 */
export const AsgDashboard_obtenerProductos = async () => {
  return await requestWithToken('asg/perfil/productos/', { method: 'GET' });
};

/**
 * GET /asg/perfil/usuarios/<id_usuario>/asignaciones/
 */
export const AsgDashboard_obtenerAsignacionesUsuario = async (id_usuario) => {
  return await requestWithToken(`asg/perfil/usuarios/${id_usuario}/asignaciones/`, {
    method: 'GET',
  });
};

/**
 * POST /asg/perfil/usuarios/<id_usuario>/asignaciones/
 * body: { id_producto }
 */
export const AsgDashboard_asignarProductoUsuario = async (id_usuario, id_producto) => {
  return await requestWithToken(`asg/perfil/usuarios/${id_usuario}/asignaciones/`, {
    method: 'POST',
    body: JSON.stringify({ id_producto }),
  });
};

/**
 * DELETE /asg/perfil/usuarios/<id_usuario>/asignaciones/<id_producto>/
 */
export const AsgDashboard_eliminarAsignacionUsuario = async (id_usuario, id_producto) => {
  return await requestWithToken(`asg/perfil/usuarios/${id_usuario}/asignaciones/${id_producto}/`, {
    method: 'DELETE',
  });
};
