// src/components/pages/HomeDashboard.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../styles/HomeDark.module.css";
import { obtenerInfoUsuario } from '../../api/Usuario';

const LOGOS_BASE_PATH = "/logos-empresas"; // carpeta en public: public/logos-empresas
const EXTENSIONS = ["png", "jpg", "jpeg", "svg", "webp"];

const HomeDashboard = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [logoSrc, setLogoSrc] = useState(null);
  const [logoTryIndex, setLogoTryIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false); // indica que ya finalizó la llamada (success o error)

  useEffect(() => {
    let mounted = true;
    async function fetchUsuario() {
      try {
        const u = await obtenerInfoUsuario();
        if (mounted) setUsuario(u);
      } catch (error) {
        console.error('Error obteniendo usuario:', error);
        // si hay error, dejamos usuario en null pero marcamos como cargado para evitar flicker
      } finally {
        if (mounted) setIsLoaded(true);
      }
    }
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
    const initial = `${LOGOS_BASE_PATH}/${id}.${EXTENSIONS[0]}`;
    setLogoTryIndex(0);
    setLogoSrc(initial);
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
      // todas las extensiones fallaron -> fallback por defecto
      setLogoSrc(`${LOGOS_BASE_PATH}/default.png`);
    }
  }

  const cards = [
    {
      title: "Dashboard",
      description: "Visualiza métricas y reportes en tiempo real.",
      path: "/home",
      icon: "📊",
    },
    {
      title: "Marketplace",
      description: "Explora y adquiere plantillas y recursos.",
      path: "/marketplace",
      icon: "🛒",
    },
    {
      title: "Configuración de Perfil",
      description: "Administra tu información personal y empresa.",
      path: "/configuracion-perfil",
      icon: "⚙️",
    },
  ];

  // nombre para la cabecera (si usuario no existe aún, muestro 'Inicio' hasta cargar)
  const companyName = usuario?.empresa?.nombre_corto
    || usuario?.empresa?.nombre
    || usuario?.nombres
    || '';

  // planId solo tiene sentido después de cargar
  const planId = usuario?.empresa?.plan?.id !== undefined
    ? Number(usuario.empresa.plan.id)
    : null;

  // visibleCards: no calculamos visibilidad real hasta que isLoaded === true
  const visibleCards = isLoaded
    ? cards.filter(card => {
        if (card.title === "Marketplace" && (planId === 3 || planId === 6)) {
          return false;
        }
        return true;
      })
    : null; // null indica que aún no renderizamos las tarjetas reales (evita flicker)

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        {/* Logo de la empresa (si existe) */}
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
            {companyName
              ? `Bienvenido ${companyName}, inteligencia de negocios`
              : (isLoaded ? 'Inicio' : 'Cargando...')}
          </h1>
          <p className={styles.subtitle}>
            {isLoaded ? 'Navega entre los distintos modulos:' : 'Cargando módulos...'}
          </p>
        </div>
      </div>

      {/* GRID */}
      { !isLoaded ? (
        // placeholder mientras cargamos: evita mostrar Marketplace que luego desaparece
        <div style={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#b3b3b3' }}>Cargando módulos...</span>
        </div>
      ) : (
        <div className={styles.grid}>
          {visibleCards.map((card, index) => (
            <div
              key={index}
              className={styles.card}
              onClick={() => navigate(card.path)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => { if (e.key === 'Enter') navigate(card.path); }}
            >
              <div className={styles.icon}>{card.icon}</div>
              <h2>{card.title}</h2>
              <p>{card.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomeDashboard;
