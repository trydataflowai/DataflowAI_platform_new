// src/components/layout/SideBar.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cerrarSesion } from "../../api/Login";
import { obtenerInfoUsuario } from "../../api/Usuario";

import defaultDarkStyles from "../../styles/SideBar.module.css";
import defaultLightStyles from "../../styles/SideBarLight.module.css";

import { useTheme } from "../componentes/ThemeContext";
import { ThemeToggle } from "../componentes/ThemeToggle";

/*
  Lógica:
  - Intentamos resolver estilos específicos por empresa buscando archivos:
      src/styles/empresas/{companyId}/SideBar.module.css     (dark)
      src/styles/empresas/{companyId}/SideBarLight.module.css (light)
  - Si existen y el plan del usuario es 3 o 6, usamos los estilos por empresa.
  - Si no existen o el plan no aplica, usamos los estilos por defecto (importados arriba).
  - Implementación con import.meta.glob(..., { eager: true }) para que Vite incluya
    los módulos CSS en el bundle y podamos accederlos por ruta construida.
*/

const empresaLightModules = import.meta.glob(
  "../../styles/empresas/*/SideBarLight.module.css",
  { eager: true }
);
const empresaDarkModules = import.meta.glob(
  "../../styles/empresas/*/SideBar.module.css",
  { eager: true }
);

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
  const [styles, setStyles] = useState(defaultDarkStyles);

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
    /*
      Selección de estilos:
      - Solo intentamos usar estilos por empresa si el plan es 3 o 6.
      - Buscamos módulos previamente incluidos por import.meta.glob.
      - Si encontramos el módulo correspondiente a la empresa, lo usamos.
      - Si no, fallback al default (light/dark).
    */
    const useCompanyStyles = (planId === 3 || planId === 6) && companyId;

    // construir rutas tal como las keys de import.meta.glob usan rutas relativas
    const lightKey = `../../styles/empresas/${companyId}/SideBarLight.module.css`;
    const darkKey = `../../styles/empresas/${companyId}/SideBar.module.css`;

    const foundCompanyLight = empresaLightModules[lightKey];
    const foundCompanyDark = empresaDarkModules[darkKey];

    // helper: algunos bundlers ponen el mapping en .default, otros directamente
    const extract = (mod) => {
      if (!mod) return null;
      return mod.default ?? mod;
    };

    const companyLight = extract(foundCompanyLight);
    const companyDark = extract(foundCompanyDark);

    let chosenStyles = defaultDarkStyles;
    if (theme === "dark") {
      if (useCompanyStyles && companyDark) {
        chosenStyles = companyDark;
      } else {
        chosenStyles = defaultDarkStyles;
      }
    } else {
      // light theme
      if (useCompanyStyles && companyLight) {
        chosenStyles = companyLight;
      } else {
        chosenStyles = defaultLightStyles;
      }
    }

    setStyles(chosenStyles);
  }, [theme, planId, companyId]);

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
    { to: "/home", icon: "📊", label: "Dashboards" },
    { to: "/HomeTools", icon: "🛠️", label: "Tools" },
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
        <div className={styles.accentLine} />
        <p className={styles.footerText}>By DataFlow AI</p>
      </div>
    </aside>
  );
};

export default SideBar;
