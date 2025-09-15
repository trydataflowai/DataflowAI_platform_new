// src/components/pages/HomeDashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../styles/HomeDark.module.css";
import { obtenerInfoUsuario } from '../../api/Usuario';

const LOGOS_BASE_PATH = "/logos-empresas"; // carpeta en public: public/logos-empresas
const EXTENSIONS = ["png", "jpg", "jpeg", "svg", "webp"];

// Rutas que NO deben llevar el prefijo de empresa
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

const HomeDashboard = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [logoSrc, setLogoSrc] = useState(null);
  const [logoTryIndex, setLogoTryIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [companySegment, setCompanySegment] = useState("");

  // intentamos obtener usuario con pequeños reintentos para evitar estado "vacío" justo después del login
  useEffect(() => {
    let mounted = true;
    const fetchUsuario = async () => {
      try {
        const maxAttempts = 4;
        let attempt = 0;
        let u = null;
        while (attempt < maxAttempts) {
          try {
            u = await obtenerInfoUsuario();
            break;
          } catch (err) {
            attempt += 1;
            // espera corta antes del siguiente intento
            await new Promise((r) => setTimeout(r, 250));
          }
        }
        if (mounted) {
          if (u) {
            setUsuario(u);
            const nombreCorto = u?.empresa?.nombre_corto ?? "";
            setCompanySegment(normalizeSegment(nombreCorto));
          } else {
            // fallo al obtener info, dejamos usuario como null pero marcamos cargado
            setUsuario(null);
          }
        }
      } catch (e) {
        console.error("Error en fetchUsuario:", e);
      } finally {
        if (mounted) setIsLoaded(true);
      }
    };

    fetchUsuario();
    return () => { mounted = false; };
  }, []);

  // cuando cambia usuario, reiniciamos la búsqueda del logo
  useEffect(() => {
    if (!usuario?.empresa?.id) {
      setLogoSrc(null);
      setLogoTryIndex(0);
      return;
    }
    const id = usuario.empresa.id;
    setLogoTryIndex(0);
    setLogoSrc(`${LOGOS_BASE_PATH}/${id}.${EXTENSIONS[0]}`);
  }, [usuario]);

  // handler que se activa si la imagen falla; intenta siguiente extensión o fallback final
  function handleLogoError() {
    const nextIndex = logoTryIndex + 1;
    const id = usuario?.empresa?.id;
    if (!id) {
      setLogoSrc(`${LOGOS_BASE_PATH}/default.png`);
      return;
    }
    if (nextIndex < EXTENSIONS.length) {
      const next = `${LOGOS_BASE_PATH}/${id}.${EXTENSIONS[nextIndex]}`;
      setLogoTryIndex(nextIndex);
      setLogoSrc(next);
    } else {
      setLogoSrc(`${LOGOS_BASE_PATH}/default.png`);
    }
  }

  // Construye la ruta real teniendo en cuenta el prefijo de empresa y hashes
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

  const cards = [
    { title: "Dashboard", description: "Visualiza métricas y reportes en tiempo real.", path: "/home", icon: "📊" },
    { title: "Marketplace", description: "Explora y adquiere plantillas y recursos.", path: "/marketplace", icon: "🛒" },
    { title: "Configuración de Perfil", description: "Administra tu información personal y empresa.", path: "/configuracion-perfil", icon: "⚙️" },
    { title: "Soporte de Usuario", description: "Realiza las solicitudes a nuestro equipo de soporte..", path: "/SoporteUsuario", icon: "🔂" },
    { title: "Chatbot", description: "Realiza análisis de información con nuestro Chatbot.", path: "/ChatBot", icon: "🤖" },
  ];

  const companyName = usuario?.empresa?.nombre_corto || usuario?.empresa?.nombre || usuario?.nombres || '';
  const planId = usuario?.empresa?.plan?.id !== undefined ? Number(usuario.empresa.plan.id) : null;

  const visibleCards = isLoaded ? cards.filter(card => {
    if (card.title === "Marketplace" && (planId === 3 || planId === 6)) return false;
    return true;
  }) : [];

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.companyLogoWrapper} aria-hidden={!logoSrc}>
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={companyName ? `${companyName} logo` : 'Logo empresa'}
              className={styles.companyLogo}
              onError={handleLogoError}
              loading="lazy"
            />
          ) : (
            <div className={styles.companyPlaceholder}>
              {companyName ? companyName.charAt(0).toUpperCase() : "U"}
            </div>
          )}
        </div>

        <div className={styles.headerText}>
          <h1 className={styles.title}>
            {companyName ? `Bienvenido ${companyName}, inteligencia de negocios` : (isLoaded ? 'Inicio' : 'Cargando...')}
          </h1>
          <p className={styles.subtitle}>
            {isLoaded ? 'Navega entre los distintos modulos:' : 'Cargando módulos...'}
          </p>
        </div>
      </div>

      { !isLoaded ? (
        <div style={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#b3b3b3' }}>Cargando módulos...</span>
        </div>
      ) : (
        <div className={styles.grid}>
          {visibleCards.map((card, index) => {
            const to = buildTo(card.path);
            return (
              <div
                key={index}
                className={styles.card}
                onClick={() => navigate(to)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => { if (e.key === 'Enter') navigate(to); }}
              >
                <div className={styles.icon}>{card.icon}</div>
                <h2>{card.title}</h2>
                <p>{card.description}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Exports: default y named para evitar problems si alguien importa de manera distinta
export default HomeDashboard;
export { HomeDashboard };
