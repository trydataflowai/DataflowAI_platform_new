// src/components/componentes/ThemeContext.jsx
import React, { createContext, useContext, useState, useLayoutEffect, useEffect } from 'react';

const ThemeContext = createContext();
const STORAGE_KEY = 'dataflow-theme';

/**
 * Lee el theme guardado en localStorage (si existe y válido).
 * Devuelve 'dark' | 'light' | null
 */
const readSavedTheme = () => {
  if (typeof window === 'undefined') return null;
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s === 'dark' || s === 'light' ? s : null;
  } catch (e) {
    return null;
  }
};

/** Consulta la preferencia del sistema (dark) */
const systemPrefersDark = () => {
  try {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch (e) {
    return false;
  }
};

/** Determina el tema inicial con prioridad: saved -> system -> light */
const getInitialTheme = () => {
  const saved = readSavedTheme();
  if (saved) return saved;
  return systemPrefersDark() ? 'dark' : 'light';
};

/** Aplica el tema directamente al documentElement (síncrono) */
const applyThemeToDocument = (theme) => {
  try {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark-theme', theme === 'dark');
    document.documentElement.classList.toggle('light-theme', theme === 'light');
  } catch (e) {
    // silent (por ejemplo SSR o entorno sin DOM)
  }
};

export const ThemeProvider = ({ children }) => {
  // Iniciamos con el valor calculado (no con 'dark' por defecto).
  const [theme, setTheme] = useState(getInitialTheme);

  /**
   * useLayoutEffect para aplicar el tema antes del paint.
   * Esto evita que el DOM pinte con un tema por defecto y luego cambie.
   */
  useLayoutEffect(() => {
    applyThemeToDocument(theme);

    // Marcar que el theme ya está listo para que el CSS pueda reactivar transiciones
    try {
      document.documentElement.dataset.themeReady = 'true';
    } catch (e) {
      /* silent */
    }
  }, [theme]);

  // Guardar la preferencia en localStorage (cuando cambie)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      /* silent */
    }
  }, [theme]);

  // Escuchar cambios desde otras pestañas
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'dark' || e.newValue === 'light')) {
        setTheme(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Si la preferencia del sistema cambia y NO hay un valor guardado por el usuario,
  // actualizar el theme en caliente.
  useEffect(() => {
    const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    if (!mq) return;

    const handler = (ev) => {
      const saved = readSavedTheme();
      if (!saved) {
        setTheme(ev.matches ? 'dark' : 'light');
      }
    };

    // Compatibilidad: addEventListener('change') o fallback a addListener
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else if (typeof mq.addListener === 'function') {
      mq.addListener(handler);
      return () => mq.removeListener(handler);
    }
  }, []);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/** Hook consumidor */
export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return ctx;
};
