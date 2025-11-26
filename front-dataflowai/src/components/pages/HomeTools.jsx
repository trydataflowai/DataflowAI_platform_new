// src/components/pages/HomeTools.jsx
import React, { useEffect, useMemo, useState } from 'react';
import darkStyles from '../../styles/ToolsDark.module.css';
import lightStyles from '../../styles/ToolsLight.module.css';
import { obtenerHerramientaUsuario } from '../../api/HerramientaUsuario';
import { useTheme } from '../componentes/ThemeContext';

const classNames = [
  'pageContainer', 'loadingContainer', 'loadingSpinner', 'spinner', 'loadingTitle', 'loadingText',
  'errorContainer', 'errorIcon', 'errorTitle', 'errorText', 'retryBtn',
  'emptyContainer', 'emptyIcon', 'emptyTitle', 'emptyText', 'emptyHelp',
  'pageHeader', 'headerContent', 'titleSection', 'mainTitle', 'mainSubtitle',
  'headerStats', 'statCard', 'statNumber', 'statLabel',
  'controlsSection', 'controlsContainer', 'searchContainer', 'searchInputWrapper', 'searchIcon', 'searchInput', 'clearSearch',
  'filtersRow', 'filterGroup', 'filterLabel', 'filterSelect', 'viewControls', 'viewLabel', 'viewToggle', 'viewBtn', 'viewBtnActive', 'resultsInfo', 'resultsCount',
  'mainContent', 'areaSection', 'areaSectionHeader', 'areaInfo', 'areaTitle', 'areaCount', 'areaDivider',
  'toolsGrid', 'toolsList',
  'toolCard', 'toolCardList', 'toolCardContent', 'toolHeader', 'toolAvatar', 'toolImage', 'toolInitials', 'toolInfo', 'toolName', 'toolMeta', 'toolArea', 'toolType',
  'toolActions', 'toolButton', 'toolButtonDisabled', 'toolButtonIcon',
  'noResultsContainer', 'noResultsIcon', 'noResultsTitle', 'noResultsText', 'clearFiltersBtn'
];

// Build defaultStyles mapping using the imported dark/light modules as fallbacks.
// This ensures every variant key (NameDark / NameLight) exists.
const defaultStyles = classNames.reduce((acc, name) => {
  acc[`${name}Dark`] = (darkStyles && darkStyles[name]) ? darkStyles[name] : `${name}-dark-default`;
  acc[`${name}Light`] = (lightStyles && lightStyles[name]) ? lightStyles[name] : `${name}-light-default`;
  return acc;
}, {});

const HomeTools = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI filters
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('Todos');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' o 'list'

  const { theme } = useTheme(); // 'dark' or 'light'

  // helper to pick class variant according to theme, falling back to defaults when needed
  const cls = (name) => {
    const darkKey = `${name}Dark`;
    const lightKey = `${name}Light`;
    if (theme === 'dark') {
      return (darkStyles && darkStyles[`${name}` + 'Dark']) ? darkStyles[`${name}` + 'Dark']
        : (darkStyles && darkStyles[name]) ? darkStyles[name]
        : defaultStyles[darkKey] || '';
    } else {
      return (lightStyles && lightStyles[`${name}` + 'Light']) ? lightStyles[`${name}` + 'Light']
        : (lightStyles && lightStyles[name]) ? lightStyles[name]
        : defaultStyles[lightKey] || '';
    }
  };

  // Debounce search (300ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

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
      <div className={cls('pageContainer')}>
        <div className={cls('loadingContainer')}>
          <div className={cls('loadingSpinner')}>
            <div className={cls('spinner')}></div>
          </div>
          <h3 className={cls('loadingTitle')}>Cargando herramientas</h3>
          <p className={cls('loadingText')}>Por favor espera un momento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cls('pageContainer')}>
        <div className={cls('errorContainer')}>
          <div className={cls('errorIcon')}>⚠️</div>
          <h2 className={cls('errorTitle')}>Error al cargar</h2>
          <p className={cls('errorText')}>{error}</p>
          <button className={cls('retryBtn')} onClick={() => window.location.reload()}>
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  if (!productos.length) {
    return (
      <div className={cls('pageContainer')}>
        <div className={cls('emptyContainer')}>
          <div className={cls('emptyIcon')}>🔧</div>
          <h2 className={cls('emptyTitle')}>Sin herramientas</h2>
          <p className={cls('emptyText')}>No tienes herramientas disponibles en este momento.</p>
          <small className={cls('emptyHelp')}>Si crees que esto es un error, contacta con tu administrador.</small>
        </div>
      </div>
    );
  }

  const totalResults = filtered.length;

  return (
    <div className={cls('pageContainer')}>
      {/* Header Section */}
      <header className={cls('pageHeader')}>
        <div className={cls('headerContent')}>
          <div className={cls('titleSection')}>
            <h1 className={cls('mainTitle')}>Mis Herramientas</h1>
            <p className={cls('mainSubtitle')}>
              Gestiona y accede a todas tus herramientas de trabajo en un solo lugar
            </p>
          </div>

          <div className={cls('headerStats')}>
            <div className={cls('statCard')}>
              <span className={cls('statNumber')}>{productos.length}</span>
              <span className={cls('statLabel')}>Total</span>
            </div>
            <div className={cls('statCard')}>
              <span className={cls('statNumber')}>{areas.length - 1}</span>
              <span className={cls('statLabel')}>Áreas</span>
            </div>
          </div>
        </div>
      </header>

      {/* Controls Section */}
      <section className={cls('controlsSection')}>
        <div className={cls('controlsContainer')}>
          <div className={cls('searchContainer')}>
            <div className={cls('searchInputWrapper')}>
              <svg className={cls('searchIcon')} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <input
                type="search"
                placeholder="Buscar por nombre de herramienta..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={cls('searchInput')}
                aria-label="Buscar herramientas"
              />
              {query && (
                <button
                  className={cls('clearSearch')}
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

          <div className={cls('filtersRow')}>
            <div className={cls('filterGroup')}>
              <label className={cls('filterLabel')}>Filtrar por área</label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className={cls('filterSelect')}
              >
                {areas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>

            <div className={cls('viewControls')}>
              <span className={cls('viewLabel')}>Vista:</span>
              <div className={cls('viewToggle')}>
                <button
                  className={`${cls('viewBtn')} ${viewMode === 'grid' ? cls('viewBtnActive') : ''}`}
                  onClick={() => setViewMode('grid')}
                  aria-label="Vista en cuadrícula"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  className={`${cls('viewBtn')} ${viewMode === 'list' ? cls('viewBtnActive') : ''}`}
                  onClick={() => setViewMode('list')}
                  aria-label="Vista en lista"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            <div className={cls('resultsInfo')}>
              <span className={cls('resultsCount')}>
                {totalResults} resultado{totalResults !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <main className={cls('mainContent')}>
        {totalResults > 0 ? (
          selectedArea === 'Todos' ? (
            Object.entries(grouped).map(([areaName, items]) => (
              <section key={areaName} className={cls('areaSection')}>
                <div className={cls('areaSectionHeader')}>
                  <div className={cls('areaInfo')}>
                    <h2 className={cls('areaTitle')}>{areaName}</h2>
                    <span className={cls('areaCount')}>
                      {items.length} herramienta{items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className={cls('areaDivider')}></div>
                </div>

                <div className={viewMode === 'grid' ? cls('toolsGrid') : cls('toolsList')}>
                  {items.map(prod => (
                    <ToolCard
                      key={prod.id_producto}
                      product={prod}
                      viewMode={viewMode}
                      getInitials={getInitials}
                      cls={cls}
                    />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <section className={cls('areaSection')}>
              <div className={cls('areaSectionHeader')}>
                <div className={cls('areaInfo')}>
                  <h2 className={cls('areaTitle')}>{selectedArea}</h2>
                  <span className={cls('areaCount')}>
                    {grouped[selectedArea]?.length || 0} herramienta{grouped[selectedArea]?.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className={cls('areaDivider')}></div>
              </div>

              <div className={viewMode === 'grid' ? cls('toolsGrid') : cls('toolsList')}>
                {(grouped[selectedArea] || []).map(prod => (
                  <ToolCard
                    key={prod.id_producto}
                    product={prod}
                    viewMode={viewMode}
                    getInitials={getInitials}
                    cls={cls}
                  />
                ))}
              </div>
            </section>
          )
        ) : (
          <div className={cls('noResultsContainer')}>
            <div className={cls('noResultsIcon')}>🔍</div>
            <h3 className={cls('noResultsTitle')}>Sin resultados</h3>
            <p className={cls('noResultsText')}>
              No se encontraron herramientas que coincidan con tu búsqueda.
            </p>
            <button
              className={cls('clearFiltersBtn')}
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
const ToolCard = ({ product, viewMode, getInitials, cls }) => {
  const cardClass = viewMode === 'grid' ? cls('toolCard') : cls('toolCardList');

  return (
    <article className={cardClass}>
      <div className={cls('toolCardContent')}>
        <div className={cls('toolHeader')}>
          <div className={cls('toolAvatar')}>
            {product.imagen ? (
              <img src={product.imagen} alt="" className={cls('toolImage')} />
            ) : (
              <div className={cls('toolInitials')}>
                {getInitials(product.producto)}
              </div>
            )}
          </div>

          <div className={cls('toolInfo')}>
            <h3 className={cls('toolName')}>{product.producto}</h3>
            <div className={cls('toolMeta')}>
              <span className={cls('toolArea')}>{product.area?.nombre || 'Sin área'}</span>
              {product.tipo_producto && (
                <span className={cls('toolType')}>{product.tipo_producto}</span>
              )}
            </div>
          </div>
        </div>

        <div className={cls('toolActions')}>
          <a
            href={product.link_producto || '#'}
            target={product.link_producto ? '_blank' : '_self'}
            rel="noopener noreferrer"
            className={`${cls('toolButton')} ${!product.link_producto ? cls('toolButtonDisabled') : ''}`}
            onClick={e => {
              if (!product.link_producto) e.preventDefault();
            }}
            aria-label={product.link_producto ? `Abrir ${product.producto}` : `${product.producto} sin enlace disponible`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className={cls('toolButtonIcon')}>
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
