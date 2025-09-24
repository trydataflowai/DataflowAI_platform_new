import React, { useEffect, useState } from 'react';
import styles from '../../styles/ToolsDark.module.css';
import { obtenerHerramientaUsuario } from '../../api/HerramientaUsuario';

const HomeTools = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchProductos = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await obtenerHerramientaUsuario();
        if (mounted) setProductos(data || []);
      } catch (err) {
        console.error('Error al obtener herramientas:', err);
        if (mounted) setError('No se pudieron cargar las herramientas.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProductos();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <div className={styles.loading}>Cargando herramientas...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!productos.length) {
    return <div className={styles.empty}>No tienes herramientas disponibles.</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Bienvenido, acá verás tus herramientas</h1>

      <div className={styles.grid}>
        {productos.map(prod => (
          <article className={styles.card} key={prod.id_producto}>
            <div className={styles.cardBody}>
              <h2 className={styles.cardTitle}>{prod.producto}</h2>
              <p className={styles.meta}>
                <span className={styles.areaLabel}>Área:</span>{' '}
                <span className={styles.areaName}>{prod.area?.nombre ?? '—'}</span>
              </p>
              <p className={styles.tipo}>{prod.tipo_producto}</p>
            </div>

            <div className={styles.cardFooter}>
              <a
                className={styles.btn}
                href={prod.link_producto || '#'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Ir a ${prod.producto}`}
                onClick={e => {
                  if (!prod.link_producto) e.preventDefault();
                }}
              >
                Ir
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default HomeTools;
