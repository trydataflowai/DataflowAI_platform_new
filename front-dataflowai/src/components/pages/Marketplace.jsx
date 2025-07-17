import React, { useEffect, useState } from 'react';
import styles from '../../styles/Marketplace.module.css';

import { obtenerTodosLosDashboards } from '../../api/Dashboards';

export const Marketplace = () => {
  const [dashboards, setDashboards] = useState([]);

  useEffect(() => {
    const fetchDashboards = async () => {
      try {
        const data = await obtenerTodosLosDashboards();
        setDashboards(data);
      } catch (error) {
        console.error('Error al obtener los dashboards:', error);
      }
    };

    fetchDashboards();
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Marketplace</h1>
      <p className={styles.description}>Bienvenido al Marketplace de DataFlow AI.</p>

      <div className={styles.cardContainer}>
        {dashboards.map((dashboard) => (
          <div key={dashboard.id_producto} className={styles.card}>
            <h3 className={styles.cardTitle}>{dashboard.producto}</h3>
            <p className={styles.cardStatus}>Estado: {dashboard.estado}</p>
            <a
              href={dashboard.Url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.button}
            >
              Ver Reporte
            </a>
            {/* Puedes mostrar el iframe si quieres */}
            {/* <div dangerouslySetInnerHTML={{ __html: dashboard.iframe }} /> */}
          </div>
        ))}
      </div>
    </div>
  );
};
