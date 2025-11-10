// DashboardChurnKpi.js (robusto contra barras duplicadas)
const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL || ""; // puede ser "" o "https://mi-backend.com/api" o "/api"
const API_BASE = RAW_API_BASE.replace(/\/+$/, ""); // elimina barras finales

function getAuthHeader() {
  const token = localStorage.getItem('token') || localStorage.getItem('access') || "";
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/**
 * Obtener datos del endpoint dashboard/churn/rate/
 */
export const obtenerChurnKpi = async (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  // construimos URL de forma segura
  const url = `${API_BASE}/dashboard/churn/rate/${qs ? `?${qs}` : ''}`.replace(/\/{2,}/g, '/').replace('http:/', 'http://').replace('https:/', 'https://');
  const res = await fetch(url, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    let msg = `Error al obtener Churn KPI (${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson && (errJson.detail || errJson.error)) msg = `${msg}: ${errJson.detail || errJson.error}`;
    } catch (e) { /* noop */ }
    throw new Error(msg);
  }
  return await res.json();
};
