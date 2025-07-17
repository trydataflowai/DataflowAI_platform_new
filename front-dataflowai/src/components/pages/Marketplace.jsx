import React, { useEffect, useState } from 'react';
import styles from '../../styles/Marketplace.module.css';
import {
  obtenerTodosLosDashboards,
  adquirirDashboard
} from '../../api/Dashboards';
import { obtenerInfoUsuario } from '../../api/Usuario';

export const Marketplace = () => {
  const [dashboards, setDashboards] = useState([]);
  const [adquiridos, setAdquiridos] = useState([]);     // IDs ya adquiridos
  const [loadingIds, setLoadingIds] = useState([]);     // IDs en proceso de adquisición
  const [error, setError] = useState(null);

  // Al montar, traemos info de usuario (para saber qué ya tiene)
  // y todos los dashboards disponibles
  useEffect(() => {
    const init = async () => {
      try {
        const [userInfo, allDash] = await Promise.all([
          obtenerInfoUsuario(),
          obtenerTodosLosDashboards()
        ]);

        // Extraemos los id_producto que ya están en detalle_producto
        setAdquiridos(userInfo.productos.map(p => p.id_producto));
        setDashboards(allDash);
      } catch (e) {
        setError(e.message);
      }
    };
    init();
  }, []);

  const handleAdquirir = async (id) => {
    // Marcamos como "loading"
    setLoadingIds(prev => [...prev, id]);
    try {
      await adquirirDashboard(id);
      // Lo agregamos a la lista de adquiridos
      setAdquiridos(prev => [...prev, id]);
    } catch (e) {
      alert(e.message);
    } finally {
      // Quitamos el loading
      setLoadingIds(prev => prev.filter(x => x !== id));
    }
  };

  if (error) {
    return <p className={styles.error}>Error: {error}</p>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Marketplace</h1>
      <p className={styles.description}>
        Bienvenido al Marketplace de DataFlow AI.
      </p>

      <div className={styles.cardContainer}>
        {dashboards.map(d => {
          const isAdq = adquiridos.includes(d.id_producto);
          const isLoading = loadingIds.includes(d.id_producto);

          return (
            <div key={d.id_producto} className={styles.card}>
              <h3 className={styles.cardTitle}>{d.producto}</h3>
              <p className={styles.cardStatus}>Estado: {d.estado}</p>

              {isAdq ? (
                <span className={styles.adquiridoLabel}>✓ Adquirido</span>
              ) : (
                <button
                  className={styles.button}
                  onClick={() => handleAdquirir(d.id_producto)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Adquiriendo…' : 'Adquirir dashboard'}
                </button>
              )}

              <a
                href={d.Url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                Ver Reporte
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
};
