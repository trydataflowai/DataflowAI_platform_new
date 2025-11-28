// front-dataflowai/src/api/EditarFormulario.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export const obtenerFormularioParaEditar = async (slug) => {
  if (!slug) throw new Error('Slug requerido');
  const res = await fetch(`${API_BASE_URL}formularios/${encodeURIComponent(slug)}/editar/`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || 'Error al obtener formulario');
  }
  return await res.json();
};

export const guardarEdicionFormulario = async (slug, payload) => {
  if (!slug) throw new Error('Slug requerido');
  const res = await fetch(`${API_BASE_URL}formularios/${encodeURIComponent(slug)}/editar/`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text();
    // intenta parsear JSON si viene así
    try {
      const j = JSON.parse(txt);
      throw new Error(j.error || j.detail || JSON.stringify(j));
    } catch {
      throw new Error(txt || 'Error al guardar formulario');
    }
  }

  return await res.json();
};
