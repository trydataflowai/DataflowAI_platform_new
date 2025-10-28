// front-dataflowai/src/api/DashboardsApis/DashboardColtradeOdoo.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/";

/**
 * Obtiene las ventas desde el endpoint odoo/order/salescoltrade/
 * Por defecto trae todo en una sola petición (all=1). Ajusta params si lo deseas.
 *
 * Retorna la respuesta JSON tal cual viene del backend.
 */
export async function fetchSalesColtrade({ all = true, per_page = 200 } = {}) {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Token no encontrado en localStorage");
  }

  let url = `${API_BASE_URL}odoo/order/salescoltrade/`;
  const params = new URLSearchParams();
  if (all) params.set("all", "1");
  else params.set("per_page", String(per_page));
  const fullUrl = `${url}?${params.toString()}`;

  const resp = await fetch(fullUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Error al obtener ventas: ${resp.status} ${resp.statusText} ${text}`);
  }

  return await resp.json();
}
