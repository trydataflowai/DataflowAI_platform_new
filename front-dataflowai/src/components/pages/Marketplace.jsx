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

// Componente de confirmación
const ConfirmationModal = ({ isOpen, onConfirm, onCancel, dashboardName, styles }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Confirmar Adquisición</h3>
        </div>
        <div className={styles.modalBody}>
          <p className={styles.modalText}>
            ¿Estás seguro de que quieres adquirir el dashboard <strong>"{dashboardName}"</strong>?
          </p>
        </div>
        <div className={styles.modalActions}>
          <button 
            onClick={onCancel}
            className={`${styles.button} ${styles.buttonSecondary}`}
          >
            <span className={styles.buttonText}>Cancelar</span>
          </button>
          <button 
            onClick={onConfirm}
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            <span className={styles.buttonIcon}>💎</span>
            <span className={styles.buttonText}>Sí, Adquirir</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente de tarjeta mejorado
const DashboardCard = ({ dash, adquirido, loading, onAcquire, onView, styles }) => (
  <div className={styles.card}>
    <div className={styles.cardGlow}></div>
    <div className={styles.cardContent}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{dash.producto}</h3>
        <div className={styles.cardBadge}>
          {adquirido ? 'Adquirido' : 'Disponible'}
        </div>
      </div>
      
      <div className={styles.cardBody}>
        <p className={styles.cardSlug}>
          <span className={styles.slugLabel}>Slug:</span>
          <code className={styles.slugValue}>{dash.slug}</code>
        </p>
        
        <div className={styles.cardDescription}>
          <p>Dashboard interactivo con análisis avanzado de datos y visualizaciones en tiempo real.</p>
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
              {loading ? 'Adquiriendo...' : 'Adquirir Dashboard'}
            </span>
            {loading && <div className={styles.loadingSpinner}></div>}
          </button>
        )}

        <button 
          onClick={() => onView(dash.slug)}
          className={`${styles.button} ${styles.buttonSecondary}`}
        >
          <span className={styles.buttonIcon}>👁️</span>
          <span className={styles.buttonText}>Ver Dashboard</span>
        </button>
      </div>
    </div>
  </div>
);

// Página principal Marketplace
export const Marketplace = () => {
  const { theme } = useTheme();
  const [styles, setStyles] = useState(darkStyles);
  const [dashboards, setDashboards] = useState([]);
  const [adquiridos, setAdquiridos] = useState([]);
  const [loadingIds, setLoadingIds] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [planId, setPlanId] = useState(null);
  
  // Estados para el modal de confirmación
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  
  const navigate = useNavigate();

  // 1) Traer info de usuario y plan al montar (igual que en SideBar)
  useEffect(() => {
    const loadData = async () => {
      try {
        const [userInfoData, allDashboards] = await Promise.all([
          obtenerInfoUsuario(),
          obtenerTodosLosDashboards()
        ]);
        
        // Extraer planId correctamente de la estructura de datos
        const pid = userInfoData.empresa.plan.id;
        setPlanId(pid);
        setUserInfo(userInfoData);
        setAdquiridos(userInfoData.productos.map(p => p.id_producto));
        setDashboards(allDashboards);
      } catch (error) {
        console.error('Error loading marketplace data:', error);
      }
    };

    loadData();
  }, []);

  // 2) Actualizar estilos cuando cambie planId o theme (igual que en SideBar)
  useEffect(() => {
    if (planId === 3 || planId === 6) {
      // planes que permiten toggle
      setStyles(theme === 'dark' ? darkStyles : lightStyles);
    } else {
      // otros planes: siempre dark
      setStyles(darkStyles);
    }
  }, [theme, planId]);

  // Función para mostrar confirmación
  const handleAcquireClick = (id, productName) => {
    setSelectedDashboard({ id, name: productName });
    setShowConfirmation(true);
  };

  // Función para confirmar adquisición
  const handleConfirmAcquire = async () => {
    if (!selectedDashboard) return;
    
    const { id } = selectedDashboard;
    setLoadingIds(ids => [...ids, id]);
    setShowConfirmation(false);
    
    try {
      await adquirirDashboard(id);
      setAdquiridos(ids => [...ids, id]);
      const dash = dashboards.find(d => d.id_producto === id);
      navigate(`/${dash.slug}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingIds(ids => ids.filter(x => x !== id));
      setSelectedDashboard(null);
    }
  };

  // Función para cancelar confirmación
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

  return (
    <div className={styles.marketplace}>
      <div className={styles.container}>
        {/* Header del Marketplace */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>
              <span className={styles.titleIcon}></span>
              Marketplace
              <span className={styles.titleGlow}></span>
            </h1>
            <p className={styles.subtitle}>
              Descubre y adquiere dashboards premium para potenciar tu análisis de datos
            </p>
          </div>
          
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{dashboards.length}</div>
              <div className={styles.statLabel}>Total</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{adquiridosCount}</div>
              <div className={styles.statLabel}>Adquiridos</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{availableCount}</div>
              <div className={styles.statLabel}>Disponibles</div>
            </div>
          </div>
        </div>

        {/* Grid de Dashboards */}
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
            <h3 className={styles.emptyTitle}>No hay dashboards disponibles</h3>
            <p className={styles.emptyText}>
              Los dashboards aparecerán aquí cuando estén disponibles.
            </p>
          </div>
        )}
      </div>

      {/* Modal de Confirmación */}
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