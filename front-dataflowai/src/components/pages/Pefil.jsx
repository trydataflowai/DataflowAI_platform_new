import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/CreacionUsuario.module.css';

const ConfiguracionUsuarios = () => {
  const opciones = [
    { texto: "¿Deseas cambiar la contraseña?", ruta: "/cambiar-contrasena" },
    { texto: "¿Deseas activar o desactivar un usuario?", ruta: "/desactivar-activar-usuarios" },
    { texto: "¿Deseas actualizar información de tu empresa o usuario?", ruta: "/actualizar-usuario" },
    { texto: "¿Deseas conocer los pagos realizados - Facturación?", ruta: "/facturacion" },
    { texto: "¿Deseas crear un usuario?", ruta: "/crear-usuario" },
  ];

  return (
    <div className={styles.container}>
      <h1>Configuración de Usuarios</h1>
      <div className={styles.cardsContainer}>
        {opciones.map((opcion, index) => (
          <Link key={index} to={opcion.ruta} className={styles.card}>
            <p>{opcion.texto}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ConfiguracionUsuarios;
