import React, { useEffect, useState } from 'react';
import { useTheme } from '../../componentes/ThemeContext';
import { useCompanyStyles } from '../../componentes/ThemeContextEmpresa';
import { fetchTutoriales } from '../../../api/Brokers/Tutoriales';

// Función para extraer ID de YouTube de diferentes formatos de URL
const extractYoutubeId = (url) => {
  if (!url) return null;
  
  // Patrones comunes de URLs de YouTube
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&]+)/,
    /(?:youtu\.be\/)([^?]+)/,
    /(?:youtube\.com\/embed\/)([^?]+)/,
    /(?:youtube\.com\/v\/)([^?]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  // Si es solo el ID (11 caracteres)
  if (url.match(/^[a-zA-Z0-9_-]{11}$/)) {
    return url;
  }

  return null;
};

const TutorialesCapacitacion = () => {
  const { theme } = useTheme();
  const styles = useCompanyStyles('CapacitacionesBrokers');
  
  const [tutoriales, setTutoriales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  
  // Estado para el modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTutorial, setSelectedTutorial] = useState(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTutoriales();
        if (!mounted) return;
        setTutoriales(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching tutoriales:', err);
        if (!mounted) return;
        if (err.status === 401) {
          showNotification('No autorizado. Inicia sesión nuevamente.', 'error');
          setError('No autorizado. Inicia sesión nuevamente.');
        } else {
          const errorMsg = err.payload?.error || err.message || 'Error cargando tutoriales';
          showNotification(errorMsg, 'error');
          setError(errorMsg);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Función para abrir modal con tutorial seleccionado
  const openVideoModal = (tutorial) => {
    setSelectedTutorial(tutorial);
    setModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  // Función para cerrar modal
  const closeVideoModal = () => {
    setModalOpen(false);
    setSelectedTutorial(null);
    document.body.style.overflow = 'unset';
  };

  // Manejar tecla ESC para cerrar modal
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && modalOpen) {
        closeVideoModal();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [modalOpen]);

  // Limpiar overflow cuando el componente se desmonte
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Determinar la clase de tema
  const variantClass = theme === 'dark' ? styles.dark : styles.light;

  if (loading) {
    return (
      <main className={`${styles.container} ${variantClass}`}>
        <div className={styles.heroSection}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              <span className={styles.greeting}>DataFlow</span>
              <span className={styles.username}>Tutoriales</span>
            </h1>
          </div>
        </div>
        
        <div className={styles.mainContent}>
          <div className={styles.tutorialSkeleton}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonGlow} />
                <div className={styles.skeletonContent}>
                  <div className={styles.skeletonTitle}></div>
                  <div className={styles.skeletonText}></div>
                  <div className={styles.skeletonText}></div>
                  <div className={styles.skeletonFooter}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error && tutoriales.length === 0) {
    return (
      <main className={`${styles.container} ${variantClass}`}>
        <div className={styles.heroSection}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              <span className={styles.greeting}>DataFlow</span>
              <span className={styles.username}>Tutoriales</span>
            </h1>
          </div>
        </div>
        
        <div className={styles.mainContent}>
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>
              <svg viewBox="0 0 24 24" width="64" height="64">
                <path
                  fill="currentColor"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                />
              </svg>
            </div>
            <h2 className={styles.errorTitle}>Error al cargar los tutoriales</h2>
            <p className={styles.errorMessage}>{error}</p>
            <button 
              className={styles.retryButton}
              onClick={() => window.location.reload()}
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path
                  fill="currentColor"
                  d="M17.65 6.35A8 8 0 1 0 19 12h-2a6 6 0 1 1-2.23-4.69l2.64-2.64 1.42 1.42-3.54 3.54-3.54-3.54 1.41-1.41L16.44 5.3c.38.32.74.68 1.06 1.06z"
                />
              </svg>
              Reintentar
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`${styles.container} ${variantClass}`}>
      {/* Hero Section */}
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            <span className={styles.greeting}>DataFlow</span>
            <span className={styles.username}>Tutoriales</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Aprende a usar todas las funcionalidades de la plataforma
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Stats Section */}
        <div className={styles.statsContainer}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z"
                />
              </svg>
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{tutoriales.length}</span>
              <span className={styles.statLabel}>Tutoriales disponibles</span>
            </div>
          </div>
        </div>

        {/* Tutorial Grid */}
        <div className={styles.tutorialGrid}>
          {tutoriales.length === 0 ? (
            <div className={styles.emptyState}>
              <svg viewBox="0 0 24 24" width="48" height="48">
                <path
                  fill="currentColor"
                  d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 2h6v2h-6V6zm0 4h6v2h-6v-2zm-6 0h4v2H6v-2zm10 4h-4v-2h4v2zm4 0h-2v-2h2v2zM6 14h4v2H6v-2zm10 2v-2h4v2h-4z"
                />
              </svg>
              <p>No hay tutoriales disponibles en este momento.</p>
            </div>
          ) : (
            tutoriales.map((tutorial, index) => (
              <article
                key={tutorial.id_tutorial || index}
                className={styles.tutorialCard}
                onClick={() => openVideoModal(tutorial)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openVideoModal(tutorial);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Ver tutorial: ${tutorial.titulo}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className={styles.cardGlow} />
                
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{tutorial.titulo}</h3>
                  {tutorial.categoria && (
                    <span className={styles.cardBadge}>{tutorial.categoria}</span>
                  )}
                </div>

                <div className={styles.cardContent}>
                  <p className={styles.cardDescription}>
                    {tutorial.descripcion || 'Sin descripción disponible'}
                  </p>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.cardMeta}>
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path
                        fill="currentColor"
                        d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"
                      />
                    </svg>
                    <span>{tutorial.fecha_publicacion || 'Fecha no disponible'}</span>
                  </div>
                  
                  <div className={styles.cardAction}>
                    <span>Ver tutorial</span>
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path
                        fill="currentColor"
                        d="M8 5v14l11-7z"
                      />
                    </svg>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {/* Video Modal */}
      {modalOpen && selectedTutorial && (
        <div 
          className={styles.modalOverlay}
          onClick={closeVideoModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="video-modal-title"
        >
          <div 
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3 id="video-modal-title" className={styles.modalTitle}>
                {selectedTutorial.titulo}
              </h3>
              <button
                className={styles.modalClose}
                onClick={closeVideoModal}
                aria-label="Cerrar modal"
              >
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path
                    fill="currentColor"
                    d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                  />
                </svg>
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.videoContainer}>
                {selectedTutorial.enlace ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${extractYoutubeId(selectedTutorial.enlace)}?autoplay=1&rel=0`}
                    title={selectedTutorial.titulo}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                ) : (
                  <div className={styles.videoPlaceholder}>
                    <svg viewBox="0 0 24 24" width="48" height="48">
                      <path
                        fill="currentColor"
                        d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"
                      />
                    </svg>
                    <p>Video no disponible</p>
                  </div>
                )}
              </div>
              
              {selectedTutorial.descripcion && (
                <div className={styles.videoDescription}>
                  <h4>Descripción</h4>
                  <p>{selectedTutorial.descripcion}</p>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.modalCloseButton}
                onClick={closeVideoModal}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>
          <div className={styles.notificationIcon}>
            {notification.type === 'success' ? (
              <svg viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                />
              </svg>
            )}
          </div>
          <div className={styles.notificationMessage}>
            {notification.message}
          </div>
          <div className={styles.notificationProgress}></div>
        </div>
      )}
    </main>
  );
};

export default TutorialesCapacitacion;