import dataCacheService from '../../services/DataCacheService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/";

/**
 * Obtiene las ventas desde el endpoint odoo/order/salescoltrade/
 * Con sistema de cache para evitar recargas innecesarias
 */
export async function fetchSalesColtrade({ all = true, per_page = 200, forceRefresh = false } = {}) {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Token no encontrado en localStorage");
  }

  // Generar clave única para el cache
  const cacheKey = dataCacheService.generateKey('salesColtrade', { all, per_page });

  // Verificar si ya está cargando
  if (dataCacheService.isLoading(cacheKey)) {
    throw new Error("La carga de datos ya está en progreso");
  }

  // Verificar cache (a menos que forceRefresh sea true)
  if (!forceRefresh) {
    const cachedData = dataCacheService.get(cacheKey);
    if (cachedData) {
      console.log('📦 Devolviendo datos desde cache:', cacheKey);
      return cachedData;
    }
  }

  // Si no hay cache o forceRefresh=true, hacer la petición
  try {
    dataCacheService.setLoading(cacheKey, true);
    
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

    const data = await resp.json();
    
    // Guardar en cache
    dataCacheService.set(cacheKey, data);
    console.log('💾 Datos guardados en cache:', cacheKey);
    
    return data;
  } finally {
    dataCacheService.setLoading(cacheKey, false);
  }
}

/**
 * Función para forzar la limpieza del cache específico
 */
export function clearSalesColtradeCache() {
  const cacheKeys = Array.from(dataCacheService.cache.keys())
    .filter(key => key.startsWith('salesColtrade'));
  
  cacheKeys.forEach(key => dataCacheService.clear(key));
  console.log('🧹 Cache de ventas Coltrade limpiado');
}

/**
 * Función para obtener estadísticas del cache (debug)
 */
export function getCacheStats() {
  return dataCacheService.getStats();
}