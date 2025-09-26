import React, { useEffect, useMemo, useState } from 'react';
import darkStyles from '../../styles/ToolsDark.module.css';
import lightStyles from '../../styles/ToolsLight.module.css';
import { obtenerHerramientaUsuario } from '../../api/HerramientaUsuario';
import { obtenerInfoUsuario } from '../../api/Usuario';
import { useTheme } from '../componentes/ThemeContext';

const HomeTools = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [planId, setPlanId] = useState(null);
  const [styles, setStyles] = useState(darkStyles);

  // UI filters
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('Todos');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' o 'list'

  const { theme } = useTheme(); // Obtiene el tema actual ('dark' o 'light')

  // Debounce search (300ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Obtener información del usuario y plan
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userInfo = await obtenerInfoUsuario();
        const pid = userInfo.empresa?.plan?.id;
        setPlanId(pid);
      } catch (err) {
        console.error('Error al obtener info del usuario:', err);
        // Si no se puede obtener el plan, usar modo oscuro por defecto
        setPlanId(null);
      }
    };
    
    fetchUserInfo();
  }, []);

  // Actualizar estilos cuando cambie planId o theme
  useEffect(() => {
    if (planId === 3 || planId === 6) {
      // Si el plan permite cambiar el tema
      setStyles(theme === 'dark' ? darkStyles : lightStyles);
    } else {
      // Si el plan no lo permite, forzar modo oscuro
      setStyles(darkStyles);
    }
  }, [theme, planId]);

  useEffect(() => {
    let mounted = true;

    const fetchProductos = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await obtenerHerramientaUsuario();
        if (mounted) setProductos(Array.isArray(data) ? data : []);
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

  // Unique area list for the filter
  const areas = useMemo(() => {
    const setN = new Set();
    productos.forEach(p => {
      const name = p?.area?.nombre ?? 'Sin área';
      setN.add(name);
    });
    return ['Todos', ...Array.from(setN).sort((a, b) => a.localeCompare(b))];
  }, [productos]);

  // Filtered products based on search and area
  const filtered = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    return productos.filter(p => {
      const name = (p.producto ?? '').toLowerCase();
      const areaName = p?.area?.nombre ?? 'Sin área';
      const matchesQuery = q === '' ? true : name.includes(q);
      const matchesArea = selectedArea === 'Todos' ? true : areaName === selectedArea;
      return matchesQuery && matchesArea;
    });
  }, [productos, debouncedQuery, selectedArea]);

  // Group by area for display
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(p => {
      const areaName = p?.area?.nombre ?? 'Sin área';
      if (!map[areaName]) map[areaName] = [];
      map[areaName].push(p);
    });
    return map;
  }, [filtered]);

  const getInitials = (name = '') =>
    name
      .split(' ')
      .map(part => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}>
            <div className={styles.spinner}></div>
          </div>
          <h3 className={styles.loadingTitle}>Cargando herramientas</h3>
          <p className={styles.loadingText}>Por favor espera un momento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2 className={styles.errorTitle}>Error al cargar</h2>
          <p className={styles.errorText}>{error}</p>
          <button className={styles.retryBtn} onClick={() => window.location.reload()}>
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  if (!productos.length) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.emptyContainer}>
          <div className={styles.emptyIcon}>🔧</div>
          <h2 className={styles.emptyTitle}>Sin herramientas</h2>
          <p className={styles.emptyText}>No tienes herramientas disponibles en este momento.</p>
          <small className={styles.emptyHelp}>Si crees que esto es un error, contacta con tu administrador.</small>
        </div>
      </div>
    );
  }

  const totalResults = filtered.length;

  return (
    <div className={styles.pageContainer}>
      {/* Header Section */}
      <header className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1 className={styles.mainTitle}>Mis Herramientas</h1>
            <p className={styles.mainSubtitle}>
              Gestiona y accede a todas tus herramientas de trabajo en un solo lugar
            </p>
          </div>
          
          <div className={styles.headerStats}>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{productos.length}</span>
              <span className={styles.statLabel}>Total</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{areas.length - 1}</span>
              <span className={styles.statLabel}>Áreas</span>
            </div>
          </div>
        </div>
      </header>

      {/* Controls Section */}
      <section className={styles.controlsSection}>
        <div className={styles.controlsContainer}>
          <div className={styles.searchContainer}>
            <div className={styles.searchInputWrapper}>
              <svg className={styles.searchIcon} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <input
                type="search"
                placeholder="Buscar por nombre de herramienta..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={styles.searchInput}
                aria-label="Buscar herramientas"
              />
              {query && (
                <button
                  className={styles.clearSearch}
                  onClick={() => setQuery('')}
                  aria-label="Limpiar búsqueda"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className={styles.filtersRow}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Filtrar por área</label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className={styles.filterSelect}
              >
                {areas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>

            <div className={styles.viewControls}>
              <span className={styles.viewLabel}>Vista:</span>
              <div className={styles.viewToggle}>
                <button
                  className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`}
                  onClick={() => setViewMode('grid')}
                  aria-label="Vista en cuadrícula"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`}
                  onClick={() => setViewMode('list')}
                  aria-label="Vista en lista"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            <div className={styles.resultsInfo}>
              <span className={styles.resultsCount}>
                {totalResults} resultado{totalResults !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <main className={styles.mainContent}>
        {totalResults > 0 ? (
          selectedArea === 'Todos' ? (
            Object.entries(grouped).map(([areaName, items]) => (
              <section key={areaName} className={styles.areaSection}>
                <div className={styles.areaSectionHeader}>
                  <div className={styles.areaInfo}>
                    <h2 className={styles.areaTitle}>{areaName}</h2>
                    <span className={styles.areaCount}>
                      {items.length} herramienta{items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className={styles.areaDivider}></div>
                </div>

                <div className={viewMode === 'grid' ? styles.toolsGrid : styles.toolsList}>
                  {items.map(prod => (
                    <ToolCard 
                      key={prod.id_producto} 
                      product={prod} 
                      viewMode={viewMode}
                      getInitials={getInitials}
                      styles={styles}
                    />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <section className={styles.areaSection}>
              <div className={styles.areaSectionHeader}>
                <div className={styles.areaInfo}>
                  <h2 className={styles.areaTitle}>{selectedArea}</h2>
                  <span className={styles.areaCount}>
                    {grouped[selectedArea]?.length || 0} herramienta{grouped[selectedArea]?.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className={styles.areaDivider}></div>
              </div>

              <div className={viewMode === 'grid' ? styles.toolsGrid : styles.toolsList}>
                {(grouped[selectedArea] || []).map(prod => (
                  <ToolCard 
                    key={prod.id_producto} 
                    product={prod} 
                    viewMode={viewMode}
                    getInitials={getInitials}
                    styles={styles}
                  />
                ))}
              </div>
            </section>
          )
        ) : (
          <div className={styles.noResultsContainer}>
            <div className={styles.noResultsIcon}>🔍</div>
            <h3 className={styles.noResultsTitle}>Sin resultados</h3>
            <p className={styles.noResultsText}>
              No se encontraron herramientas que coincidan con tu búsqueda.
            </p>
            <button 
              className={styles.clearFiltersBtn}
              onClick={() => {
                setQuery('');
                setSelectedArea('Todos');
              }}
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

// Componente separado para las tarjetas de herramientas
const ToolCard = ({ product, viewMode, getInitials, styles }) => {
  const cardClass = viewMode === 'grid' ? styles.toolCard : styles.toolCardList;
  
  return (
    <article className={cardClass}>
      <div className={styles.toolCardContent}>
        <div className={styles.toolHeader}>
          <div className={styles.toolAvatar}>
            {product.imagen ? (
              <img src={product.imagen} alt="" className={styles.toolImage} />
            ) : (
              <div className={styles.toolInitials}>
                {getInitials(product.producto)}
              </div>
            )}
          </div>
          
          <div className={styles.toolInfo}>
            <h3 className={styles.toolName}>{product.producto}</h3>
            <div className={styles.toolMeta}>
              <span className={styles.toolArea}>{product.area?.nombre || 'Sin área'}</span>
              {product.tipo_producto && (
                <span className={styles.toolType}>{product.tipo_producto}</span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.toolActions}>
          <a
            href={product.link_producto || '#'}
            target={product.link_producto ? '_blank' : '_self'}
            rel="noopener noreferrer"
            className={`${styles.toolButton} ${!product.link_producto ? styles.toolButtonDisabled : ''}`}
            onClick={e => {
              if (!product.link_producto) e.preventDefault();
            }}
            aria-label={product.link_producto ? `Abrir ${product.producto}` : `${product.producto} sin enlace disponible`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className={styles.toolButtonIcon}>
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span>{product.link_producto ? 'Abrir' : 'Sin enlace'}</span>
          </a>
        </div>
      </div>
    </article>
  );
};

export default HomeTools;