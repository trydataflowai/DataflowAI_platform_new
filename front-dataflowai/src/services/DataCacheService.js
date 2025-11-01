class DataCacheService {
  constructor() {
    this.cache = new Map();
    this.loadingStates = new Map();
    this.CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
  }

  // Generar una clave única para el cache basada en el endpoint y parámetros
  generateKey(endpoint, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {});
    return `${endpoint}:${JSON.stringify(sortedParams)}`;
  }

  // Verificar si el cache es válido
  isValid(cacheEntry) {
    if (!cacheEntry || !cacheEntry.timestamp) return false;
    return Date.now() - cacheEntry.timestamp < this.CACHE_DURATION;
  }

  // Obtener datos del cache
  get(key) {
    const cacheEntry = this.cache.get(key);
    if (this.isValid(cacheEntry)) {
      return cacheEntry.data;
    }
    // Si el cache es inválido, limpiarlo
    this.cache.delete(key);
    return null;
  }

  // Guardar datos en el cache
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Verificar si ya se está cargando
  isLoading(key) {
    return this.loadingStates.get(key) || false;
  }

  // Establecer estado de carga
  setLoading(key, loading) {
    this.loadingStates.set(key, loading);
  }

  // Limpiar cache específico
  clear(key) {
    this.cache.delete(key);
    this.loadingStates.delete(key);
  }

  // Limpiar todo el cache
  clearAll() {
    this.cache.clear();
    this.loadingStates.clear();
  }

  // Obtener estadísticas del cache (útil para debugging)
  getStats() {
    return {
      totalCached: this.cache.size,
      cachedKeys: Array.from(this.cache.keys())
    };
  }
}

// Crear una instancia singleton
const dataCacheService = new DataCacheService();
export default dataCacheService;