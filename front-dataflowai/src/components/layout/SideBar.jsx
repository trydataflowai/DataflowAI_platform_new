// src/components/layout/SideBar.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cerrarSesion } from "../../api/Login";
import { obtenerInfoUsuario } from "../../api/Usuario";

import defaultStyles from "../../styles/SideBar.module.css";

import { useTheme } from "../componentes/ThemeContext";
import { ThemeToggle } from "../componentes/ThemeToggle";

import accesosEmpresa from "../../data/accesos";

const empresaModules = import.meta.glob(
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
  const [styles, setStyles] = useState(defaultStyles);

  const [logoUrl, setLogoUrl] = useState(null);
  const [logoFound, setLogoFound] = useState(false);
  const [companySegment, setCompanySegment] = useState("");

  const [loaded, setLoaded] = useState(false);

  // estado para popover compacto
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState(null);
  const formBuilderBtnRef = useRef(null);
  const popoverRef = useRef(null);

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
    const companyKey = `../../styles/empresas/${companyId}/SideBar.module.css`;
    const foundCompanyStyles = empresaModules[companyKey];

    const extract = (mod) => (mod ? mod.default ?? mod : null);
    const companyStyles = extract(foundCompanyStyles);

    let chosenStyles = defaultStyles;
    if (useCompanyStyles && companyStyles) {
      chosenStyles = companyStyles;
    } else {
      chosenStyles = defaultStyles;
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

  const links = [
    { to: "/home", icon: "📊", label: "Dashboards" },
    { to: "/HomeTools", icon: "🛠️", label: "Tools" },
    { to: "/configuracion-perfil", icon: "👤", label: "Profile" },
    { to: "/marketplace", icon: "🛒", label: "Marketplace" },
    { to: "/SoporteUsuario", icon: "🆘", label: "Support" },
    { to: "/ChatPg", icon: "🤖", label: "AI Insights" },
    { to: "/FormBuilder", icon: "🧩", label: "FormBuilder" },
    { to: "/brk/perfil", icon: "🧩", label: "Perfil Broker" },
  ];

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

  // helper para usar clases del defaultStyles en caso de que el module por empresa no las tenga
  const cls = (key) => {
    try {
      return styles && styles[key] ? styles[key] : defaultStyles[key] ? defaultStyles[key] : "";
    } catch {
      return defaultStyles[key] ? defaultStyles[key] : "";
    }
  };

  // cerrar con Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setPopoverOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // click fuera del popover -> cerrar
  useEffect(() => {
    const handleClickOutside = (ev) => {
      if (!popoverOpen) return;
      if (popoverRef.current && !popoverRef.current.contains(ev.target) &&
          formBuilderBtnRef.current && !formBuilderBtnRef.current.contains(ev.target)) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverOpen]);

  // abrir/actualizar rect cuando haga click en el botón FormBuilder
  const handleFormBuilderClick = () => {
    const rect = formBuilderBtnRef.current?.getBoundingClientRect();
    setButtonRect(rect ? { top: rect.top, left: rect.left, height: rect.height, width: rect.width } : null);
    setPopoverOpen((s) => !s);
  };

  if (!loaded) return null;

  const variantClass = theme === "dark" ? styles.dark : styles.light;

  // posición por defecto del popover cuando no hay rect
  const defaultTop = 120;
  const popoverWidth = 220;
  const popoverHeight = 140; // estimado para lista vertical

  const popoverTop = buttonRect
    ? Math.max(12, (buttonRect.top + buttonRect.height / 2) - popoverHeight / 2)
    : defaultTop;

  const popoverLeft = collapsed ? 120 + 8 : 280 + 8; // small offset para separarlo del sidebar

  return (
    <>
      <aside className={`${styles.sidebar} ${variantClass} ${collapsed ? styles.collapsed : ""}`}>
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

            if (to === "/FormBuilder") {
              return (
                <button
                  key={builtTo}
                  ref={formBuilderBtnRef}
                  className={`${styles.button} ${popoverOpen ? styles.active : ""}`}
                  onClick={handleFormBuilderClick}
                  aria-expanded={popoverOpen}
                  aria-controls="sf-popover"
                >
                  <span className={`${styles.icon} ${styles.emojiWhite}`}>{icon}</span>
                  <span className={styles.text}>{label}</span>
                  <span className={styles.highlight} />
                </button>
              );
            }

            return (
              <button
                key={builtTo}
                className={`${styles.button} ${isActiveLink(to) ? styles.active : ""}`}
                onClick={() => {
                  setPopoverOpen(false);
                  navigate(builtTo);
                }}
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

      {/* Popover compacto (lista vertical) */}
      {popoverOpen && (
        <div
          ref={popoverRef}
          id="sf-popover"
          role="dialog"
          aria-label="Formulario links"
          className={`${cls("popoverCompact")} ${variantClass}`}
          style={{
            top: `${popoverTop}px`,
            left: `${popoverLeft}px`,
            width: `${popoverWidth}px`,
          }}
        >
          <div className={cls("popoverColumn")}>
            <button
              className={cls("popoverLink")}
              onClick={() => {
                setPopoverOpen(false);
                navigate(buildTo("/FormBuilder"));
              }}
            >
              🧩 FormBuilder
            </button>

            <button
              className={cls("popoverLink")}
              onClick={() => {
                setPopoverOpen(false);
                navigate(buildTo("/FormsListado"));
              }}
            >
              📋 Forms Listado
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SideBar;
