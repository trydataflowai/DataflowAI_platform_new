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

  // info usuario
  const [companyId, setCompanyId] = useState(null);
  const [companyName, setCompanyName] = useState("DataFlow AI"); // texto a mostrar si no hay logo
  const [planId, setPlanId] = useState(null);
  const [planName, setPlanName] = useState("");
  const [styles, setStyles] = useState(darkStyles);

  // logo states
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoFound, setLogoFound] = useState(false);

  // 1) Traer info de usuario y plan al montar
  useEffect(() => {
    let mounted = true;
    async function fetchUsuario() {
      try {
        const user = await obtenerInfoUsuario();
        if (!mounted || !user) return;

        const pid = user?.empresa?.plan?.id ?? null;
        const pname = user?.empresa?.plan?.tipo ?? "";
        const cid = user?.empresa?.id ?? null;
        const cname = user?.empresa?.nombre ?? "DataFlow AI";

        setPlanId(pid);
        setPlanName(pname);

        // Company name displayed as text fallback.
        // Nota: la lógica de business que tenías (mostrar nombre sólo si plan 3 o 6)
        // la conservamos para el texto fallback.
        setCompanyName((pid === 3 || pid === 6) ? cname : "DataFlow AI");

        setCompanyId(cid);

      } catch (err) {
        console.error("Error al obtener info usuario:", err);
        // mantener valores por defecto (DataFlow AI)
      }
    }
    fetchUsuario();
    return () => { mounted = false; };
  }, []);

  // 2) Intentar cargar logo cuando tengamos companyId
  useEffect(() => {
    if (!companyId) {
      setLogoFound(false);
      setLogoUrl(null);
      return;
    }

    let mounted = true;
    // probamos varias extensiones por si acaso
    const exts = ["png", "jpg", "jpeg", "svg"];
    const publicPathPrefix = "/logos-empresas"; // asume que las imágenes están en public/logos-empresas/

    const tryLoad = async () => {
      for (const ext of exts) {
        const candidate = `${publicPathPrefix}/${companyId}.${ext}`;
        const img = new Image();
        // promesa para la carga
        const loaded = await new Promise((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = candidate;
        });
        if (loaded && mounted) {
          setLogoUrl(candidate);
          setLogoFound(true);
          return;
        }
      }
      if (mounted) {
        setLogoFound(false);
        setLogoUrl(null);
      }
    };

    tryLoad();

    return () => { mounted = false; };
  }, [companyId]);

  // 3) Actualizar estilos cuando cambie planId o theme
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
    { to: "/configuracion-perfil",     icon: "👤", label: "Profile" },
    { to: "/marketplace", icon: "🛒", label: "Marketplace" },
    { to: "/ai-insights", icon: "🤖", label: "AI Insights" },
    { to: "/SoporteUsuario",     icon: "🆘", label: "Support" },
  ];

  // Filtrar marketplace cuando planId sea 3 o 6
  const filteredLinks = links.filter(link => {
    if (link.to === "/marketplace" && (planId === 3 || planId === 6)) {
      return false; // ocultar marketplace para planes 3 y 6
    }
    return true;
  });

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.logoContainer}>
        <button
          className={styles.logoButton}
          onClick={handleLogoClick}
          aria-label="View Home"
        >
          {/* Si existen logo -> mostrar imagen */}
          {logoFound ? (
            // si el sidebar está colapsado queremos que el logo siga siendo visible,
            // por eso no escondemos la img con collapsed (la CSS puede ajustar su tamaño).
            <img
              src={logoUrl}
              alt={companyName}
              className={styles.logoImg}
              onError={() => {
                // si falla (raro porque ya comprobamos), hacemos fallback al texto
                setLogoFound(false);
                setLogoUrl(null);
              }}
            />
          ) : (
            // fallback textual (se aplica la lógica vs plan: ya seteada en companyName)
            <p className={styles.logoText}>{companyName}</p>
          )}
        </button>
      </div>

      {/* Solo en planes 3 y 6 */ }
      {(planId === 3 || planId === 6) && (
        <div className={styles.toggleThemeWrapper}>
          <ThemeToggle />
        </div>
      )}

      <nav className={styles.nav}>
        {filteredLinks.map(({ to, icon, label }) => (
          <button
            key={to}
            className={`${styles.button} ${pathname === to ? styles.active : ""}`}
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
