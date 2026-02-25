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
          setError('No autorizado. Inicia sesión nuevamente.');
        } else {
          setError(err.payload?.error || err.message || 'Error cargando tutoriales');
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

  // Función para abrir modal con tutorial seleccionado
  const openVideoModal = (tutorial) => {
    setSelectedTutorial(tutorial);
    setModalOpen(true);
    // Prevenir scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden';
  };

  // Función para cerrar modal
  const closeVideoModal = () => {
    setModalOpen(false);
    setSelectedTutorial(null);
    // Restaurar scroll del body
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
  const themeClass = theme === 'dark' ? styles.PerfilgeneralDark : styles.PerfilgeneralLight;

  if (loading) {
    return (
      <div className={`${styles.container} ${themeClass}`}>
        <h1>Tutoriales DataFlow</h1>
        <div className={styles.loadingState}>
          <div className={styles.loadingSkeleton}></div>
          <p style={{ marginTop: '20px' }}>Cargando tutoriales...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.container} ${themeClass}`}>
        <h1>Tutoriales DataFlow</h1>
        <div className={styles.errorState} role="alert">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${themeClass}`}>
      <h1>Tutoriales DataFlow</h1>

      <div className={styles.tutorialGrid}>
        {tutoriales.length === 0 && (
          <div className={styles.emptyState}>
            No hay tutoriales disponibles en este momento.
          </div>
        )}

        {tutoriales.map((t) => (
          <article
            key={t.id_tutorial}
            className={styles.tutorialCard}
            onClick={() => openVideoModal(t)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openVideoModal(t);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={`Ver tutorial: ${t.titulo}`}
          >
            <div className={styles.tutorialContent}>
              <h3 className={styles.tutorialTitle}>{t.titulo}</h3>

              <p className={styles.tutorialDescription}>
                {t.descripcion || 'Sin descripción disponible'}
              </p>
            </div>

            <div className={styles.tutorialFooter}>
              <div className={styles.tutorialDate}>
                {t.fecha_publicacion || 'Fecha no disponible'}
              </div>

              <div className={styles.tutorialLink} aria-hidden="true">
                Ver tutorial
                <span>→</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Modal de Video */}
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
            onClick={(e) => e.stopPropagation()} // Evitar que el click en el contenido cierre el modal
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
                ×
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
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: '#fff',
                    background: '#333'
                  }}>
                    Video no disponible
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.tutorialLink}
                onClick={closeVideoModal}
                style={{ background: 'transparent', border: '1px solid var(--accent-1)', color: 'var(--accent-1)' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorialesCapacitacion;