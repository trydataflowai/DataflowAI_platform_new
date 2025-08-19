// src/components/pages/Marketplace.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../componentes/ThemeContext';
import {
  obtenerTodosLosDashboards,
  adquirirDashboard
} from '../../api/Dashboards';
import { obtenerInfoUsuario } from '../../api/Usuario';
import darkStyles from '../../styles/Marketplace.module.css';
import lightStyles from '../../styles/MarketplaceLight.module.css';

// Confirmation modal
const ConfirmationModal = ({ isOpen, onConfirm, onCancel, dashboardName, styles }) => {
  if (!isOpen) return null;
  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Confirm Acquisition</h3>
        </div>
        <div className={styles.modalBody}>
          <p className={styles.modalText}>
            Are you sure you want to acquire the dashboard <strong>"{dashboardName}"</strong>?
          </p>
        </div>
        <div className={styles.modalActions}>
          <button 
            onClick={onCancel}
            className={`${styles.button} ${styles.buttonSecondary}`}
          >
            <span className={styles.buttonText}>Cancel</span>
          </button>
          <button 
            onClick={onConfirm}
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            <span className={styles.buttonIcon}>💎</span>
            <span className={styles.buttonText}>Yes, Acquire</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Dashboard card
const DashboardCard = ({ dash, adquirido, loading, onAcquire, onView, styles }) => (
  <div className={styles.card}>
    <div className={styles.cardGlow}></div>
    <div className={styles.cardContent}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{dash.producto}</h3>
        <div className={styles.cardBadge}>
          {adquirido ? 'Acquired' : 'Available'}
        </div>
      </div>
      
      <div className={styles.cardBody}>
        <p className={styles.cardSlug}>
          <span className={styles.slugLabel}>Slug:</span>
          <code className={styles.slugValue}>{dash.slug}</code>
        </p>
        
        <div className={styles.cardDescription}>
          <p>Interactive dashboard with advanced data analysis and real-time visualizations.</p>
        </div>
      </div>

      <div className={styles.cardActions}>
        {!adquirido && (
          <button 
            onClick={() => onAcquire(dash.id_producto, dash.producto)} 
            disabled={loading}
            className={`${styles.button} ${styles.buttonPrimary} ${loading ? styles.buttonLoading : ''}`}
          >
            <span className={styles.buttonIcon}>💎</span>
            <span className={styles.buttonText}>
              {loading ? 'Acquiring...' : 'Acquire Dashboard'}
            </span>
            {loading && <div className={styles.loadingSpinner}></div>}
          </button>
        )}

        <button 
          onClick={() => onView(dash.slug)}
          className={`${styles.button} ${styles.buttonSecondary}`}
        >
          <span className={styles.buttonIcon}>👁️</span>
          <span className={styles.buttonText}>View Dashboard</span>
        </button>
      </div>
    </div>
  </div>
);

// Main Marketplace component
export const Marketplace = () => {
  const { theme, isInitialized } = useTheme();
  const [styles, setStyles] = useState(darkStyles);
  const [dashboards, setDashboards] = useState([]);
  const [adquiridos, setAdquiridos] = useState([]);
  const [loadingIds, setLoadingIds] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [planId, setPlanId] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [userInfoData, allDashboards] = await Promise.all([
          obtenerInfoUsuario(),
          obtenerTodosLosDashboards()
        ]);

        const pid = userInfoData?.empresa?.plan?.id;
        setPlanId(pid);
        setUserInfo(userInfoData);
        setAdquiridos((userInfoData?.productos || []).map(p => p.id_producto));

        // ------------------------
        // FILTRADO: EXCLUIR "enterprise" Y "privado"
        // - No mostrar productos cuyo tipo sea "enterprise" ni "privado".
        // - Compara en minúsculas y revisa campos alternativos por si acaso.
        // ------------------------
        const filtered = (allDashboards || []).filter(d => {
          const tipo = (d.tipo_producto || '').toString().trim().toLowerCase();
          const tipoAlt = (d.tipo_producto_display || d.tipo_producto_label || '').toString().trim().toLowerCase();

          // Excluir si es "enterprise" o "privado"
          if (tipo === 'enterprise' || tipo === 'privado') return false;
          if (tipoAlt === 'enterprise' || tipoAlt === 'privado') return false;

          return true;
        });

        setDashboards(filtered);
      } catch (error) {
        console.error('Error loading marketplace data:', error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    if (planId === 3 || planId === 6) {
      setStyles(theme === 'dark' ? darkStyles : lightStyles);
    } else {
      setStyles(darkStyles);
    }
  }, [theme, planId, isInitialized]);

  const handleAcquireClick = (id, productName) => {
    setSelectedDashboard({ id, name: productName });
    setShowConfirmation(true);
  };

  const handleConfirmAcquire = async () => {
    if (!selectedDashboard) return;
    const { id } = selectedDashboard;
    setLoadingIds(ids => [...ids, id]);
    setShowConfirmation(false);
    try {
      await adquirirDashboard(id);
      setAdquiridos(ids => [...ids, id]);
      const dash = dashboards.find(d => d.id_producto === id);
      if (dash) navigate(`/${dash.slug}`);
    } catch (err) {
      alert(err.message || 'Error acquiring dashboard');
    } finally {
      setLoadingIds(ids => ids.filter(x => x !== id));
      setSelectedDashboard(null);
    }
  };

  const handleCancelAcquire = () => {
    setShowConfirmation(false);
    setSelectedDashboard(null);
  };

  const handleView = (slug) => {
    const url = `${window.location.origin}/${slug}`;
    window.open(url, '_blank');
  };

  const adquiridosCount = adquiridos.length;
  const availableCount = dashboards.length - adquiridosCount;

  if (!isInitialized) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div className={`${styles.marketplace} ${isInitialized ? 'theme-loaded' : 'theme-loading'}`}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>
              <span className={styles.titleIcon}></span>
              Marketplace
              <span className={styles.titleGlow}></span>
            </h1>
            <p className={styles.subtitle}>
              Discover and acquire premium dashboards to enhance your data analysis
            </p>
          </div>
          
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{dashboards.length}</div>
              <div className={styles.statLabel}>Total</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{adquiridosCount}</div>
              <div className={styles.statLabel}>Acquired</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{availableCount}</div>
              <div className={styles.statLabel}>Available</div>
            </div>
          </div>
        </div>

        <div className={styles.grid}>
          {dashboards.map(dash => (
            <DashboardCard
              key={dash.id_producto}
              dash={dash}
              adquirido={adquiridos.includes(dash.id_producto)}
              loading={loadingIds.includes(dash.id_producto)}
              onAcquire={handleAcquireClick}
              onView={handleView}
              styles={styles}
            />
          ))}
        </div>

        {dashboards.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📊</div>
            <h3 className={styles.emptyTitle}>No dashboards available</h3>
            <p className={styles.emptyText}>
              Dashboards will appear here when available.
            </p>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={showConfirmation}
        onConfirm={handleConfirmAcquire}
        onCancel={handleCancelAcquire}
        dashboardName={selectedDashboard?.name || ''}
        styles={styles}
      />
    </div>
  );
};
