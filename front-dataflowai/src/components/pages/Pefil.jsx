import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import darkStyles from '../../styles/Profile/PerfilDark.module.css';
import lightStyles from '../../styles/Profile/PerfilLight.module.css';
import { obtenerInfoUsuario } from "../../api/Usuario";
import { useTheme } from "../componentes/ThemeContext";

/**
 * ConfiguracionUsuarios.jsx
 * - cambia entre darkStyles / lightStyles dependiendo del planId y del tema global
 * - mantiene la misma API de clases CSS para que ambos archivos sean compatibles
 */

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

const Card = ({ texto, ruta, index, buildTo, styles }) => {
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

  return (
    <Link
      ref={ref}
      to={buildTo(ruta)}
      className={styles.card}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onFocus={() => ref.current && ref.current.style.setProperty("--s", "1.04")}
      onBlur={() => ref.current && handleLeave()}
      style={{
        ["--rx"]: "0deg",
        ["--ry"]: "0deg",
        ["--s"]: "1",
        ["--mx"]: "50%",
        ["--my"]: "50%",
      }}
      aria-label={texto}
      role="button"
    >
      <div className={styles.cardInner}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>{texto}</h3>
          <div className={styles.cardMeta}>
            <span className={styles.badge}>{index + 1}</span>
          </div>
        </div>

        <div className={styles.cardBody}>
          <p className={styles.cardDesc}>
            Accede a esta opción para gestionar permisos, revisión y seguridad.
          </p>
        </div>

        <div className={styles.cardFooter}>
          <span className={styles.cta}>Ir a la configuración →</span>
        </div>
      </div>
    </Link>
  );
};

const ConfiguracionUsuarios = () => {
  const { theme } = useTheme(); // 'dark' o 'light'
  const [companySegment, setCompanySegment] = useState("");
  const [planId, setPlanId] = useState(null);
  const [planName, setPlanName] = useState("");
  const [styles, setStyles] = useState(darkStyles); // por defecto oscuro

  // Obtener info usuario (nombre_corto y plan)
  useEffect(() => {
    let mounted = true;

    const fetchUser = async () => {
      try {
        const data = await obtenerInfoUsuario();
        if (!mounted || !data) return;

        const nombreCorto = data?.empresa?.nombre_corto ?? "";
        const pid = data?.empresa?.plan?.id ?? null;
        const pName = data?.empresa?.plan?.tipo ?? "";

        setCompanySegment(normalizeSegment(nombreCorto));
        setPlanId(pid);
        setPlanName(pName);
      } catch (err) {
        console.error("No se pudo obtener info de usuario:", err);
        if (mounted) {
          setCompanySegment("");
          setPlanId(null);
          setPlanName("");
        }
      }
    };

    fetchUser();
    return () => {
      mounted = false;
    };
  }, []);

  // Actualizar estilos cuando cambie planId o theme
  useEffect(() => {
    if (planId === 3 || planId === 6) {
      // planes que permiten toggle entre dark/light
      setStyles(theme === "dark" ? darkStyles : lightStyles);
    } else {
      // fuerzo dark para planes que no permiten cambio
      setStyles(darkStyles);
    }
  }, [theme, planId]);

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

  return (
    <main className={styles.container} aria-labelledby="config-usuarios-title">
      <header className={styles.header}>
        <h1 id="config-usuarios-title" className={styles.title}>
          Configuración de Usuarios
        </h1>
        <p className={styles.subtitle}>
          Opciones rápidas — seguridad y administración con estilo.
        </p>
      </header>

      <section className={styles.cardsContainer} aria-label="Opciones de configuración">
        {opciones.map((opcion, index) => (
          <Card
            key={index}
            texto={opcion.texto}
            ruta={opcion.ruta}
            index={index}
            buildTo={buildTo}
            styles={styles}
          />
        ))}
      </section>

      <footer className={styles.footer}>
        <small className={styles.footerSmall}>
          {planName ? `Plan: ${planName}` : "Seguridad • Permisos • Auditoría"}
        </small>
      </footer>
    </main>
  );
};

export default ConfiguracionUsuarios;
