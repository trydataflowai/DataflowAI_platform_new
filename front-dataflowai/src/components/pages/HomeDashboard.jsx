import React, { useEffect, useState } from 'react';
import { obtenerProductosUsuario } from '../../api/Login';
import { obtenerInfoUsuario } from '../../api/Usuario';
import { importarArchivoDashboard } from '../../api/Importacion';
import styles from '../../styles/HomeDashboard.module.css';

export const HomeDashboard = () => {
  const [productos, setProductos] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [urlActual, setUrlActual] = useState('');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productosData, usuarioData] = await Promise.all([
          obtenerProductosUsuario(),
          obtenerInfoUsuario()
        ]);
        setProductos(productosData);
        setUsuario(usuarioData);
      } catch (err) {
        showNotification('Error al cargar datos', 'error');
      }
    };
    fetchData();
  }, []);

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

  return (
    <div className={styles.dashboardContainer}>
      {/* Efecto de partículas */}
      <div className={styles.particles}></div>
      
      {/* Header con efecto de luz */}
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

      {/* Contenedor de tarjetas */}
      <div className={styles.cardsWrapper}>
        <div className={styles.cardsContainer}>
          {productos.map((prod) => (
            <div key={prod.id} className={styles.card}>
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
                >
                  <i className="fas fa-external-link-alt"></i> Abrir Dashboard
                </button>
                
                <label className={styles.importBtn}>
                  <i className="fas fa-file-import"></i> Importar Datos
                  <input 
                    type="file" 
                    accept=".xlsx,.xls" 
                    onChange={(e) => handleArchivo(prod.id, e)} 
                  />
                </label>
              </div>
              
              <div className={styles.cardGlow}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal optimizado */}
      {modalAbierto && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <iframe 
              src={urlActual} 
              className={styles.modalIframe}
              title="Dashboard"
              loading="eager"
            />
            <button 
              onClick={() => setModalAbierto(false)} 
              className={styles.modalClose}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      {/* Notificación flotante */}
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