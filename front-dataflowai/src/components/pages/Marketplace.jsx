import React, { useEffect, useState } from 'react';
import styles from '../../styles/Marketplace.module.css';
import {
  obtenerTodosLosDashboards,
  adquirirDashboard
} from '../../api/Dashboards';
import { obtenerInfoUsuario } from '../../api/Usuario';

// 1) Glob para imágenes (eager import, devuelve URL)
const imageModules = import.meta.glob(
  '../../assets/img-dashboards/*.jpg',
  { eager: true, import: 'default' }
);
// 2) Glob para plantillas Excel (eager, como URL)
const excelModules = import.meta.glob(
  '../../assets/plantillas-dashboards/*.xlsx',
  { eager: true, as: 'url' }
);

// Construyo dos mapas { '2525': url, '2626': url, ... }
const imageMap = {};
for (const path in imageModules) {
  const fileName = path.split('/').pop().replace('.jpg', '');
  imageMap[fileName] = imageModules[path];
}
const excelMap = {};
for (const path in excelModules) {
  const fileName = path.split('/').pop().replace('.xlsx', '');
  excelMap[fileName] = excelModules[path];
}

const DashboardCard = ({ d, isAdq, isLoading, onAdquirir, onOpenDashboard }) => {
  const [hasExcel, setHasExcel] = useState(null);
  const [imgUrl, setImgUrl] = useState(null);

  // Al montar, compruebo si hay imagen y si hay Excel
  useEffect(() => {
    const id = String(d.id_producto);
    setImgUrl(imageMap[id] || null);
    setHasExcel(excelMap[id] !== undefined);
  }, [d.id_producto]);

  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>{d.producto}</h3>
      <p className={styles.cardStatus}>Estado: {d.estado}</p>

      {/* Imagen o placeholder */}
      {imgUrl ? (
        <img
          src={imgUrl}
          alt={d.producto}
          className={styles.cardImage}
        />
      ) : (
        <div className={styles.noImage}>Sin foto</div>
      )}

      {isAdq ? (
        <>
          <span className={styles.adquiridoLabel}>✓ Adquirido</span>

          {hasExcel ? (
            <a
              href={excelMap[String(d.id_producto)]}
              download={`${d.id_producto}.xlsx`}
              className={styles.downloadButton}
            >
              Descargar plantilla
            </a>
          ) : (
            <div className={styles.noFile}>Sin archivo disponible</div>
          )}
        </>
      ) : (
        <button
          className={styles.button}
          onClick={() => onAdquirir(d.id_producto)}
          disabled={isLoading}
        >
          {isLoading ? 'Adquiriendo…' : 'Adquirir dashboard'}
        </button>
      )}

      <button
        onClick={() => onOpenDashboard(d.Url)}
        className={styles.linkButton}
      >
        Ver Reporte
      </button>
    </div>
  );
};

const DashboardModal = ({ url, onClose }) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={onClose}>
          &times;
        </button>
        <iframe 
          src={url} 
          className={styles.dashboardFrame}
          title="Dashboard"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export const Marketplace = () => {
  const [dashboards, setDashboards] = useState([]);
  const [adquiridos, setAdquiridos] = useState([]);
  const [loadingIds, setLoadingIds] = useState([]);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [dashboardUrl, setDashboardUrl] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [userInfo, allDash] = await Promise.all([
          obtenerInfoUsuario(),
          obtenerTodosLosDashboards()
        ]);
        setAdquiridos(userInfo.productos.map(p => p.id_producto));
        setDashboards(allDash);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, []);

  const handleAdquirir = async (id) => {
    setLoadingIds(prev => [...prev, id]);
    try {
      await adquirirDashboard(id);
      setAdquiridos(prev => [...prev, id]);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoadingIds(prev => prev.filter(x => x !== id));
    }
  };

  const handleOpenDashboard = (url) => {
    setDashboardUrl(url);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setDashboardUrl('');
  };

  if (error) {
    return <p className={styles.error}>Error: {error}</p>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Marketplace</h1>
      <p className={styles.description}>Bienvenido al Marketplace de DataFlow AI.</p>

      <div className={styles.cardContainer}>
        {dashboards.map(d => (
          <DashboardCard
            key={d.id_producto}
            d={d}
            isAdq={adquiridos.includes(d.id_producto)}
            isLoading={loadingIds.includes(d.id_producto)}
            onAdquirir={handleAdquirir}
            onOpenDashboard={handleOpenDashboard}
          />
        ))}
      </div>

      {modalOpen && (
        <DashboardModal 
          url={dashboardUrl} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
};