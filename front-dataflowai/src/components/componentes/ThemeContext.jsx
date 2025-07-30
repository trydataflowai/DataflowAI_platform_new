// src/components/componentes/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Función para obtener el tema inicial desde localStorage
  const getInitialTheme = () => {
    try {
      const savedTheme = localStorage.getItem('dataflow-theme');
      return savedTheme || 'dark'; // Si no hay nada guardado, usar 'dark' por defecto
    } catch (error) {
      console.warn('Error reading theme from localStorage:', error);
      return 'dark';
    }
  };

  const [theme, setTheme] = useState(getInitialTheme);

  // Función para cambiar tema y guardarlo en localStorage
  const toggleTheme = () => {
    setTheme(currentTheme => {
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      // Guardar en localStorage
      try {
        localStorage.setItem('dataflow-theme', newTheme);
      } catch (error) {
        console.warn('Error saving theme to localStorage:', error);
      }
      
      return newTheme;
    });
  };

  // Efecto para sincronizar con localStorage si cambia desde otra pestaña
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'dataflow-theme' && e.newValue) {
        setTheme(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
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