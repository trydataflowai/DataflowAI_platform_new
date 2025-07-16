// src/components/HomeDashboard.jsx

import React, { useEffect, useState, useRef } from 'react';
import { obtenerProductosUsuario } from '../../api/Login';
import { obtenerInfoUsuario } from '../../api/Usuario';
import { importarArchivoDashboard } from '../../api/Importacion';
import styles from '../../styles/HomeDashboard.module.css';

const images = import.meta.glob('../../assets/*.jpg', { eager: true });

export const HomeDashboard = () => {
  const [productos, setProductos] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [urlActual, setUrlActual] = useState('');
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedDashboards, setSelectedDashboards] = useState([]);
  const searchRef = useRef(null);

  // Always use current date/time for update display
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

  const handleArchivo = async (id_producto, event) => {
    const archivo = event.target.files[0];
    if (!archivo) return;
    try {
      await importarArchivoDashboard(id_producto, archivo);
      showNotification('Data successfully imported', 'success');
    } catch (error) {
      showNotification('Error importing data', 'error');
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
    : productos;

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.particles}></div>

      {usuario && (
        <div className={styles.header}>
          <h1>
            <span className={styles.greeting}>Welcome,</span>
            <span className={styles.username}>{usuario.nombres}</span>
          </h1>
          <div className={styles.company}>{usuario.empresa.nombre}</div>
          <div className={styles.headerLight}></div>
        </div>
      )}

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
          {searchTerm && (
            <button
              className={styles.clearSearch}
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              ×
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
              <i className="fas fa-times"></i> Clear filter
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

      <div className={styles.cardsWrapper}>
        <div className={styles.cardsContainer}>
          {productosAMostrar.map(prod => {
            const imgSrc = obtenerImagen(prod.id);
            return (
              <div key={prod.id} className={styles.card}>
                {imgSrc && (
                  <img
                    src={imgSrc}
                    alt={prod.nombre}
                    className={styles.cardImage}
                  />
                )}
                <div className={styles.cardIcon}>
                  <i className="fas fa-chart-network"></i>
                </div>
                <h3>{prod.nombre}</h3>
                <p className={styles.updateTime}>Last updated: {currentDate}</p>
                <div className={styles.cardActions}>
                  <button
                    onClick={() => {
                      setUrlActual(prod.url);
                      setModalAbierto(true);
                    }}
                    className={styles.primaryBtn}
                    aria-label={`Open dashboard ${prod.nombre}`}
                  >
                    <i className="fas fa-external-link-alt"></i> Open Dashboard
                  </button>
                  <label
                    className={styles.importBtn}
                    aria-label={`Import data for ${prod.nombre}`}
                  >
                    <i className="fas fa-file-import"></i> Import Data
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={e => handleArchivo(prod.id, e)}
                      hidden
                    />
                  </label>
                </div>
                <div className={styles.cardGlow}></div>
              </div>
            );
          })}
        </div>
      </div>

      {modalAbierto && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <iframe
              src={urlActual}
              className={styles.modalIframe}
              title="Dashboard"
              loading="eager"
              allowFullScreen
            />
            <button
              onClick={() => setModalAbierto(false)}
              className={styles.modalClose}
              aria-label="Close modal"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      {notification && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>\
          <div className={styles.notificationIcon}>\
            {notification.type === 'success' ? (
              <i className="fas fa-check-circle"></i>
            ) : (
              <i className="fas fa-exclamation-circle"></i>
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