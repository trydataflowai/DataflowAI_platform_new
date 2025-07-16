// src/components/HomeDashboard.jsx

import React, { useEffect, useState, useRef } from 'react';
import { obtenerProductosUsuario } from '../../api/Login';
import { obtenerInfoUsuario } from '../../api/Usuario';
import { importarArchivoDashboard } from '../../api/Importacion';
import styles from '../../styles/HomeDashboard.module.css';

// 1) Cargamos todas las JPG de assets al build con Vite
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
        showNotification('Error al cargar datos', 'error');
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
      showNotification('Datos importados con éxito', 'success');
    } catch (error) {
      showNotification('Error al importar datos', 'error');
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // 2) Resolver URL de imagen si existe
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
            <span className={styles.greeting}>Bienvenido,</span>
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
            placeholder="Buscar dashboards..."
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
          />
          {searchTerm && (
            <button
              className={styles.clearSearch}
              onClick={() => setSearchTerm('')}
              aria-label="Limpiar búsqueda"
            >
              ×
            </button>
          )}
        </div>

        {(selectedDashboards.length > 0 || searchTerm) && (
          <div className={styles.filterControls}>
            {selectedDashboards.length > 0 && (
              <div className={styles.selectedCount}>
                {selectedDashboards.length} dashboard(s) seleccionado(s)
              </div>
            )}
            <button
              className={styles.clearFilterButton}
              onClick={clearAllFilters}
              aria-label="Quitar todos los filtros"
            >
              <i className="fas fa-times"></i> Quitar filtro
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
                    aria-label={`Seleccionar ${producto.nombre}`}
                  />
                  {producto.nombre}
                </div>
              ))
            ) : (
              <div className={styles.noResults}>No se encontraron resultados</div>
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
                <div className={styles.cardActions}>
                  <button
                    onClick={() => {
                      setUrlActual(prod.url);
                      setModalAbierto(true);
                    }}
                    className={styles.primaryBtn}
                    aria-label={`Abrir dashboard ${prod.nombre}`}
                  >
                    <i className="fas fa-external-link-alt"></i> Abrir Dashboard
                  </button>
                  <label
                    className={styles.importBtn}
                    aria-label={`Importar datos para ${prod.nombre}`}
                  >
                    <i className="fas fa-file-import"></i> Importar Datos
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
              aria-label="Cerrar modal"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      {notification && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>
          <div className={styles.notificationIcon}>
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
