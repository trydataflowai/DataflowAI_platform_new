// src/components/componentes/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Función para obtener el tema inicial desde localStorage de forma síncrona
  const getInitialTheme = () => {
    // Verificar si estamos en el lado del cliente
    if (typeof window === 'undefined') return 'dark';
    
    try {
      const savedTheme = localStorage.getItem('dataflow-theme');
      return savedTheme || 'dark'; // Si no hay nada guardado, usar 'dark' por defecto
    } catch (error) {
      console.warn('Error reading theme from localStorage:', error);
      return 'dark';
    }
  };

  // Estado para controlar si el tema ya se inicializó
  const [isInitialized, setIsInitialized] = useState(false);
  const [theme, setTheme] = useState(() => {
    const initialTheme = getInitialTheme();
    // Aplicar el tema inmediatamente al document
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', initialTheme);
      document.documentElement.classList.toggle('dark-theme', initialTheme === 'dark');
      document.documentElement.classList.toggle('light-theme', initialTheme === 'light');
    }
    return initialTheme;
  });

  // Función para cambiar tema y guardarlo en localStorage
  const toggleTheme = () => {
    setTheme(currentTheme => {
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      // Aplicar inmediatamente al document
      document.documentElement.setAttribute('data-theme', newTheme);
      document.documentElement.classList.toggle('dark-theme', newTheme === 'dark');
      document.documentElement.classList.toggle('light-theme', newTheme === 'light');
      
      // Guardar en localStorage
      try {
        localStorage.setItem('dataflow-theme', newTheme);
      } catch (error) {
        console.warn('Error saving theme to localStorage:', error);
      }
      
      return newTheme;
    });
  };

  // Efecto para marcar como inicializado después del primer render
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Efecto para sincronizar con localStorage si cambia desde otra pestaña
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'dataflow-theme' && e.newValue) {
        setTheme(e.newValue);
        // También aplicar al document
        document.documentElement.setAttribute('data-theme', e.newValue);
        document.documentElement.classList.toggle('dark-theme', e.newValue === 'dark');
        document.documentElement.classList.toggle('light-theme', e.newValue === 'light');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Efecto para aplicar el tema al document cuando cambie
  useEffect(() => {
    if (isInitialized) {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.classList.toggle('dark-theme', theme === 'dark');
      document.documentElement.classList.toggle('light-theme', theme === 'light');
    }
  }, [theme, isInitialized]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isInitialized }}>
      {children}
    </ThemeContext.Provider>
  );
};

// hook para consumir
export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return ctx;
};