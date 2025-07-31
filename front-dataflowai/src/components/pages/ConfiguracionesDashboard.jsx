import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { importarArchivoDashboard } from '../../api/Importacion';
import { obtenerInfoUsuario } from '../../api/Usuario';
import { useTheme } from '../componentes/ThemeContext';
import darkStyles from '../../styles/ConfiguracionesDashboard.module.css';
import lightStyles from '../../styles/ConfiguracionesDashboardLight.module.css';

const ConfiguracionesDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  // Estados
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');
  const [idProducto, setIdProducto] = useState(null);
  const [planId, setPlanId] = useState(null);
  const [styles, setStyles] = useState(darkStyles);

  // Obtener información del usuario y plan
  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        const user = await obtenerInfoUsuario();
        const pid = user.empresa.plan.id;
        setPlanId(pid);
      } catch (error) {
        console.error('Error al obtener info del usuario:', error);
      }
    };
    fetchUsuario();
  }, []);

  // Actualizar estilos según el plan y el tema
  useEffect(() => {
    if (planId === 3 || planId === 6) {
      // Planes que permiten cambiar el tema
      setStyles(theme === 'dark' ? darkStyles : lightStyles);
    } else {
      // Otros planes: siempre modo oscuro
      setStyles(darkStyles);
    }
  }, [theme, planId]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('id_producto');
    if (id) {
      setIdProducto(parseInt(id));
    } else {
      navigate('/home-dashboard');
    }
  }, [location, navigate]);

  const handleArchivoChange = (event) => {
    const archivo = event.target.files[0];
    if (archivo) {
      const extension = archivo.name.split('.').pop().toLowerCase();
      if (extension === 'xlsx' || extension === 'xls') {
        setArchivoSeleccionado(archivo);
        setMensaje('');
      } else {
        setMensaje('Por favor selecciona un archivo Excel (.xlsx o .xls)');
        setTipoMensaje('error');
        setArchivoSeleccionado(null);
      }
    }
  };

  const handleImportar = async () => {
    if (!archivoSeleccionado || !idProducto) {
      setMensaje('Debe seleccionar un archivo y tener un producto válido');
      setTipoMensaje('error');
      return;
    }

    setCargando(true);
    setMensaje('');

    try {
      const respuesta = await importarArchivoDashboard(idProducto, archivoSeleccionado);
      setMensaje(respuesta.mensaje || 'Archivo importado correctamente');
      setTipoMensaje('success');
      setArchivoSeleccionado(null);
      const fileInput = document.getElementById('archivo-input');
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      setMensaje(error.message || 'Error al importar el archivo');
      setTipoMensaje('error');
    } finally {
      setCargando(false);
    }
  };

  const handleVolver = () => {
    navigate('/home-dashboard');
  };

  const limpiarMensaje = () => {
    setMensaje('');
    setTipoMensaje('');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <div className={styles.iconWrapper}>
              <svg viewBox="0 0 24 24" className={styles.headerIcon}>
                <path fill="currentColor" d="M3,5H9V11H3V5M5,7V9H7V7H5M11,7H21V9H11V7M11,15H21V17H11V15M5,20L1.5,16.5L2.91,15.09L5,17.17L9.59,12.59L11,14L5,20Z" />
              </svg>
            </div>
            <div>
              <h1 className={styles.title}>Configuraciones del Dashboard</h1>
              <p className={styles.subtitle}>Gestiona e importa tus datos de manera eficiente</p>
            </div>
          </div>
          <button onClick={handleVolver} className={styles.backButton} aria-label="Volver al inicio">
            <svg viewBox="0 0 24 24" className={styles.backIcon}>
              <path fill="currentColor" d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
            </svg>
            <span>Volver</span>
          </button>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.mainSection}>
          <div className={styles.uploadCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <svg viewBox="0 0 24 24" className={styles.cardIcon}>
                  <path fill="currentColor" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
                <h2>Importar Datos</h2>
              </div>
              <p className={styles.cardDescription}>
                Selecciona un archivo Excel para importar datos al dashboard. El archivo debe contener columnas que correspondan a los campos del modelo.
              </p>
            </div>

            <div className={styles.uploadSection}>
              <div className={styles.fileInputContainer}>
                <label htmlFor="archivo-input" className={styles.fileLabel}>
                  <div className={styles.fileLabelContent}>
                    <div className={styles.uploadIcon}>
                      <svg viewBox="0 0 24 24">
                        <path fill="currentColor" d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z" />
                      </svg>
                    </div>
                    <div className={styles.uploadText}>
                      <span className={styles.uploadTitle}>
                        {archivoSeleccionado ? archivoSeleccionado.name : 'Arrastra tu archivo aquí'}
                      </span>
                      <span className={styles.uploadSubtitle}>
                        o haz clic para seleccionar un archivo Excel (.xlsx, .xls)
                      </span>
                    </div>
                  </div>
                </label>
                <input
                  id="archivo-input"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleArchivoChange}
                  className={styles.fileInput}
                />
              </div>

              {archivoSeleccionado && (
                <div className={styles.fileInfo}>
                  <div className={styles.fileDetails}>
                    <div className={styles.fileIcon}>
                      <svg viewBox="0 0 24 24">
                        <path fill="currentColor" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                      </svg>
                    </div>
                    <div className={styles.fileMetadata}>
                      <div className={styles.fileName}>{archivoSeleccionado.name}</div>
                      <div className={styles.fileSize}>
                        {(archivoSeleccionado.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                  <div className={styles.fileActions}>
                    <button
                      onClick={() => {
                        setArchivoSeleccionado(null);
                        document.getElementById('archivo-input').value = '';
                      }}
                      className={styles.removeFile}
                      aria-label="Remover archivo"
                    >
                      <svg viewBox="0 0 24 24">
                        <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              <div className={styles.actionButtons}>
                <button
                  onClick={handleImportar}
                  disabled={!archivoSeleccionado || cargando}
                  className={`${styles.importButton} ${cargando ? styles.loading : ''}`}
                >
                  {cargando ? (
                    <>
                      <div className={styles.spinner}></div>
                      <span>Importando...</span>
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" className={styles.buttonIcon}>
                        <path fill="currentColor" d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z" />
                      </svg>
                      <span>Importar Datos</span>
                    </>
                  )}
                </button>

                {idProducto && (
                  <a
                    href={`/plantillas-dashboards/${idProducto}.xlsx`}
                    download
                    className={styles.templateButton}
                  >
                    <svg viewBox="0 0 24 24" className={styles.buttonIcon}>
                      <path fill="currentColor" d="M5,20H19V18H5V20M9,4V14H15V4H19L12,0L5,4H9Z" />
                    </svg>
                    <span>Descargar Plantilla</span>
                  </a>
                )}
              </div>

              {mensaje && (
                <div className={`${styles.mensaje} ${styles[tipoMensaje]}`}>
                  <div className={styles.mensajeContent}>
                    <div className={styles.mensajeIcon}>
                      {tipoMensaje === 'success' ? (
                        <svg viewBox="0 0 24 24">
                          <path fill="currentColor" d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.5,8L11,13.5L7.5,10L6,11.5L11,16.5Z" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24">
                          <path fill="currentColor" d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,7A1,1 0 0,0 11,8V12A1,1 0 0,0 12,13A1,1 0 0,0 13,12V8A1,1 0 0,0 12,7M12,17.5A1.5,1.5 0 0,0 13.5,16A1.5,1.5 0 0,0 12,14.5A1.5,1.5 0 0,0 10.5,16A1.5,1.5 0 0,0 12,17.5Z" />
                        </svg>
                      )}
                    </div>
                    <span className={styles.mensajeText}>{mensaje}</span>
                    <button onClick={limpiarMensaje} className={styles.mensajeClose} aria-label="Cerrar mensaje">
                      <svg viewBox="0 0 24 24">
                        <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.sideSection}>
          <div className={styles.infoCard}>
            <div className={styles.infoHeader}>
              <svg viewBox="0 0 24 24" className={styles.infoIcon}>
                <path fill="currentColor" d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z" />
              </svg>
              <h3>Proceso de Importación</h3>
            </div>
            <div className={styles.processSteps}>
              <div className={styles.step}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepContent}>
                  <div className={styles.stepTitle}>Validación</div>
                  <div className={styles.stepDescription}>El sistema validará que el archivo sea de formato Excel</div>
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepContent}>
                  <div className={styles.stepTitle}>Normalización</div>
                  <div className={styles.stepDescription}>Se normalizarán los nombres de las columnas</div>
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepContent}>
                  <div className={styles.stepTitle}>Coincidencias</div>
                  <div className={styles.stepDescription}>Solo se importarán las columnas que coincidan con el modelo</div>
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>4</div>
                <div className={styles.stepContent}>
                  <div className={styles.stepTitle}>Creación</div>
                  <div className={styles.stepDescription}>Se creará un registro por cada fila del archivo</div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.tipsCard}>
            <div className={styles.tipsHeader}>
              <svg viewBox="0 0 24 24" className={styles.tipsIcon}>
                <path fill="currentColor" d="M12,2A7,7 0 0,1 19,9C19,11.38 17.81,13.47 16,14.74V17A1,1 0 0,1 15,18H9A1,1 0 0,1 8,17V14.74C6.19,13.47 5,11.38 5,9A7,7 0 0,1 12,2M9,21V20H15V21A1,1 0 0,1 14,22H10A1,1 0 0,1 9,21M12,4A5,5 0 0,0 7,9C7,11.05 8.23,12.81 10,13.58V16H14V13.58C15.77,12.81 17,11.05 17,9A5,5 0 0,0 12,4Z" />
              </svg>
              <h3>Consejos Útiles</h3>
            </div>
            <div className={styles.tipsList}>
              <div className={styles.tip}>
                <div className={styles.tipIcon}>
                  <svg viewBox="0 0 24 24">
                    <path fill="currentColor" d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                  </svg>
                </div>
                <span>Revisa que tu archivo no tenga filas vacías</span>
              </div>
              <div className={styles.tip}>
                <div className={styles.tipIcon}>
                  <svg viewBox="0 0 24 24">
                    <path fill="currentColor" d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                  </svg>
                </div>
                <span>Asegúrate de que las fechas estén en formato correcto</span>
              </div>
              <div className={styles.tip}>
                <div className={styles.tipIcon}>
                  <svg viewBox="0 0 24 24">
                    <path fill="currentColor" d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                  </svg>
                </div>
                <span>Los campos numéricos no deben contener texto</span>
              </div>
              <div className={styles.tip}>
                <div className={styles.tipIcon}>
                  <svg viewBox="0 0 24 24">
                    <path fill="currentColor" d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                  </svg>
                </div>
                <span>Haz una copia de seguridad antes de importar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionesDashboard;