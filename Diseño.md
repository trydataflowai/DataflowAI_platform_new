**Ejemplo donde si id del plab es 3 o 6 se cambia de color sino no.**

**EJEMPLO DE UN JSX:**

import darkStyles from '../../styles/HomeDashboard.module.css';
import lightStyles from '../../styles/HomeDashboardLight.module.css';

import { useTheme } from '../componentes/ThemeContext';

import { obtenerInfoUsuario } from '../../api/Usuario';

const { theme } = useTheme(); // Obtiene el tema actual ('dark' o 'light')
const [styles, setStyles] = useState(darkStyles); // Estilo activo (por defecto oscuro)

useEffect(() => {
  if (planId === 3 || planId === 6) {
    // Si el plan permite cambiar el tema
    setStyles(theme === 'dark' ? darkStyles : lightStyles);
  } else {
    // Si el plan no lo permite, forzar modo oscuro
    setStyles(darkStyles);
  }
}, [theme, planId]);


**Id del plan lo obtiene de acá:**

import { obtenerInfoUsuario } from '../../api/Usuario';

C:\Users\Julian Herreño\OneDrive - Colombian Trade Company SAS\DATA\02. AREAS\DATA\Julian Estif Herreno Palacios\09-DataFlow-WebSite\front-dataflowai\src\api\Usuario.js

Id del plan lo obtiene de acá:

import { obtenerInfoUsuario } from '../../api/Usuario';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const obtenerInfoUsuario = async () => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}usuario/info/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('No se pudo obtener la información del usuario');
  }

  return await response.json();
};

**C:\Users\Julian Herreño\OneDrive - Colombian Trade Company SAS\DATA\02. AREAS\DATA\Julian Estif Herreno Palacios\09-DataFlow-WebSite\front-dataflowai\src\components\componentes\ThemeContext.jsx**

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

**C:\Users\Julian Herreño\OneDrive - Colombian Trade Company SAS\DATA\02. AREAS\DATA\Julian Estif Herreno Palacios\09-DataFlow-WebSite\front-dataflowai\src\components\componentes\ThemeToggle.jsx**
import React from "react";
import { useTheme } from "./ThemeContext";
import styles from "../../styles/ThemeToggle.module.css";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    `<div className={styles.wrapper}>`
      <button
        onClick={toggleTheme}
        className={`${styles.toggleButton} ${isLight ? styles.light : ""}`}
        aria-label="Toggle theme"
      >
        `<div className={styles.toggleCircle}>`
          {isLight ? "🌞" : "🌙"}
        `</div>`
      `</button>`
    `</div>`
  );
};

**Lo que quiero es que me des un diseño supero pro para EL JSX , en el css dark usa estos colores y para el light usa los colores de linkedin donde predomine el blanco y pues también con el color azul**

:root {
  --black-void: #000000;
  --black-cosmos: #050505;
  --black-deep: #0a0a0a;
  --accent-neon: #00f7ff;
  --accent-turquoise: #00e1ff;
  --accent-cyan: #00c2ff;
  --accent-dark: #0099cc;
  --text-primary: #ffffff;
  --text-secondary: #cccccc;
  --success: #00ffaa;
  --warning: #ffcc00;
  --danger: #ff3366;
  --transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

En el siguiente JSX damelo completo donde integres la funcionalidad de color y los dos css, por favor. Los tres códigos completos

PEGAR ACÁ EL JSX A CONVERTIR
