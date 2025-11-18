import dataCacheService from '../../services/DataCacheService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/";

function buildQueryFromParams(params = {}) {
  const qp = new URLSearchParams();
  Object.keys(params).forEach(key => {
    const val = params[key];
    if (val === undefined || val === null || val === '') return;

    if (Array.isArray(val)) {
      if (val.length === 0) return;
      val.forEach(v => {
        if (v !== undefined && v !== null && v !== '') qp.append(key, String(v));
      });
      return;
    }

    if (typeof val === 'object') {
      try {
        const jsonStr = JSON.stringify(val);
        if (jsonStr !== '{}' && jsonStr !== '[]') qp.set(key, jsonStr);
      } catch (e) {
        console.warn(`Error serializando objeto para key ${key}:`, e);
        qp.set(key, String(val));
      }
      return;
    }

    if (typeof val === 'number' && !Number.isFinite(val)) return; // evita NaN/Infinity
    qp.set(key, String(val));
  });
  return qp.toString();
}

function stableKey(prefix, params = {}) {
  const ordered = {};
  Object.keys(params).sort().forEach(k => {
    const val = params[k];
    if (Array.isArray(val)) ordered[k] = val.slice().sort();
    else if (typeof val === 'object' && val !== null) ordered[k] = JSON.stringify(val);
    else ordered[k] = val;
  });
  return `${prefix}:${JSON.stringify(ordered)}`;
}

export async function fetchDashboardARPU(params = {}) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token no encontrado en localStorage");

  const { forceRefresh = false, ...filters } = params;
  const cacheKey = stableKey('dashboardARPU', filters);
  console.log('🔑 Cache key generada:', cacheKey);

  if (dataCacheService.isLoading(cacheKey)) {
    console.warn('⏳ Ya hay una carga en progreso para esta consulta');
    throw new Error("La carga de datos ya está en progreso");
  }

  if (!forceRefresh) {
    const cached = dataCacheService.get(cacheKey);
    if (cached) {
      console.log('📦 Devolviendo datos ARPU desde cache');
      return cached;
    }
  }

  try {
    dataCacheService.setLoading(cacheKey, true);
    const url = `${API_BASE_URL}dashboard_arpu/list/`;
    const qs = buildQueryFromParams(filters);
    const fullUrl = qs ? `${url}?${qs}` : url;

    console.log('🌐 Fetching URL:', fullUrl);
    console.log('📋 Parámetros enviados:', filters);

    const resp = await fetch(fullUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      console.error('❌ Error en respuesta:', resp.status, text);
      throw new Error(`Error al obtener ARPU: ${resp.status} ${resp.statusText} ${text}`);
    }

    const data = await resp.json();
    console.log('✅ Datos recibidos exitosamente:', Array.isArray(data) ? data.length : 'objeto', 'registros');

    dataCacheService.set(cacheKey, data);
    console.log('💾 Datos ARPU guardados en cache');
    return data;
  } catch (error) {
    console.error('❌ Error en fetchDashboardARPU:', error);
    throw error;
  } finally {
    dataCacheService.setLoading(cacheKey, false);
  }
}

export async function fetchDashboardARPUForecast(params = {}) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token no encontrado en localStorage");

  const { empresa, producto, periods = 6, forceRefresh = false } = params;
  if (!empresa || !producto) throw new Error("Los parámetros empresa y producto son requeridos para forecast");

  const filters = { empresa: String(empresa), producto: String(producto), periods: String(periods) };
  const cacheKey = stableKey('dashboardARPUForecast', filters);
  console.log('🔮 Cache key forecast:', cacheKey);

  if (dataCacheService.isLoading(cacheKey)) {
    console.warn('⏳ Ya hay una carga de forecast en progreso');
    throw new Error("La carga de forecast ya está en progreso");
  }

  if (!forceRefresh) {
    const cached = dataCacheService.get(cacheKey);
    if (cached) {
      console.log('📦 Devolviendo forecast desde cache');
      return cached;
    }
  }

  try {
    dataCacheService.setLoading(cacheKey, true);

    const url = `${API_BASE_URL}dashboard_arpu/forecast/`;
    const qs = buildQueryFromParams(filters);
    const fullUrl = qs ? `${url}?${qs}` : url;

    console.log('🌐 Fetching forecast URL:', fullUrl);

    const resp = await fetch(fullUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      console.error('❌ Error en forecast:', resp.status, text);
      throw new Error(`Error al obtener forecast: ${resp.status} ${resp.statusText} ${text}`);
    }

    const data = await resp.json();
    console.log('✅ Forecast recibido exitosamente');

    dataCacheService.set(cacheKey, data);
    console.log('💾 Forecast guardado en cache');
    return data;
  } catch (error) {
    console.error('❌ Error en fetchDashboardARPUForecast:', error);
    throw error;
  } finally {
    dataCacheService.setLoading(cacheKey, false);
  }
}

export async function upsertDashboardARPU(payload) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token no encontrado en localStorage");

  const url = `${API_BASE_URL}dashboard_arpu/upsert/`;
  console.log('💾 Enviando upsert a:', url);

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    console.error('❌ Error en upsert:', resp.status, text);
    throw new Error(`Error al guardar ARPU: ${resp.status} ${resp.statusText} ${text}`);
  }

  clearDashboardARPUCache();
  const result = await resp.json();
  console.log('✅ Upsert exitoso');
  return result;
}

export function clearDashboardARPUCache() {
  const keys = Array.from(dataCacheService.cache.keys());
  let cleared = 0;
  keys.forEach(k => {
    if (k.startsWith('dashboardARPU') || k.startsWith('dashboardARPUForecast')) {
      dataCacheService.clear(k); cleared++;
    }
  });
  console.log(`🧹 Cache de Dashboard ARPU limpiado: ${cleared} entradas eliminadas`);
}

export function getCacheStats() {
  const stats = dataCacheService.getStats();
  console.log('📊 Estadísticas de cache:', stats);
  return stats;
}
