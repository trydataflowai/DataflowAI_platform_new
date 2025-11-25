// src/components/pages/ConfiguracionUsuarios.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import defaultStyles from '../../styles/Profile/Perfil.module.css';
import { obtenerInfoUsuario } from "../../api/Usuario";
import { useTheme } from "../componentes/ThemeContext";

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

// Card refinada - diseño más sobrio
const Card = ({ texto, ruta, onCardClick, styles }) => {
  const ref = useRef(null);

  const handleClick = () => {
    onCardClick(ruta);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onCardClick(ruta);
    }
  };

  return (
    <div
      ref={ref}
      className={styles.Perfilgeneralcard}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={texto}
    >
      <div className={styles.PerfilgeneralcardInner}>
        <div className={styles.PerfilgeneralcardContent}>
          <div className={styles.PerfilgeneralcardHeader}>
            <div className={styles.PerfilgeneralcardIcon}>
              <span className={styles.Perfilgeneralicon}></span>
            </div>
            <h3 className={styles.PerfilgeneralcardTitle}>{texto}</h3>
          </div>

          <div className={styles.PerfilgeneralcardBody}>
            <p className={styles.PerfilgeneralcardDesc}>
              Gestiona y configura los parámetros del sistema
            </p>
          </div>

          <div className={styles.PerfilgeneralcardFooter}>
            <span className={styles.Perfilgeneralcta}>
              Configurar
              <span className={styles.PerfilgeneralctaArrow}>→</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConfiguracionUsuarios = () => {
  const { theme } = useTheme();
  const [companySegment, setCompanySegment] = useState("");
  const [planId, setPlanId] = useState(null);
  const [planName, setPlanName] = useState("");
  const [rol, setRol] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [companyId, setCompanyId] = useState(null);

  const [styles, setStyles] = useState(defaultStyles);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const fetchUser = async () => {
      try {
        const data = await obtenerInfoUsuario();
        if (!mounted || !data) return;

        const nombreCorto = data?.empresa?.nombre_corto ?? "";
        const pid = data?.empresa?.plan?.id ?? null;
        const pName = data?.empresa?.plan?.tipo ?? "";
        const r = data?.rol ?? data?.role ?? null;
        const cid = data?.empresa?.id ?? null;

        setCompanySegment(normalizeSegment(nombreCorto));
        setPlanId(pid);
        setPlanName(pName);
        setRol(r);
        setCompanyId(cid);
      } catch (err) {
        console.error("No se pudo obtener info de usuario:", err);
        if (mounted) {
          setCompanySegment("");
          setPlanId(null);
          setPlanName("");
          setRol(null);
          setCompanyId(null);
        }
      }
    };

    fetchUser();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadCompanyStyles = async () => {
      if ((planId === 3 || planId === 6) && companyId) {
        try {
          const module = await import(`../../styles/empresas/${companyId}/Perfil.module.css`);
          if (mounted && module && (module.default || module)) {
            const cssMap = module.default || module;
            setStyles(cssMap);
            return;
          }
        } catch (err) {
          console.warn(`No se encontró CSS custom para la empresa ${companyId}. Usando estilos por defecto.`, err);
        }
      }

      if (mounted) setStyles(defaultStyles);
    };

    loadCompanyStyles();

    return () => {
      mounted = false;
    };
  }, [planId, companyId]);

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

  const opciones = [
    { 
      texto: "Cambiar contraseña", 
      ruta: "/cambiar-contrasena",
      desc: "Actualiza tu contraseña de acceso al sistema"
    },
    { 
      texto: "Activar o desactivar usuarios", 
      ruta: "/desactivar-activar-usuarios",
      desc: "Gestiona el estado de los usuarios del sistema"
    },
    { 
      texto: "Actualizar información personal", 
      ruta: "/ModificarInformacionPersonal",
      desc: "Modifica tus datos personales y de contacto"
    },
    { 
      texto: "Asignar dashboards", 
      ruta: "/AsignarDashboards",
      desc: "Configura los dashboards disponibles para usuarios"
    },
  ];

  const rutasPermitidasUsuario = [
    "/cambiar-contrasena",
    "/ModificarInformacionPersonal",
  ];

  const handleCardClick = (ruta) => {
    if (String(rol).toLowerCase() === "administrador") {
      navigate(buildTo(ruta));
      return;
    }

    if (rutasPermitidasUsuario.includes(ruta)) {
      navigate(buildTo(ruta));
      return;
    }

    setModalMessage("Acceso restringido: solo pueden acceder administradores a esta opción.");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalMessage("");
  };

  const variantClass =
    planId === 3 || planId === 6
      ? theme === "dark"
        ? styles.PerfilgeneralDark
        : styles.PerfilgeneralLight
      : styles.PerfilgeneralDark;

  return (
    <main className={`${styles.Perfilgeneralcontainer} ${variantClass}`} aria-labelledby="config-usuarios-title">
      
      {/* Header Section */}
      <section className={styles.Perfilgeneralheader}>
        <div className={styles.PerfilgeneralheaderContent}>
          <h1 id="config-usuarios-title" className={styles.Perfilgeneraltitle}>
            Configuración
          </h1>
          <p className={styles.Perfilgeneralsubtitle}>
            Gestiona la configuración del sistema y preferencias de usuario
          </p>
        </div>
        <div className={styles.PerfilgeneralheaderMeta}>
          <span className={styles.PerfilgeneralplanInfo}>{planName}</span>
          <span className={styles.PerfilgeneralroleInfo}>{rol}</span>
        </div>
      </section>

      {/* Cards Grid */}
      <section className={styles.PerfilgeneralcardsSection} aria-label="Opciones de configuración">
        <div className={styles.PerfilgeneralcardsContainer}>
          {opciones.map((opcion, index) => (
            <Card
              key={index}
              texto={opcion.texto}
              ruta={opcion.ruta}
              onCardClick={handleCardClick}
              styles={styles}
            />
          ))}
        </div>
      </section>

      {/* Modal */}
      {showModal && (
        <div
          className={styles.PerfilgeneralmodalOverlay}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className={styles.Perfilgeneralmodal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby="modal-desc"
          >
            <h2 id="modal-title" className={styles.PerfilgeneralmodalTitle}>
              Acceso restringido
            </h2>
            <p id="modal-desc" className={styles.PerfilgeneralmodalDesc}>
              {modalMessage}
            </p>

            <div className={styles.PerfilgeneralmodalActions}>
              <button
                className={styles.PerfilgeneralbtnPrimary}
                onClick={closeModal}
                autoFocus
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default ConfiguracionUsuarios;