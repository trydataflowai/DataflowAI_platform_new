DAME EL JSX

C:\Users\Julian Herreño\OneDrive - Colombian Trade Company SAS\DATA\02. AREAS\DATA\Julian Estif Herreno Palacios\09-DataFlow-WebSite\front-dataflowai\src\styles\empresas\1\Index.module.css

Tengo esta api

C:\Users\Julian Herreño\OneDrive - Colombian Trade Company SAS\DATA\02. AREAS\DATA\Julian Estif Herreno Palacios\09-DataFlow-WebSite\front-dataflowai\src\api\Usuario.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const obtenerInfoUsuario = async () => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}usuario/info/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('No se pudo obtener la información del usuario');
  }

  return await response.json();
};

{
  "id": 1,
  "nombres": "Julian",
  "correo": "herrenojulian@coltrade.com.co",
  "rol": "Administrador",
  "empresa": {
    "id": 1,
    "nombre": "Colombian Trade Company Sas",
    "nombre_corto": "Coltrade",
    "direccion": "7200 NW 84th Ave, Medley, FL 33166, Estados Unidos",
    "fecha_registro": "2025-08-19",
    "telefono": "3025830404",
    "ciudad": "Miami",
    "pais": "Colombia",
    "categoria": {
      "id": 1,
      "descripcion": "Tecnología"
    },
    "plan": {
      "id": 3,
      "tipo": "Premium anual"
    },
    "estado": {
      "id": 1,
      "nombre": "Activo"
    }
  },
  "productos": [
    {
      "id_producto": 7,
      "producto": "Tmk e Ecommerce",
      "slug": "tmk-e-ecommerce",
      "iframe": "<if"
    },
    {
      "id_producto": 8,
      "producto": "Ventas Falabella",
      "slug": "ventas-falabella",
      "iframe": "<if"
    },

como ves tiene este campo llamado ID q es el id de la emre

  "empresa": {
    "id": 1,
    "nombre": "Colombian Trade Company Sas",

q quiero hacer como ve tengo estas carpetas

PS C:\Users\Julian Herreño\OneDrive - Colombian Trade Company SAS\DATA\02. AREAS\DATA\Julian Estif Herreno Palacios\09-DataFlow-WebSite\front-dataflowai\src\styles\empresas> ls

    Directorio: C:\Users\Julian Herreño\OneDrive - Colombian Trade Company SAS\DATA\02. AREAS\DATA\Julian Estif Herreno Palacios\09-DataFlow-WebSite\front-dataflowai\src\styles\empresas

Mode                 LastWriteTime         Length Name

---

dar--l       4/11/2025  8:24 a. m.                1
d-----       4/11/2025  8:24 a. m.                2
d-----       4/11/2025  8:24 a. m.                3

entonces eh, ejemplo hay la carpeta llamada 1 y es donde tengo los estilo de la empresa pue con id uno, ósea relaciono la carpeta con el ID y el nombre de la carpeta

ahora dentro de esa carpeta hay

esto, esto es con una empresa de ID  3

PS C:\Users\Julian Herreño\OneDrive - Colombian Trade Company SAS\DATA\02. AREAS\DATA\Julian Estif Herreno Palacios\09-DataFlow-WebSite\front-dataflowai\src\styles\empresas\3> ls

    Directorio: C:\Users\Julian Herreño\OneDrive - Colombian Trade Company SAS\DATA\02. AREAS\DATA\Julian Estif Herreno Palacios\09-DataFlow-WebSite\front-dataflowai\src\styles\empresas\3

Mode                 LastWriteTime         Length Name

---

-a---l       4/11/2025  8:28 a. m.           7763 Perfil.module.css

PS C:\Users\Julian Herreño\OneDrive - Colombian Trade Company SAS\DATA\02. AREAS\DATA\Julian Estif Herreno Palacios\09-DataFlow-WebSite\front-dataflowai\src\styles\empresas\3>

lo q quiero es que pase los siguiente

cuando en
"plan": {
      "id": 3,
      "tipo": "Premium anual"

sea 6 o 3 use los estilos que están dentro de esta carpeta

PS C:\Users\Julian Herreño\OneDrive - Colombian Trade Company SAS\DATA\02. AREAS\DATA\Julian Estif Herreno Palacios\09-DataFlow-WebSite\front-dataflowai\src\styles\empresas\3>

y sino use los estilos que ya importe el JSX ósea este : C:\Users\Julian Herreño\OneDrive - Colombian Trade Company SAS\DATA\02. AREAS\DATA\Julian Estif Herreno Palacios\09-DataFlow-WebSite\front-dataflowai\src\styles\Profile\Perfil.module.css

ejemplo

Inegreso con un una empresa que tiene en su plan 3 y ella es id 3 ósea la empresa y como ves tiene este archivo dentro de sus carpetas de css

C:\Users\Julian Herreño\OneDrive - Colombian Trade Company SAS\DATA\02. AREAS\DATA\Julian Estif Herreno Palacios\09-DataFlow-WebSite\front-dataflowai\src\styles\empresas\3\Perfil.module.css

peor también existe este C:\Users\Julian Herreño\OneDrive - Colombian Trade Company SAS\DATA\02. AREAS\DATA\Julian Estif Herreno Palacios\09-DataFlow-WebSite\front-dataflowai\src\styles\Profile\Perfil.module.css

entonces debería usar el de las carpetas de empresa

ahora por ejemplo inicia sesión alguien con id plan 3 pero el es ID 5 y ejemplo no esta dentro de las carpetas pues usaría este css C:\Users\Julian Herreño\OneDrive - Colombian Trade Company SAS\DATA\02. AREAS\DATA\Julian Estif Herreno Palacios\09-DataFlow-WebSite\front-dataflowai\src\styles\Profile\Perfil.module.css

a lo q quiero llegar es q siempre se usará este nombre Perfil.module.css pero lo único q cambia son las rutas dependiendo el ID de la empresa y el ID del plan y si estyá creado,
ahora ayúdame implementando eso en este JSX

// src/components/pages/ConfiguracionUsuarios.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from '../../styles/Profile/Perfil.module.css';
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

const Card = ({ texto, ruta, index, onCardClick }) => {
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

    el.style.setProperty("--rx",`${rx.toFixed(2)}deg`);
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
      `<div className={styles.PerfilgeneralcardInner}>`
        `<div className={styles.PerfilgeneralcardHeader}>`
          `<h3 className={styles.PerfilgeneralcardTitle}>`{texto}`</h3>`
          `<div className={styles.PerfilgeneralcardMeta}>`
            `<span className={styles.Perfilgeneralbadge}>`{index + 1}
          `</div>`
        `</div>`

    `<div className={styles.PerfilgeneralcardBody}>`
          `<p className={styles.PerfilgeneralcardDesc}>`
            Accede a esta opción para gestionar permisos, revisión y seguridad.
          `</p>`
        `</div>`

    `<div className={styles.PerfilgeneralcardFooter}>`
          `<span className={styles.Perfilgeneralcta}>`Ir a la configuración →
        `</div>`
      `</div>`
    `</div>`
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

    setCompanySegment(normalizeSegment(nombreCorto));
        setPlanId(pid);
        setPlanName(pName);
        setRol(r);
      } catch (err) {
        console.error("No se pudo obtener info de usuario:", err);
        if (mounted) {
          setCompanySegment("");
          setPlanId(null);
          setPlanName("");
          setRol(null);
        }
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
      return hash ?`${base}#${hash}` : base;
    }

    if (companySegment && base.startsWith(`/${companySegment}`)) {
      return hash ? `${base}#${hash}` : base;
    }

    const fullBase = companySegment ?`/${companySegment}${base}` : base;
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

  // Decide clase variante (dark/light) según planId y theme (mismo comportamiento anterior)
  const variantClass =
    planId === 3 || planId === 6
      ? theme === "dark"
        ? styles.PerfilgeneralDark
        : styles.PerfilgeneralLight
      : styles.PerfilgeneralDark;

  return (
    <main className={`${styles.Perfilgeneralcontainer} ${variantClass}`} aria-labelledby="config-usuarios-title">
      `<header className={styles.Perfilgeneralheader}>`
        `<h1 id="config-usuarios-title" className={styles.Perfilgeneraltitle}>`
          Configuración de Usuarios
        `</h1>`
        `<p className={styles.Perfilgeneralsubtitle}>`
          Opciones rápidas — seguridad y administración con estilo.
        `</p>`
      `</header>`

    <section className={styles.PerfilgeneralcardsContainer} aria-label="Opciones de configuración">
        {opciones.map((opcion, index) => (`<Card
            key={index}
            texto={opcion.texto}
            ruta={opcion.ruta}
            index={index}
            onCardClick={handleCardClick}
          />`
        ))}
      `</section>`

    {showModal && (
        <div
          className={styles.PerfilgeneralmodalOverlay}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >`<div
            className={styles.Perfilgeneralmodal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby="modal-desc"
          >`
            `<h2 id="modal-title" className={styles.PerfilgeneralmodalTitle}>`
              Acceso restringido
            `</h2>`
            `<p id="modal-desc" className={styles.PerfilgeneralmodalDesc}>`
              {modalMessage}
            `</p>`

    `<div className={styles.PerfilgeneralmodalActions}>`
              `<button
                className={styles.PerfilgeneralbtnPrimary}
                onClick={closeModal}
                autoFocus
              >`
                Aceptar
              `</button>`
            `</div>`
          `</div>`
        `</div>`
      )}
    `</main>`
  );
};

export default ConfiguracionUsuarios;
