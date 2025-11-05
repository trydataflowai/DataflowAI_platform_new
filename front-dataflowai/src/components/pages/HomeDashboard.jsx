// src/components/pages/HomeDashboard.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerProductosUsuario } from '../../api/ProductoUsuario';
import { obtenerInfoUsuario } from '../../api/Usuario';

// Importa estilos por defecto
import defaultDarkStyles from '../../styles/HomeDashboard.module.css';
import defaultLightStyles from '../../styles/HomeDashboardLight.module.css';

// IMPORTAR EL HOOK DE TEMA
import { useTheme } from '../componentes/ThemeContext';

const images = import.meta.glob('../../assets/*.jpg', { eager: true });

/*
  Lógica de estilos por empresa:
  - Buscamos módulos:
      src/styles/empresas/{companyId}/HomeDashboard.module.css      (dark)
      src/styles/empresas/{companyId}/HomeDashboardLight.module.css (light)
  - Si el plan es 3 o 6 y los archivos por empresa existen, los usamos según el theme.
  - Si no, fallback a los estilos por defecto importados arriba.
  - Usamos import.meta.glob(..., { eager: true }) para incluirlos en el bundle con Vite.
*/
const empresaLightModules = import.meta.glob(
  '../../styles/empresas/*/HomeDashboardLight.module.css',
  { eager: true }
);
const empresaDarkModules = import.meta.glob(
  '../../styles/empresas/*/HomeDashboard.module.css',
  { eager: true }
);

export const HomeDashboard = () => {
  // USAR EL HOOK DE TEMA
  const { theme } = useTheme();

  const [styles, setStyles] = useState(defaultDarkStyles);
  const [productos, setProductos] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [planId, setPlanId] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedDashboards, setSelectedDashboards] = useState([]);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [showAreaFilter, setShowAreaFilter] = useState(false);
  const [notification, setNotification] = useState(null);

  // NUEVOS ESTADOS PARA EL IFRAME EMBEBIDO
  const [iframeUrl, setIframeUrl] = useState(null);
  const [iframeName, setIframeName] = useState('');

  const searchRef = useRef(null);
  const areaFilterRef = useRef(null);
  const navigate = useNavigate();
  const currentDate = new Date().toLocaleString();

  useEffect(() => {
    async function fetchData() {
      try {
        const [prodData, userData] = await Promise.all([
          obtenerProductosUsuario(),
          obtenerInfoUsuario()
        ]);
        setProductos(prodData);
        setFilteredProducts(prodData);
        setUsuario(userData);

        const pid = userData?.empresa?.plan?.id ?? null;
        const cid = userData?.empresa?.id ?? null;

        setPlanId(pid);
        setCompanyId(cid);
      } catch (err) {
        showNotification('Error loading data', 'error');
        console.error(err);
      }
    }
    fetchData();

    const handleClickOutside = e => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
      if (areaFilterRef.current && !areaFilterRef.current.contains(e.target)) {
        setShowAreaFilter(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    /*
      Selección de estilos:
      - Solo intentamos usar estilos por empresa si el plan es 3 o 6.
      - Buscamos módulos incluidos por import.meta.glob.
      - Si encontramos el módulo correspondiente a la empresa, lo usamos.
      - Si no, fallback al default (light/dark).
    */
    const useCompanyStyles = (planId === 3 || planId === 6) && companyId;

    const lightKey = `../../styles/empresas/${companyId}/HomeDashboardLight.module.css`;
    const darkKey = `../../styles/empresas/${companyId}/HomeDashboard.module.css`;

    const foundCompanyLight = empresaLightModules[lightKey];
    const foundCompanyDark = empresaDarkModules[darkKey];

    const extract = (mod) => {
      if (!mod) return null;
      return mod.default ?? mod;
    };

    const companyLight = extract(foundCompanyLight);
    const companyDark = extract(foundCompanyDark);

    let chosenStyles = defaultDarkStyles;
    if (theme === 'dark') {
      if (useCompanyStyles && companyDark) {
        chosenStyles = companyDark;
      } else {
        chosenStyles = defaultDarkStyles;
      }
    } else {
      // light
      if (useCompanyStyles && companyLight) {
        chosenStyles = companyLight;
      } else {
        chosenStyles = defaultLightStyles;
      }
    }

    setStyles(chosenStyles);
  }, [theme, planId, companyId]);

  useEffect(() => {
    let filtered = productos;

    if (searchTerm.trim()) {
      filtered = filtered.filter(p => {
        const name = (p.nombre || p.producto || p.name || '').toString();
        return name.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    if (selectedAreas.length > 0) {
      filtered = filtered.filter(p => {
        const areaName = p.area?.nombre || '';
        return selectedAreas.includes(areaName);
      });
    }

    setFilteredProducts(filtered);
  }, [searchTerm, productos, selectedAreas]);

  const handleSearchChange = e => {
    setSearchTerm(e.target.value);
    setShowSuggestions(true);
    setHighlightedIndex(-1);
  };

  const toggleDashboardSelection = name => {
    setSelectedDashboards(prev =>
      prev.includes(name)
        ? prev.filter(n => n !== name)
        : [...prev, name]
    );
  };

  const toggleAreaSelection = areaName => {
    setSelectedAreas(prev =>
      prev.includes(areaName)
        ? prev.filter(n => n !== areaName)
        : [...prev, areaName]
    );
  };

  const clearAllFilters = () => {
    setSelectedDashboards([]);
    setSelectedAreas([]);
    setSearchTerm('');
    setShowSuggestions(false);
    setShowAreaFilter(false);
  };

  const handleKeyDown = e => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(i =>
        i < filteredProducts.length - 1 ? i + 1 : i
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(i => (i > 0 ? i - 1 : -1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      const selected = filteredProducts[highlightedIndex];
      const selectedName = (selected?.nombre || selected?.producto || selected?.name || '');
      toggleDashboardSelection(selectedName);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setShowAreaFilter(false);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const obtenerImagen = id => {
    const keyId = id || id === 0 ? id : null;
    const key = keyId ? `../../assets/${keyId}.jpg` : null;
    const mod = key ? images[key] : null;
    return mod ? mod.default : null;
  };

  const handleConfiguraciones = (productoId) => {
    navigate(`/configuraciones-dashboard?id_producto=${productoId}`);
  };

  // FUNCIÓN PARA CERRAR EL IFRAME Y VOLVER A LA LISTA
  const closeIframe = () => {
    setIframeUrl(null);
    setIframeName('');
  };

  const handleOpenDashboard = (prod) => {
    const slug = prod.slug;
    const linkPb = prod.link_pb || prod.linkPb || prod.link;
    const linkExterno = prod.link_dashboard_externo || prod.linkDashboardExterno || prod.external_link;
    const categoria = (prod.categoria_producto || prod.categoria || '').toString().toLowerCase();
    const prodName = prod.nombre || prod.producto || prod.name || 'Dashboard';

    if (categoria.includes('externo')) {
      if (linkExterno) {
        setIframeUrl(linkExterno);
        setIframeName(prodName);
      } else {
        if (linkPb) {
          setIframeUrl(linkPb);
          setIframeName(prodName);
        } else {
          showNotification('No existe link_dashboard_externo para este dashboard', 'error');
        }
      }
      return;
    }

    if (categoria.includes('power')) {
      if (linkPb) {
        window.open(linkPb, '_blank', 'noopener,noreferrer');
      } else {
        showNotification('No existe link_pb para este dashboard', 'error');
      }
      return;
    }

    if (categoria.includes('javascript') && slug) {
      navigate(`/${slug}`);
      return;
    }

    if (slug) {
      navigate(`/${slug}`);
      return;
    }

    if (linkExterno) {
      window.open(linkExterno, '_blank', 'noopener,noreferrer');
      return;
    }

    if (linkPb) {
      window.open(linkPb, '_blank', 'noopener,noreferrer');
      return;
    }

    showNotification('No hay ruta disponible para abrir este dashboard', 'error');
  };

  const getUniqueAreas = () => {
    const areas = productos.map(p => p.area?.nombre).filter(Boolean);
    return [...new Set(areas)];
  };

  const groupProductsByArea = (products) => {
    return products.reduce((groups, product) => {
      const areaName = product.area?.nombre || 'Sin área';
      if (!groups[areaName]) {
        groups[areaName] = [];
      }
      groups[areaName].push(product);
      return groups;
    }, {});
  };

  const productosAMostrar =
    selectedDashboards.length > 0
      ? productos.filter(p => {
          const name = (p.nombre || p.producto || p.name || '');
          return selectedDashboards.includes(name);
        })
      : filteredProducts;

  const productosAgrupados = groupProductsByArea(productosAMostrar);
  const uniqueAreas = getUniqueAreas();

  return (
    <div className={styles.container}>
      {/* SI HAY IFRAME ACTIVO, MOSTRAR SOLO EL IFRAME */}
      {iframeUrl ? (
        <div className={styles.iframeView}>
          <div className={styles.iframeHeader}>
            <button
              onClick={closeIframe}
              className={styles.backButton}
              aria-label="Back to dashboards"
            >
              <svg viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
                />
              </svg>
              Back to Dashboards
            </button>
            <h3 className={styles.iframeTitle}>{iframeName}</h3>
            <div className={styles.headerSpacer}></div>
          </div>
          <div className={styles.iframeContainer}>
            <iframe
              src={iframeUrl}
              className={styles.iframe}
              title={iframeName}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      ) : (
        <>
          {/* Hero section */}
          <div className={styles.heroSection}>
            {usuario && (
              <div className={styles.heroContent}>
                <h1 className={styles.heroTitle}>
                  <span className={styles.greeting}>Welcome,</span>{' '}
                  <span className={styles.username}>{usuario.nombres}</span>
                </h1>
                <div className={styles.company}>
                  {usuario?.empresa?.nombre_corto || usuario?.empresa?.nombre || ''}
                </div>
              </div>
            )}
          </div>

          {/* Main content */}
          <div className={styles.mainContent}>
            {/* Search & filters */}
            <div className={styles.searchAndFiltersContainer}>
              <div
                className={styles.searchContainer}
                ref={searchRef}
                onKeyDown={handleKeyDown}
              >
                <div className={styles.searchInputContainer}>
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search dashboards..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={() => setShowSuggestions(true)}
                  />
                  <svg className={styles.searchIcon} viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 001.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 00-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 005.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
                    />
                  </svg>
                  {searchTerm && (
                    <button
                      className={styles.clearSearch}
                      onClick={() => setSearchTerm('')}
                      aria-label="Clear search"
                    >
                      <svg viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {showSuggestions && (
                  <div className={styles.suggestionsContainer}>
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((prod, idx) => {
                        const displayName = (prod.nombre || prod.producto || prod.name || '');
                        return (
                          <div
                            key={prod.id || prod.id_producto || idx}
                            className={`${styles.suggestionItem} ${
                              highlightedIndex === idx ? styles.highlighted : ''
                            }`}
                            onClick={() =>
                              toggleDashboardSelection(displayName)
                            }
                            onMouseEnter={() => setHighlightedIndex(idx)}
                          >
                            <input
                              type="checkbox"
                              className={styles.suggestionCheckbox}
                              checked={selectedDashboards.includes(displayName)}
                              readOnly
                            />
                            {displayName}
                          </div>
                        );
                      })
                    ) : (
                      <div className={styles.noResults}>No results found</div>
                    )}
                  </div>
                )}
              </div>

              {/* FILTRO POR ÁREA */}
              <div className={styles.areaFilterContainer} ref={areaFilterRef}>
                <button
                  className={styles.areaFilterButton}
                  onClick={() => setShowAreaFilter(!showAreaFilter)}
                  aria-label="Filter by area"
                >
                  <svg viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M3,17V19H9V17H3M3,5V7H13V5H3M13,21V19H21V17H13V15H11V21H13M7,9V11H3V13H7V15H9V9H7M21,13V11H11V13H21M15,9H13V15H15V13H21V11H15V9Z"
                    />
                  </svg>
                  Filter by Area
                  {selectedAreas.length > 0 && (
                    <span className={styles.filterBadge}>{selectedAreas.length}</span>
                  )}
                  <svg 
                    className={`${styles.chevronIcon} ${showAreaFilter ? styles.rotated : ''}`} 
                    viewBox="0 0 24 24"
                  >
                    <path fill="currentColor" d="M7 10l5 5 5-5z"/>
                  </svg>
                </button>

                {showAreaFilter && (
                  <div className={styles.areaFilterDropdown}>
                    <div className={styles.filterHeader}>
                      <span>Select Areas</span>
                      {selectedAreas.length > 0 && (
                        <button
                          className={styles.clearAreasButton}
                          onClick={() => setSelectedAreas([])}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className={styles.areaOptions}>
                      {uniqueAreas.map(area => (
                        <div
                          key={area}
                          className={styles.areaOption}
                          onClick={() => toggleAreaSelection(area)}
                        >
                          <input
                            type="checkbox"
                            className={styles.areaCheckbox}
                            checked={selectedAreas.includes(area)}
                            readOnly
                          />
                          <span>{area}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {(selectedDashboards.length > 0 || searchTerm || selectedAreas.length > 0) && (
              <div className={styles.filterControls}>
                <div className={styles.activeFilters}>
                  {selectedDashboards.length > 0 && (
                    <span className={styles.filterInfo}>
                      {selectedDashboards.length} dashboard(s) selected
                    </span>
                  )}
                  {selectedAreas.length > 0 && (
                    <span className={styles.filterInfo}>
                      Areas: {selectedAreas.join(', ')}
                    </span>
                  )}
                </div>
                <button
                  className={styles.clearFilterButton}
                  onClick={clearAllFilters}
                  aria-label="Remove all filters"
                >
                  <svg viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                    />
                  </svg>{' '}
                  Clear all filters
                </button>
              </div>
            )}

            {/* Cards agrupadas por área */}
            <div className={styles.dashboardSections}>
              {Object.entries(productosAgrupados).map(([areaName, areaProducts]) => (
                <div key={areaName} className={styles.dashboardSection}>
                  <h2 className={styles.sectionTitle}>
                    DASHBOARDS {areaName.toUpperCase()}:
                  </h2>
                  <div className={styles.cardGrid}>
                    {areaProducts.map(prod => {
                      const prodId = prod.id || prod.id_producto || prod.idProducto;
                      const prodName = prod.nombre || prod.producto || prod.name || 'Unnamed';
                      const prodSlug = prod.slug;
                      const prodCategoria = (prod.categoria_producto || prod.categoria || '').toString().toLowerCase();

                      const imgSrc = obtenerImagen(prodId);

                      return (
                        <div key={prodId || prodSlug || prodName} className={styles.card}>
                          <div className={styles.cardGlow} />
                          <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>{prodName}</h3>
                          </div>
                          <div className={styles.cardImageContainer}>
                            {imgSrc ? (
                              <>
                                <img
                                  src={imgSrc}
                                  alt={prodName}
                                  className={styles.cardImage}
                                />
                                <div className={styles.imageOverlay} />
                              </>
                            ) : (
                              <div className={styles.noImage}>
                                <svg
                                  className={styles.imagePlaceholder}
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    fill="currentColor"
                                    d="M8.5 13.5l2.5 3 3.5-4.5 4.5 6H5m16 1V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7h-2v7z"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className={styles.cardContent}>
                            <div className={styles.cardStats}>
                              <div className={styles.statItem}>
                                <svg viewBox="0 0 24 24">
                                  <path
                                    fill="currentColor"
                                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.10 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.10 1.70 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"
                                  />
                                </svg>
                                <span>Last updated: {currentDate}</span>
                              </div>
                            </div>
                            <div className={styles.cardActions}>
                              <button
                                onClick={() => handleOpenDashboard(prod)}
                                className={styles.previewButton}
                                aria-label={`Open dashboard ${prodName}`}
                              >
                                <svg viewBox="0 0 24 24">
                                  <path
                                    fill="currentColor"
                                    d="M12 9a3 3 0 013 3 3 3 0 01-3 3 3 3 0 01-3-3 3 3 0 013-3m0-4.5c5 0 9.27 3.11 11 7.5-1.73 4.39-6 7.5-11 7.5S2.73 16.39 1 12c1.73-4.39 6-7.5 11-7.5M3.18 12a9.821 9.821 0 0017.64 0 9.821 9.821 0 00-17.64 0z"
                                  />
                                </svg>
                                Open Dashboard
                              </button>

                              {!prodCategoria.includes('power') && (
                                <button
                                  onClick={() => handleConfiguraciones(prodId)}
                                  className={styles.configButton}
                                  aria-label={`Configuration for ${prodName}`}
                                >
                                  <svg viewBox="0 0 24 24">
                                    <path
                                      fill="currentColor"
                                      d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"
                                    />
                                  </svg>
                                  Settings
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
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
    </div>
  );
};

export default HomeDashboard;
