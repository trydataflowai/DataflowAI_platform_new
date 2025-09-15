import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import styles from '../../styles/Profile/PerfilDark.module.css';
import { obtenerInfoUsuario } from "../../api/Usuario";

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

const Card = ({ texto, ruta, index, buildTo }) => {
  const ref = useRef(null);

  // We keep an optional subtle floating animation offset
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Initialize CSS vars
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
    const px = (x / rect.width) * 100; // 0 - 100
    const py = (y / rect.height) * 100;

    // rotation intensity
    const maxDeg = 10; // more = stronger tilt
    const ry = ((px - 50) / 50) * maxDeg; // left/right
    const rx = -((py - 50) / 50) * maxDeg; // up/down

    // scale slightly on hover
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
        // sensible defaults in case CSS vars not set
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
  const [companySegment, setCompanySegment] = useState("");

  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      try {
        const data = await obtenerInfoUsuario();
        if (!mounted || !data) return;
        const nombreCorto = data?.empresa?.nombre_corto ?? "";
        setCompanySegment(
          nombreCorto ? String(nombreCorto).trim().replace(/\s+/g, "") : ""
        );
      } catch (err) {
        console.error("No se pudo obtener nombre_corto:", err);
        if (mounted) setCompanySegment("");
      }
    };
    fetchUser();
    return () => {
      mounted = false;
    };
  }, []);

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
          />
        ))}
      </section>

      <footer className={styles.footer}>
        <small>Seguridad • Permisos • Auditoría</small>
      </footer>
    </main>
  );
};

export default ConfiguracionUsuarios;
