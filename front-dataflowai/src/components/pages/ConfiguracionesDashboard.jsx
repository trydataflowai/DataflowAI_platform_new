import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { importarArchivoDashboard } from '../../api/Importacion';
import styles from '../../styles/CreacionUsuario.module.css';

const ConfiguracionesDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState(''); // 'success' o 'error'
  const [idProducto, setIdProducto] = useState(null);

  // Obtener el id_producto de los parámetros de la URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('id_producto');
    if (id) {
      setIdProducto(parseInt(id));
    } else {
      // Si no hay id_producto, redirigir al home
      navigate('/home-dashboard');
    }
  }, [location, navigate]);

  const handleArchivoChange = (event) => {
    const archivo = event.target.files[0];
    if (archivo) {
      // Validar que sea un archivo Excel
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
      // Limpiar el input de archivo
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
        <h1>Configuraciones del Dashboard</h1>
        <button 
          onClick={handleVolver}
          className={styles.backButton}
          aria-label="Volver al inicio"
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path 
              fill="currentColor" 
              d="M20 11v2H8v2H6v-2H4v-2h2V9h2v2h12zM10 7V5l-4 4 4 4v-2h10V7H10z" 
            />
          </svg>
          Volver
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <h2>Importar Datos</h2>
          <p className={styles.description}>
            Selecciona un archivo Excel (.xlsx o .xls) para importar los datos al dashboard.
            El archivo debe contener las columnas que corresponden a los campos del modelo.
          </p>

          <div className={styles.uploadSection}>
            <div className={styles.fileInputContainer}>
              <label htmlFor="archivo-input" className={styles.fileLabel}>
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path 
                    fill="currentColor" 
                    d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" 
                  />
                </svg>
                {archivoSeleccionado ? archivoSeleccionado.name : 'Seleccionar archivo Excel'}
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
                <div className={styles.fileName}>
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path 
                      fill="currentColor" 
                      d="M9,12L7,10L5,12L7,14L9,12M13,14L15,12L17,14L15,16L13,14M14,8V6H10V8H14M14,18V16H10V18H14Z" 
                    />
                  </svg>
                  {archivoSeleccionado.name}
                </div>
                <div className={styles.fileSize}>
                  Tamaño: {(archivoSeleccionado.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            )}

            <button
              onClick={handleImportar}
              disabled={!archivoSeleccionado || cargando}
              className={`${styles.importButton} ${cargando ? styles.loading : ''}`}
            >
              {cargando ? (
                <>
                  <svg className={styles.spinner} viewBox="0 0 24 24" width="20" height="20">
                    <path 
                      fill="currentColor" 
                      d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" 
                    />
                  </svg>
                  Importando...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path 
                      fill="currentColor" 
                      d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z" 
                    />
                  </svg>
                  Importar Datos
                </>
              )}
            </button>
          </div>

          {mensaje && (
            <div className={`${styles.mensaje} ${styles[tipoMensaje]}`}>
              <div className={styles.mensajeContent}>
                <div className={styles.mensajeIcon}>
                  {tipoMensaje === 'success' ? (
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path 
                        fill="currentColor" 
                        d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.5,8L11,13.5L7.5,10L6,11.5L11,16.5Z" 
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path 
                        fill="currentColor" 
                        d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,7A1,1 0 0,0 11,8V12A1,1 0 0,0 12,13A1,1 0 0,0 13,12V8A1,1 0 0,0 12,7M12,17.5A1.5,1.5 0 0,0 13.5,16A1.5,1.5 0 0,0 12,14.5A1.5,1.5 0 0,0 10.5,16A1.5,1.5 0 0,0 12,17.5Z" 
                      />
                    </svg>
                  )}
                </div>
                <span>{mensaje}</span>
                <button 
                  onClick={limpiarMensaje}
                  className={styles.mensajeClose}
                  aria-label="Cerrar mensaje"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path 
                      fill="currentColor" 
                      d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" 
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h2>Información</h2>
          <div className={styles.infoCard}>
            <h3>Proceso de importación</h3>
            <ol>
              <li>El sistema validará que el archivo sea de formato Excel</li>
              <li>Se normalizarán los nombres de las columnas</li>
              <li>Solo se importarán las columnas que coincidan con el modelo</li>
              <li>Se creará un registro por cada fila del archivo</li>
              <li>Se mostrará un mensaje con el resultado de la importación</li>
            </ol>
          </div>

          <div className={styles.infoCard}>
            <h3>Consejos</h3>
            <ul>
              <li>Revisa que tu archivo no tenga filas vacías</li>
              <li>Asegúrate de que las fechas estén en formato correcto</li>
              <li>Los campos numéricos no deben contener texto</li>
              <li>Haz una copia de seguridad antes de importar</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionesDashboard;
