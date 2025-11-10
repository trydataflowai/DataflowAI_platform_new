// DashboardChurnKpi.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Obtener datos del endpoint dashboard/churn/rate/
 * Retorna el JSON de la API o lanza un error si falla.
 */
export const obtenerChurnKpi = async () => {
  const token = localStorage.getItem('token');

  const res = await fetch(`${API_BASE_URL}dashboard/churn/rate/`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    // Intentamos leer mensaje de error si existe
    let msg = `Error al obtener Churn KPI (${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson && errJson.detail) msg = `${msg}: ${errJson.detail}`;
    } catch (e) {
      // noop
    }
    throw new Error(msg);
  }

  return await res.json();
};
