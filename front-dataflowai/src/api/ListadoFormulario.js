// front-dataflowai/src/api/ListadoFormulario.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const obtenerFormulariosEmpresa = async () => {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No hay token almacenado');
  }

  const response = await fetch(
    `${API_BASE_URL}formularios/empresa/listado/`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Error al obtener formularios');
  }

  return await response.json();
};
