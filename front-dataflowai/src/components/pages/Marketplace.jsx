import React, { useEffect, useState } from 'react';
import styles from '../../styles/Marketplace.module.css';
import {
  obtenerTodosLosDashboards,
  adquirirDashboard
} from '../../api/Dashboards';
import { obtenerInfoUsuario } from '../../api/Usuario';

const imageModules = import.meta.glob(
  '../../assets/img-dashboards/*.jpg',
  { eager: true, import: 'default' }
);
const excelModules = import.meta.glob(
  '../../assets/plantillas-dashboards/*.xlsx',
  { eager: true, as: 'url' }
);

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
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const id = String(d.id_producto);
    setImgUrl(imageMap[id] || null);
    setHasExcel(excelMap[id] !== undefined);
  }, [d.id_producto]);

  return (
    <div 
      className={`${styles.card} ${isHovered ? styles.cardHover : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.cardGlow}></div>
      
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{d.producto}</h3>
        <p className={styles.cardDescription}>{d.descripcion || "Professional dashboard with advanced analytics"}</p>
      </div>
      <div className={styles.cardImageContainer}>
        {imgUrl ? (
          <>
            <img
              src={imgUrl}
              alt={d.producto}
              className={styles.cardImage}
            />
            <div className={styles.imageOverlay}></div>
          </>
        ) : (
          <div className={styles.noImage}>
            <svg className={styles.imagePlaceholder} viewBox="0 0 24 24">
              <path fill="currentColor" d="M8.5 13.5l2.5 3 3.5-4.5 4.5 6H5m16 1V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7h-2v7z"/>
            </svg>
          </div>
        )}
        
        {isAdq && (
          <div className={styles.acquiredBadge}>
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11V11.99z"/>
            </svg>
          </div>
        )}
      </div>

      <div className={styles.cardContent}>
        <div className={styles.cardStats}>
          <div className={styles.statItem}>
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 3L1 9l11 6 9-4.91V17h2V9M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
            </svg>
            <span>{d.complejidad || "Advanced"}</span>
          </div>
        </div>

        <div className={styles.cardActions}>
          <button
            onClick={() => onOpenDashboard(d.Url)}
            className={styles.previewButton}
          >
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 9a3 3 0 013 3 3 3 0 01-3 3 3 3 0 01-3-3 3 3 0 013-3m0-4.5c5 0 9.27 3.11 11 7.5-1.73 4.39-6 7.5-11 7.5S2.73 16.39 1 12c1.73-4.39 6-7.5 11-7.5M3.18 12a9.821 9.821 0 0017.64 0 9.821 9.821 0 00-17.64 0z"/>
            </svg>
            View Dashboard
          </button>
          
          {!isAdq && (
            <button
              className={`${styles.buyButton} ${isLoading ? styles.buttonLoading : ''}`}
              onClick={() => onAdquirir(d.id_producto)}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className={styles.spinner}></div>
              ) : (
                <>
                  <svg viewBox="0 0 24 24">
                    <path fill="currentColor" d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                  </svg>
                  Acquire
                </>
              )}
            </button>
          )}
          
          {isAdq && hasExcel && (
            <button
              className={styles.downloadButton}
              onClick={() => window.open(excelMap[String(d.id_producto)], '_blank')}
            >
              <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M5 20h14v-2H5m14-9h-4V3H9v6H5l7 7 7-7z"/>
              </svg>
              Template
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const DashboardModal = ({ url, onClose }) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Dashboard Preview</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

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

  const filteredDashboards = dashboards.filter(d => {
    const matchesSearch = d.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         d.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || d.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...new Set(dashboards.map(d => d.categoria).filter(Boolean))];

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <svg className={styles.errorIcon} viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <h3>Error loading Marketplace</h3>
          <p>{error}</p>
          <button 
            className={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Exclusive Marketplace</h1>
          <p className={styles.heroSubtitle}>Discover premium dashboards designed to transform your data into powerful insights</p>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.controlsContainer}>
          <div className={styles.searchContainer}>
            <div className={styles.searchInput}>
              <svg className={styles.searchIcon} viewBox="0 0 24 24">
                <path fill="currentColor" d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 001.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 00-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 005.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input
                type="text"
                placeholder="Search dashboards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  className={styles.clearSearch}
                  onClick={() => setSearchTerm('')}
                >
                  <svg viewBox="0 0 24 24">
                    <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className={styles.categoryFilter}>
            <svg className={styles.filterIcon} viewBox="0 0 24 24">
              <path fill="currentColor" d="M14 12v7.88c.04.3-.06.62-.29.83a.996.996 0 01-1.41 0l-2.01-2.01a.989.989 0 01-.29-.83V12h-.03L4.21 4.62a1 1 0 01.17-1.4c.19-.14.4-.22.62-.22h14c.22 0 .43.08.62.22a1 1 0 01.17 1.4L14.03 12H14z"/>
            </svg>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={styles.categorySelect}
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.cardGrid}>
          {filteredDashboards.length > 0 ? (
            filteredDashboards.map(d => (
              <DashboardCard
                key={d.id_producto}
                d={d}
                isAdq={adquiridos.includes(d.id_producto)}
                isLoading={loadingIds.includes(d.id_producto)}
                onAdquirir={handleAdquirir}
                onOpenDashboard={handleOpenDashboard}
              />
            ))
          ) : (
            <div className={styles.noResults}>
              <svg className={styles.noResultsIcon} viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z"/>
              </svg>
              <h3>No dashboards found</h3>
              <p>Try adjusting your search filters</p>
            </div>
          )}
        </div>
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
