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
  const location = useLocation();
  const { pathname } = location;
  const { theme } = useTheme();

  const [collapsed, setCollapsed] = useState(false);

  // info usuario
  const [companyId, setCompanyId] = useState(null);
  const [companyName, setCompanyName] = useState("DataFlow AI");
  const [planId, setPlanId] = useState(null);
  const [planName, setPlanName] = useState("");
  const [styles, setStyles] = useState(darkStyles);

  // logo states
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoFound, setLogoFound] = useState(false);

  // segmento de empresa (nombre_corto normalizado) -> p.e. "Coltrade"
  const [companySegment, setCompanySegment] = useState("");

  const NO_PREFIX = [
    "/homeLogin",
    "/login",
    "/crear-empresa",
    "/crear-usuario",
    "/pagos",
    "/",
  ];

  const normalizeSegment = (nombreCorto) =>
    nombreCorto ? String(nombreCorto).trim().replace(/\s+/g, "") : "";

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
        const nombreCorto = user?.empresa?.nombre_corto ?? "";

        setPlanId(pid);
        setPlanName(pname);
        setCompanyName((pid === 3 || pid === 6) ? cname : "DataFlow AI");
        setCompanyId(cid);
        setCompanySegment(normalizeSegment(nombreCorto));
      } catch (err) {
        console.error("Error al obtener info usuario:", err);
      }
    }
    fetchUsuario();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!companyId) {
      setLogoFound(false);
      setLogoUrl(null);
      return;
    }

    let mounted = true;
    const exts = ["png", "jpg", "jpeg", "svg"];
    const publicPathPrefix = "/logos-empresas";

    const tryLoad = async () => {
      for (const ext of exts) {
        const candidate = `${publicPathPrefix}/${companyId}.${ext}`;
        const img = new Image();
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

  useEffect(() => {
    if (planId === 3 || planId === 6) {
      setStyles(theme === "dark" ? darkStyles : lightStyles);
    } else {
      setStyles(darkStyles);
    }
  }, [theme, planId]);

  const handleLogout = () => {
    cerrarSesion();
    navigate("/");
  };

  const buildTo = (to) => {
    const [baseRaw, hash] = to.split("#");
    const base = baseRaw.startsWith("/") ? baseRaw : `/${baseRaw}`;

    if (NO_PREFIX.includes(base)) {
      return hash ? `${base}#${hash}` : base;
    }

    if (companySegment && base.startsWith(`/${companySegment}`)) {
      return hash ? `${base}#${hash}` : base;
    }

    const fullBase = companySegment ? `/${companySegment}${base}` : base;
    return hash ? `${fullBase}#${hash}` : fullBase;
  };

  const handleLogoClick = () => {
    navigate(buildTo("/homeLogin#home"));
  };

  const toggleCollapsed = () => setCollapsed((c) => !c);

  const links = [
    { to: "/homeLogin#home", icon: "🏠", label: "Home" },
    { to: "/home",        icon: "📊", label: "Dashboards" },
    { to: "/configuracion-perfil", icon: "👤", label: "Profile" },
    { to: "/marketplace", icon: "🛒", label: "Marketplace" },
    { to: "/ChatBot", icon: "🤖", label: "AI Insights" },
    { to: "/SoporteUsuario", icon: "🆘", label: "Support" },
  ];

  const filteredLinks = links.filter((link) => {
    if (link.to === "/marketplace" && (planId === 3 || planId === 6)) {
      return false;
    }
    return true;
  });

  const isActiveLink = (to) => {
    const built = buildTo(to);
    const base = built.split("#")[0];
    return pathname === base;
  };

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.logoContainer}>
        <button
          className={styles.logoButton}
          onClick={handleLogoClick}
          aria-label="View Home"
        >
          {logoFound ? (
            <img
              src={logoUrl}
              alt={companyName}
              className={styles.logoImg}
              onError={() => {
                setLogoFound(false);
                setLogoUrl(null);
              }}
            />
          ) : (
            <p className={styles.logoText}>{companyName}</p>
          )}
        </button>
      </div>

      {(planId === 3 || planId === 6) && (
        <div className={styles.toggleThemeWrapper}>
          <ThemeToggle />
        </div>
      )}

      <nav className={styles.nav}>
        {filteredLinks.map(({ to, icon, label }) => {
          const builtTo = buildTo(to);
          return (
            <button
              key={builtTo}
              className={`${styles.button} ${isActiveLink(to) ? styles.active : ""}`}
              onClick={() => navigate(builtTo)}
              aria-label={`View ${label}`}
            >
              <span className={`${styles.icon} ${styles.emojiWhite}`}>{icon}</span>
              <span className={styles.text}>{label}</span>
              <span className={styles.highlight} />
            </button>
          );
        })}

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

export default SideBar;
