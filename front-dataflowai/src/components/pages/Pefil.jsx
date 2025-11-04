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

// Card recibe el objeto `styles` dinámico como prop para usar el CSS correcto
const Card = ({ texto, ruta, index, onCardClick, styles }) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--s", "1");
    el.style.setProperty("--mx", "50%");
    el.style.setProperty("--my", "50%");
  }, []);

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = (x / rect.width) * 100;
    const py = (y / rect.height) * 100;

    const maxDeg = 10;
    const ry = ((px - 50) / 50) * maxDeg;
    const rx = -((py - 50) / 50) * maxDeg;
    const s = 1.06;

    el.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
    el.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
    el.style.setProperty("--s", s.toString());
    el.style.setProperty("--mx", `${px}%`);
    el.style.setProperty("--my", `${py}%`);
  };

  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", `0deg`);
    el.style.setProperty("--ry", `0deg`);
    el.style.setProperty("--s", `1`);
    el.style.setProperty("--mx", `50%`);
    el.style.setProperty("--my", `50%`);
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
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onFocus={() => ref.current && ref.current.style.setProperty("--s", "1.04")}
      onBlur={() => ref.current && handleLeave()}
      onClick={() => onCardClick(ruta)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={texto}
      style={{
        ["--rx"]: "0deg",
        ["--ry"]: "0deg",
        ["--s"]: "1",
        ["--mx"]: "50%",
        ["--my"]: "50%",
      }}
    >
      <div className={styles.PerfilgeneralcardInner}>
        <div className={styles.PerfilgeneralcardHeader}>
          <h3 className={styles.PerfilgeneralcardTitle}>{texto}</h3>
          <div className={styles.PerfilgeneralcardMeta}>
            <span className={styles.Perfilgeneralbadge}>{index + 1}</span>
          </div>
        </div>

        <div className={styles.PerfilgeneralcardBody}>
          <p className={styles.PerfilgeneralcardDesc}>
            Accede a esta opción para gestionar permisos, revisión y seguridad.
          </p>
        </div>

        <div className={styles.PerfilgeneralcardFooter}>
          <span className={styles.Perfilgeneralcta}>Ir a la configuración →</span>
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

  // `styles` es el CSS module activo (por defecto defaultStyles)
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

  // Cargar dinámicamente el módulo CSS si aplica
  useEffect(() => {
    let mounted = true;

    const loadCompanyStyles = async () => {
      // Solo intentamos usar estilos personalizados si el plan es 3 o 6
      if ((planId === 3 || planId === 6) && companyId) {
        try {
          // Intento de import dinámico del CSS module de la empresa
          const module = await import(`../../styles/empresas/${companyId}/Perfil.module.css`);
          // En Vite/ESM los CSS modules exportan el mapeo como default
          if (mounted && module && (module.default || module)) {
            const cssMap = module.default || module;
            setStyles(cssMap);
            return;
          }
        } catch (err) {
          // No existe el archivo o fallo en la importación: fallback al default
          console.warn(`No se encontró CSS custom para la empresa ${companyId} o hubo un error. Usando estilos por defecto.`, err);
        }
      }

      // fallback general
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
    { texto: "¿Deseas cambiar la contraseña?", ruta: "/cambiar-contrasena" },
    { texto: "¿Deseas activar o desactivar un usuario?", ruta: "/desactivar-activar-usuarios" },
    { texto: "¿Deseas actualizar información de tu empresa o usuario?", ruta: "/ModificarInformacionPersonal" },
    { texto: "¿Deseas asignar los dashboards?", ruta: "/AsignarDashboards" },
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

  // Decide clase variante (dark/light) según planId y theme
  const variantClass =
    planId === 3 || planId === 6
      ? theme === "dark"
        ? styles.PerfilgeneralDark
        : styles.PerfilgeneralLight
      : styles.PerfilgeneralDark;

  return (
    <main className={`${styles.Perfilgeneralcontainer} ${variantClass}`} aria-labelledby="config-usuarios-title">
      <header className={styles.Perfilgeneralheader}>
        <h1 id="config-usuarios-title" className={styles.Perfilgeneraltitle}>
          Configuración de Usuarios
        </h1>
        <p className={styles.Perfilgeneralsubtitle}>
          Opciones rápidas — seguridad y administración con estilo.
        </p>
      </header>

      <section className={styles.PerfilgeneralcardsContainer} aria-label="Opciones de configuración">
        {opciones.map((opcion, index) => (
          <Card
            key={index}
            texto={opcion.texto}
            ruta={opcion.ruta}
            index={index}
            onCardClick={handleCardClick}
            styles={styles}
          />
        ))}
      </section>

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
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default ConfiguracionUsuarios;
