import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { obtenerFormulariosEmpresa } from '../../api/ListadoFormulario';
import { useTheme } from '../componentes/ThemeContext';
import { useCompanyStyles } from '../componentes/ThemeContextEmpresa';
// fallback local para evitar parpadeo si company styles tarda
import defaultStyles from '../../styles/Formlist.module.css';

const FormsListado = () => {
  const { theme } = useTheme();
  const companyStyles = useCompanyStyles('FormList');
  const styles = companyStyles || defaultStyles;

  // marcar si las styles vienen indefinidas (loading) para mostrar skeleton y evitar flash
  const [stylesReady, setStylesReady] = useState(Boolean(companyStyles));
  useEffect(() => {
    if (companyStyles) setStylesReady(true);
  }, [companyStyles]);

  const [formularios, setFormularios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const cargarFormularios = async () => {
      try {
        setLoading(true);
        const data = await obtenerFormulariosEmpresa();
        if (!mounted) return;
        // asume que data es array; si la API devuelve objeto, ajusta según corresponda
        setFormularios(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || 'Error al cargar formularios');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    cargarFormularios();
    return () => { mounted = false; };
  }, []);

  const handleEditar = (slug) => {
    navigate(`/forms/edit/${slug}`);
  };

  // Si styles no se resolvieron (companyStyles === undefined) mostramos skeleton ligero
  if (!stylesReady && companyStyles === undefined) {
    return (
      <div className={`${defaultStyles.container} ${defaultStyles.dark}`} data-theme={theme} aria-hidden="true">
        <section className={defaultStyles.heroSection}>
          <div className={defaultStyles.heroContent}>
            <div className={defaultStyles.skeletonTitle} />
          </div>
        </section>
        <main className={defaultStyles.mainContent}>
          <div className={defaultStyles.cardGrid}>
            <div className={defaultStyles.card}>
              <div className={defaultStyles.skeletonItem} />
            </div>
            <div className={defaultStyles.card}>
              <div className={defaultStyles.skeletonItem} />
            </div>
            <div className={defaultStyles.card}>
              <div className={defaultStyles.skeletonItem} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  const variantClass = theme === 'dark' ? styles.dark : styles.light;

  return (
    <div className={`${styles.container} ${variantClass}`} data-theme={theme}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            <span className={styles.greeting}>Formularios de la Empresa</span>
            <span className={styles.username}>Gestión de Formularios</span>
          </h1>
          <p className={styles.company}>Lista de formularios disponibles para tu empresa</p>
        </div>
      </section>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Dashboard Section */}
        <section className={styles.dashboardSection}>
          <h2 className={styles.sectionTitle}>Todos los Formularios</h2>
          
          {loading && (
            <div className={styles.cardGrid}>
              {[1, 2, 3].map((item) => (
                <div key={item} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.skeletonTitle} style={{height: '24px', marginBottom: '10px'}} />
                    <div className={styles.skeletonText} style={{height: '16px', width: '80px'}} />
                  </div>
                  <div className={styles.cardImageContainer}>
                    <div className={styles.noImage}>
                      <div className={styles.skeletonImage} />
                    </div>
                  </div>
                  <div className={styles.cardContent}>
                    <div className={styles.skeletonText} style={{height: '16px', marginBottom: '8px'}} />
                    <div className={styles.skeletonText} style={{height: '16px', width: '60%'}} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className={styles.errorCard}>
              <div className={styles.errorIcon}>⚠️</div>
              <h3>Error al cargar formularios</h3>
              <p>{error}</p>
            </div>
          )}

          {!loading && formularios.length === 0 && !error && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📝</div>
              <h3>No hay formularios registrados</h3>
              <p>Comienza creando tu primer formulario</p>
            </div>
          )}

          {/* Card Grid */}
          <div className={styles.cardGrid}>
            {formularios.map((form) => (
              <article key={form.id_formulario || form.slug} className={styles.card}>
                <div className={styles.cardGlow}></div>
                
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{form.nombre}</h3>
                  {form.estado && (
                    <span className={styles.cardBadge}>
                      {form.estado}
                    </span>
                  )}
                </div>

                <div className={styles.cardImageContainer}>
                  {form.imagen_url ? (
                    <img 
                      src={form.imagen_url} 
                      alt={form.nombre}
                      className={styles.cardImage}
                    />
                  ) : (
                    <div className={styles.noImage}>
                      <svg className={styles.imagePlaceholder} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="2"/>
                        <path d="M21 15l-5-5L5 21" strokeWidth="2"/>
                      </svg>
                    </div>
                  )}
                  <div className={styles.imageOverlay}></div>
                </div>

                <div className={styles.cardContent}>
                  {form.descripcion && (
                    <p className={styles.cardDescription}>{form.descripcion}</p>
                  )}
                  
                  <div className={styles.cardStats}>
                    <div className={styles.statItem}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Creado: {form.fecha_creacion || '-'}</span>
                    </div>
                    
                    {form.respuestas_count !== undefined && (
                      <div className={styles.statItem}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M17 8l4 4m0 0l-4 4m4-4H3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>Respuestas: {form.respuestas_count}</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      onClick={() => handleEditar(form.slug)}
                      className={styles.previewButton}
                      title="Editar formulario"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Editar
                    </button>
                    
                    {form.slug && (
                      <Link 
                        to={`/forms/${form.slug}`} 
                        className={styles.configButton}
                        title="Ver respuestas"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="12" r="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Ver
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default FormsListado;