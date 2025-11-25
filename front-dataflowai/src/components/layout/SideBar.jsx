// src/components/layout/SideBar.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cerrarSesion } from "../../api/Login";
import { obtenerInfoUsuario } from "../../api/Usuario";

import defaultDarkStyles from "../../styles/SideBar.module.css";
import defaultLightStyles from "../../styles/SideBarLight.module.css";

import { useTheme } from "../componentes/ThemeContext";
import { ThemeToggle } from "../componentes/ThemeToggle";

// 🔥 IMPORTANTE: accesos por empresa
import accesosEmpresa from "../../data/accesos";

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

  const [companyId, setCompanyId] = useState(null);
  const [companyName, setCompanyName] = useState("DataFlow AI");
  const [planId, setPlanId] = useState(null);
  const [planName, setPlanName] = useState("");
  const [styles, setStyles] = useState(defaultDarkStyles);

  const [logoUrl, setLogoUrl] = useState(null);
  const [logoFound, setLogoFound] = useState(false);
  const [companySegment, setCompanySegment] = useState("");

  // ⛔ Evitar PARPADEO
  const [loaded, setLoaded] = useState(false);

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
        setCompanyName(pid === 3 || pid === 6 ? cname : "DataFlow AI");
        setCompanyId(cid);
        setCompanySegment(normalizeSegment(nombreCorto));

        // 🔥 Datos mínimos cargados → NO PARPADEO
        setLoaded(true);
      } catch (err) {
        console.error("Error al obtener info usuario:", err);
      }
    }

    fetchUsuario();
    return () => {
      mounted = false;
    };
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
    return () => {
      mounted = false;
    };
  }, [companyId]);

  useEffect(() => {
    const useCompanyStyles = (planId === 3 || planId === 6) && companyId;

    const lightKey = `../../styles/empresas/${companyId}/SideBarLight.module.css`;
    const darkKey = `../../styles/empresas/${companyId}/SideBar.module.css`;

    const extract = (mod) => (mod ? mod.default ?? mod : null);

    const companyLight = extract(empresaLightModules[lightKey]);
    const companyDark = extract(empresaDarkModules[darkKey]);

    let chosenStyles = defaultDarkStyles;
    if (theme === "dark") {
      chosenStyles = useCompanyStyles && companyDark ? companyDark : defaultDarkStyles;
    } else {
      chosenStyles = useCompanyStyles && companyLight ? companyLight : defaultLightStyles;
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

  const handleLogoClick = () => navigate(buildTo("/homeLogin#home"));
  const toggleCollapsed = () => setCollapsed((c) => !c);

  // 💥 Menú
  const links = [
    { to: "/home", icon: "📊", label: "Dashboards" },
    { to: "/HomeTools", icon: "🛠️", label: "Tools" },
    { to: "/configuracion-perfil", icon: "👤", label: "Profile" },
    { to: "/marketplace", icon: "🛒", label: "Marketplace" },
    { to: "/SoporteUsuario", icon: "🆘", label: "Support" },
    { to: "/ChatPg", icon: "🤖", label: "AI Insights" },
    { to: "/FormBuilder", icon: "🧩", label: "FormBuilder" },
  ];

  // 🔥 Aplicar permisos (lo que NO quiero que se vea)
  const denied = companyId ? accesosEmpresa[String(companyId)] ?? [] : [];

  const filteredLinks = links.filter((link) => {
    if (link.to === "/marketplace" && (planId === 3 || planId === 6)) return false;
    if (denied.includes(link.label)) return false;
    return true;
  });

  const isActiveLink = (to) => {
    const built = buildTo(to);
    return pathname === built.split("#")[0];
  };

  // ⛔ NO RENDERIZAR hasta tener loaded → elimina PARPADEO
  if (!loaded) return null;

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.logoContainer}>
        <button className={styles.logoButton} onClick={handleLogoClick}>
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
            >
              <span className={`${styles.icon} ${styles.emojiWhite}`}>{icon}</span>
              <span className={styles.text}>{label}</span>
              <span className={styles.highlight} />
            </button>
          );
        })}

        <button className={styles.button} onClick={handleLogout}>
          <span className={`${styles.icon} ${styles.emojiWhite}`}>🚪</span>
          <span className={styles.text}>Log out</span>
          <span className={styles.highlight} />
        </button>
      </nav>

      <div className={styles.toggleContainer}>
        <button className={styles.toggleButton} onClick={toggleCollapsed}>
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
