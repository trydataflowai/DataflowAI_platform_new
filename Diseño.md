**Ejemplo donde si id del plan es 3 o 6 se cambia de color sino no.**

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


**Ejemplo del Sidebar**

// src/components/layout/SideBar.jsx

importReact,{useState,useEffect}from"react";

import{useNavigate,useLocation}from"react-router-dom";

import{cerrarSesion}from"../../api/Login";

import{obtenerInfoUsuario}from"../../api/Usuario";

importdarkStylesfrom"../../styles/SideBar.module.css";

importlightStylesfrom"../../styles/SideBarLight.module.css";

import{useTheme}from"../componentes/ThemeContext";

import{ThemeToggle}from"../componentes/ThemeToggle";

exportconstSideBar=()=>{

  constnavigate=useNavigate();

  const{pathname}=useLocation();

  const{theme}=useTheme();

  const[collapsed,setCollapsed]=useState(false);

  const[companyName,setCompanyName]=useState("DataFlow AI");

  const[planId,setPlanId]=useState(null);

  const[planName,setPlanName]=useState("");

  const[styles,setStyles]=useState(darkStyles);

  // 1) Traer info de usuario y plan al montar

  useEffect(()=>{

    asyncfunctionfetchUsuario(){

    constuser=awaitobtenerInfoUsuario();

    constpid=user.empresa.plan.id;

    setPlanId(pid);

    setPlanName(user.empresa.plan.tipo);

    setCompanyName((pid===3||pid===6)?user.empresa.nombre:"DataFlow AI");

    }

    fetchUsuario();

  },[]);

  // 2) Actualizar estilos cuando cambie planId o theme

  useEffect(()=>{

    if(planId===3||planId===6){

    // planes que permiten toggle

    setStyles(theme==="dark"?darkStyles:lightStyles);

    }else{

    // otros planes: siempre dark

    setStyles(darkStyles);

    }

  },[theme,planId]);

  consthandleLogout=()=>{

    cerrarSesion();

    navigate("/");

  };

  consthandleLogoClick=()=>navigate("/homeLogin#home");

  consttoggleCollapsed=()=>setCollapsed(c=>!c);

  constlinks=[

    {to:"/homeLogin#home",icon:"🏠",label:"Home"},

    {to:"/home",        icon:"📊",label:"Dashboards"},

    {to:"/marketplace",icon:"🛒",label:"Marketplace"},

    {to:"/ai-insights",icon:"🤖",label:"AI Insights"},

    {to:"/support",     icon:"🆘",label:"Support"},

    {to:"/profile",     icon:"👤",label:"Profile"},

  ];

  return(

    [asideclassName={`${styles.sidebar}${collapsed?styles.collapsed:&#34;&#34;}`}](asideclassName=%7B%60$%7Bstyles.sidebar%7D$%7Bcollapsed?styles.collapsed:%22%22%7D%60%7D)

    <divclassName={styles.logoContainer}>

    <button

    className={styles.logoButton}

    onClick={handleLogoClick}

    aria-label="View Home"

    >

    <pclassName={styles.logoText}>{companyName}`</p>`

    `</button>`

    `</div>`

    {/* Solo en planes 3 y 6 */}

    {(planId===3||planId===6)&&(

    <divclassName={styles.toggleThemeWrapper}>

    `<ThemeToggle/>`

    `</div>`

    )}

    <navclassName={styles.nav}>

    {links.map(({to,icon,label})=>(

    <button

    key={to}

    className={`${styles.button}${

    pathname===to?styles.active:""

    }`}

    onClick={()=>navigate(to)}

    aria-label={`View ${label}`}

    >

    <spanclassName={`${styles.icon}${styles.emojiWhite}`}>{icon}

    <spanclassName={styles.text}>{label}

    <spanclassName={styles.highlight}/>

    `</button>`

    ))}

    <button

    className={styles.button}

    onClick={handleLogout}

    aria-label="Log out"

    >

    <spanclassName={`${styles.icon}${styles.emojiWhite}`}>🚪

    <spanclassName={styles.text}>Log out

    <spanclassName={styles.highlight}/>

    `</button>`

    `</nav>`

    <divclassName={styles.toggleContainer}>

    <button

    className={styles.toggleButton}

    onClick={toggleCollapsed}

    aria-label={collapsed?"Expand sidebar":"Collapse sidebar"}

    >

    {collapsed?"➡️":"⬅️"}

    `</button>`

    `</div>`

    <divclassName={styles.footer}>

    {planName&&<pclassName={styles.planText}>{planName}`</p>`}

    <divclassName={styles.accentLine}/>

    <pclassName={styles.footerText}>By DataFlow AI`</p>`

    `</div>`

    `</aside>`

  );

};

**En el siguiente JSX damelo completo donde integres la funcionalidad de color y los dos css, por favor. Los tres códigos completos**

PEGAR ACÁ EL JSX A CONVERTIR
