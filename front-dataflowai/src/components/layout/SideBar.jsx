// src/components/layout/SideBar.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cerrarSesion } from "../../api/Login";
import { obtenerInfoUsuario } from "../../api/Usuario";

import darkStyles from "../../styles/SideBar.module.css";
import lightStyles from "../../styles/SideBarLight.module.css";

import { useTheme } from "../componentes/ThemeContext";
import { ThemeToggle } from "../componentes/ThemeToggle";

export const SideBar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { theme } = useTheme();

  const [collapsed, setCollapsed] = useState(false);
  const [companyName, setCompanyName] = useState("DataFlow AI");
  const [planId, setPlanId] = useState(null);
  const [planName, setPlanName] = useState("");
  const [styles, setStyles] = useState(darkStyles);

  // 1) Traer info de usuario y plan al montar
  useEffect(() => {
    async function fetchUsuario() {
      const user = await obtenerInfoUsuario();
      const pid = user.empresa.plan.id;
      setPlanId(pid);
      setPlanName(user.empresa.plan.tipo);
      setCompanyName((pid === 3 || pid === 6) ? user.empresa.nombre : "DataFlow AI");
    }
    fetchUsuario();
  }, []);

  // 2) Actualizar estilos cuando cambie planId o theme
  useEffect(() => {
    if (planId === 3 || planId === 6) {
      // planes que permiten toggle
      setStyles(theme === "dark" ? darkStyles : lightStyles);
    } else {
      // otros planes: siempre dark
      setStyles(darkStyles);
    }
  }, [theme, planId]);

  const handleLogout = () => {
    cerrarSesion();
    navigate("/");
  };
  const handleLogoClick = () => navigate("/homeLogin#home");
  const toggleCollapsed = () => setCollapsed(c => !c);

  const links = [
    { to: "/homeLogin#home", icon: "🏠", label: "Home" },
    { to: "/home",        icon: "📊", label: "Dashboards" },
    { to: "/marketplace", icon: "🛒", label: "Marketplace" },
    { to: "/ai-insights", icon: "🤖", label: "AI Insights" },
    { to: "/support",     icon: "🆘", label: "Support" },
    { to: "/profile",     icon: "👤", label: "Profile" },
  ];

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.logoContainer}>
        <button
          className={styles.logoButton}
          onClick={handleLogoClick}
          aria-label="View Home"
        >
          <p className={styles.logoText}>{companyName}</p>
        </button>
      </div>

      {/* Solo en planes 3 y 6 */}
      {(planId === 3 || planId === 6) && (
        <div className={styles.toggleThemeWrapper}>
          <ThemeToggle />
        </div>
      )}

      <nav className={styles.nav}>
        {links.map(({ to, icon, label }) => (
          <button
            key={to}
            className={`${styles.button} ${
              pathname === to ? styles.active : ""
            }`}
            onClick={() => navigate(to)}
            aria-label={`View ${label}`}
          >
            <span className={`${styles.icon} ${styles.emojiWhite}`}>{icon}</span>
            <span className={styles.text}>{label}</span>
            <span className={styles.highlight} />
          </button>
        ))}
        <button
          className={styles.button}
          onClick={handleLogout}
          aria-label="Log out"
        >
          <span className={`${styles.icon} ${styles.emojiWhite}`}>🚪</span>
          <span className={styles.text}>Log out</span>
          <span className={styles.highlight} />
        </button>
      </nav>

      <div className={styles.toggleContainer}>
        <button
          className={styles.toggleButton}
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "➡️" : "⬅️"}
        </button>
      </div>

      <div className={styles.footer}>
        {planName && <p className={styles.planText}>{planName}</p>}
        <div className={styles.accentLine} />
        <p className={styles.footerText}>By DataFlow AI</p>
      </div>
    </aside>
  );
};
