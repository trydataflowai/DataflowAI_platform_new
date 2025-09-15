import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/CreacionUsuario.module.css';
import { obtenerInfoUsuario } from '../../api/Usuario';

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

const ConfiguracionUsuarios = () => {
  const [companySegment, setCompanySegment] = useState("");

  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      try {
        const data = await obtenerInfoUsuario();
        if (!mounted || !data) return;
        const nombreCorto = data?.empresa?.nombre_corto ?? "";
        setCompanySegment(normalizeSegment(nombreCorto));
      } catch (err) {
        // Si falla, dejamos companySegment vacío para que las rutas queden sin prefijo.
        console.error("No se pudo obtener nombre_corto:", err);
        if (mounted) setCompanySegment("");
      }
    };
    fetchUser();
    return () => { mounted = false; };
  }, []);

  const buildTo = (to) => {
    // separar hash si existe: '/ruta#hash'
    const [baseRaw, hash] = to.split("#");
    const base = baseRaw.startsWith("/") ? baseRaw : `/${baseRaw}`;

    // si el base está en NO_PREFIX -> no anteponer segmento
    if (NO_PREFIX.includes(base)) {
      return hash ? `${base}#${hash}` : base;
    }

    // si ya viene con segmento, devolver tal cual
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
    <div className={styles.container}>
      <h1>Configuración de Usuarios</h1>
      <div className={styles.cardsContainer}>
        {opciones.map((opcion, index) => (
          <Link key={index} to={buildTo(opcion.ruta)} className={styles.card}>
            <p>{opcion.texto}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ConfiguracionUsuarios;
