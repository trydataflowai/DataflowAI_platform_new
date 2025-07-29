import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerProductosUsuario } from '../../api/ProductoUsuario';
import { obtenerInfoUsuario } from '../../api/Usuario';
import styles from '../../styles/HomeDashboard.module.css';

const images = import.meta.glob('../../assets/*.jpg', { eager: true });

export const HomeDashboard = () => {
  const [productos, setProductos] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedDashboards, setSelectedDashboards] = useState([]);
  const [notification, setNotification] = useState(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const currentDate = new Date().toLocaleString();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productosData, usuarioData] = await Promise.all([
          obtenerProductosUsuario(),
          obtenerInfoUsuario()
        ]);
        setProductos(productosData);
        setFilteredProducts(productosData);
        setUsuario(usuarioData);
      } catch (err) {
        showNotification('Error loading data', 'error');
      }
    };
    fetchData();

    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(productos);
      return;
    }
    const filtered = productos.filter(producto =>
      producto.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, productos]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowSuggestions(true);
  };

  const toggleDashboardSelection = (dashboardName) => {
    setSelectedDashboards(prev =>
      prev.includes(dashboardName)
        ? prev.filter(name => name !== dashboardName)
        : [...prev, dashboardName]
    );
  };

  const clearAllFilters = () => {
    setSelectedDashboards([]);
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev =>
        prev < filteredProducts.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      toggleDashboardSelection(filteredProducts[highlightedIndex].nombre);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const obtenerImagen = (id) => {
    const key = `../../assets/${id}.jpg`;
    const mod = images[key];
    return mod ? mod.default : null;
  };

  const productosAMostrar = selectedDashboards.length > 0
    ? productos.filter(p => selectedDashboards.includes(p.nombre))
    : filteredProducts;

  return (
    <div className={styles.container}>
      <div className={styles.heroSection}>
        {usuario && (
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              <span className={styles.greeting}>Welcome,</span>
              <span className={styles.username}>{usuario.nombres}</span>
            </h1>
            <div className={styles.company}>{usuario.empresa.nombre}</div>
          </div>
        )}
      </div>

      <div className={styles.mainContent}>
        <div className={styles.searchContainer} ref={searchRef}>
          <div className={styles.searchInputContainer}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search dashboards..."
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
            />
            <svg className={styles.searchIcon} viewBox="0 0 24 24">
              <path fill="currentColor" d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 001.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 00-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 005.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            {searchTerm && (
              <button
                className={styles.clearSearch}
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <svg viewBox="0 0 24 24">
                  <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            )}
          </div>

          {(selectedDashboards.length > 0 || searchTerm) && (
            <div className={styles.filterControls}>
              {selectedDashboards.length > 0 && (
                <div className={styles.selectedCount}>
                  {selectedDashboards.length} dashboard(s) selected
                </div>
              )}
              <button
                className={styles.clearFilterButton}
                onClick={clearAllFilters}
                aria-label="Remove all filters"
              >
                <svg viewBox="0 0 24 24">
                  <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg> Clear filter
              </button>
            </div>
          )}

          {showSuggestions && (
            <div className={styles.suggestionsContainer}>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((producto, index) => (
                  <div
                    key={producto.id}
                    className={`${styles.suggestionItem} ${
                      highlightedIndex === index ? styles.highlighted : ''
                    }`}
                    onClick={() => toggleDashboardSelection(producto.nombre)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <input
                      type="checkbox"
                      className={styles.suggestionCheckbox}
                      checked={selectedDashboards.includes(producto.nombre)}
                      readOnly
                      aria-label={`Select ${producto.nombre}`}
                    />
                    {producto.nombre}
                  </div>
                ))
              ) : (
                <div className={styles.noResults}>No results found</div>
              )}
            </div>
          )}
        </div>

        <div className={styles.cardGrid}>
          {productosAMostrar.map(prod => {
            const imgSrc = obtenerImagen(prod.id);
            return (
              <div key={prod.id} className={styles.card}>
                <div className={styles.cardGlow}></div>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{prod.nombre}</h3>
                </div>
                <div className={styles.cardImageContainer}>
                  {imgSrc ? (
                    <>
                      <img
                        src={imgSrc}
                        alt={prod.nombre}
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
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.cardStats}>
                    <div className={styles.statItem}>
                      <svg viewBox="0 0 24 24">
                        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
                      </svg>
                      <span>Last updated: {currentDate}</span>
                    </div>
                  </div>
                  <div className={styles.cardActions}>
                    <button
                      onClick={() => navigate(`/${prod.slug}`)}
                      className={styles.previewButton}
                      aria-label={`Open dashboard ${prod.nombre}`}
                    >
                      <svg viewBox="0 0 24 24">
                        <path fill="currentColor" d="M12 9a3 3 0 013 3 3 3 0 01-3 3 3 3 0 01-3-3 3 3 0 013-3m0-4.5c5 0 9.27 3.11 11 7.5-1.73 4.39-6 7.5-11 7.5S2.73 16.39 1 12c1.73-4.39 6-7.5 11-7.5M3.18 12a9.821 9.821 0 0017.64 0 9.821 9.821 0 00-17.64 0z"/>
                      </svg>
                      Open Dashboard
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {notification && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>
          <div className={styles.notificationIcon}>
            {notification.type === 'success' ? (
              <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
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
