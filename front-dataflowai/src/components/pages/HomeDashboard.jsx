import React, { useEffect, useState } from 'react';
import { obtenerProductosUsuario } from '../../api/Login';
import { obtenerInfoUsuario } from '../../api/Usuario'; // Or from Usuario.js
import { importarArchivoDashboard } from '../../api/Importacion';
import styles from '../../styles/HomeDashboard.module.css';

export const HomeDashboard = () => {
  const [productos, setProductos] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productosData, usuarioData] = await Promise.all([
          obtenerProductosUsuario(),
          obtenerInfoUsuario()
        ]);
        setProductos(productosData);
        setUsuario(usuarioData);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchData();
  }, []);

  const handleArchivo = async (id_producto, event) => {
    const archivo = event.target.files[0];
    if (!archivo) return;

    try {
      const data = await importarArchivoDashboard(id_producto, archivo);
      alert(data.mensaje || 'Import successful');
    } catch (error) {
      alert(error.message || 'Error importing file');
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      {usuario && (
        <h1>
          Hello, {usuario.nombres} from {usuario.empresa.nombre}
        </h1>
      )}
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.cardsContainer}>
        {productos.map((prod) => (
          <div key={prod.id} className={styles.card}>
            <h3>{prod.nombre}</h3>

            <button
              className={styles.openButton}
              onClick={() => window.open(prod.url, '_blank')}
            >
              View Dashboard
            </button>

            <label className={styles.importButton}>
              Import Data
              <input
                type="file"
                accept=".xlsx, .xls"
                style={{ display: 'none' }}
                onChange={(e) => handleArchivo(prod.id, e)}
              />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};