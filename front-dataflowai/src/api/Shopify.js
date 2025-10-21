// src/api/Shopify.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/";

export const ShopifyJs = {
  /**
   * obtenerProductos
   * @param {Object} options
   *  - limit: número de productos por página (opcional)
   *  - all: traer todas las páginas (opcional, booleano)
   */
  obtenerProductos: async ({ limit = 50, all = false } = {}) => {
    try {
      const token = localStorage.getItem("token"); // opcional si tu endpoint necesita auth
      const params = new URLSearchParams();
      if (limit) params.append("limit", String(limit));
      if (all) params.append("all", "1");

      // Asegúrate que API_BASE_URL termina con "/" o concatena adecuadamente
      const sep = API_BASE_URL.endsWith("/") ? "" : "/";
      const url = `${API_BASE_URL}${sep}shopify/products/?${params.toString()}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          // si tu backend requiere auth: Authorization: `Bearer ${token}`
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error ${res.status}: ${text}`);
      }

      const data = await res.json();

      // El endpoint devuelve { products: [...] }
      return data.products || [];
    } catch (err) {
      // lanzar para que el caller lo maneje
      throw err;
    }
  },
};
