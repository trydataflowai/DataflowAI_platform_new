import { useEffect, useRef } from 'react';
import dataCacheService from '../services/DataCacheService';

export function useDataCache() {
  const cacheInitialized = useRef(false);

  // Inicializar el cache cuando se monta la app
  useEffect(() => {
    if (!cacheInitialized.current) {
      console.log('🔄 Sistema de Cache inicializado');
      cacheInitialized.current = true;
    }
  }, []);

  // Limpiar cache cuando se desmonta la app (opcional)
  useEffect(() => {
    return () => {
      // Opcional: limpiar cache al desmontar si lo prefieres
      // dataCacheService.clearAll();
    };
  }, []);

  return {
    getStats: () => dataCacheService.getStats(),
    clearAll: () => dataCacheService.clearAll(),
    clearKey: (key) => dataCacheService.clear(key)
  };
}