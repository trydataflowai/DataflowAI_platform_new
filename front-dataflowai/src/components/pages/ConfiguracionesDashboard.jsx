// src/components/pages/ConfiguracionesDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { importarArchivoDashboard } from '../../api/Importacion';
import { obtenerInfoUsuario } from '../../api/Usuario';
import { useTheme } from '../componentes/ThemeContext';
import { useCompanyStyles } from '../componentes/ThemeContextEmpresa';
import defaultConfiguracionesDashboard from '../../styles/ConfiguracionesDashboard.module.css';

const ConfiguracionesDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();

  // obtener estilos (empresa o default) desde CompanyStylesProvider
  const styles = useCompanyStyles('ConfiguracionesDashboard', defaultConfiguracionesDashboard);

  // helper defensivo para clases
  const C = (cls) => (styles && styles[cls]) || (defaultConfiguracionesDashboard && defaultConfiguracionesDashboard[cls]) || '';

  // States
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');
  const [idProducto, setIdProducto] = useState(null);
  const [planId, setPlanId] = useState(null);
  const [companyId, setCompanyId] = useState(null);

  // Get user and plan information
  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        const user = await obtenerInfoUsuario();
        const pid = user?.empresa?.plan?.id ?? null;
        const cid = user?.empresa?.id ?? null;
        setPlanId(pid);
        setCompanyId(cid);
      } catch (error) {
        console.error('Error getting user info:', error);
      }
    };
    fetchUsuario();
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('id_producto');
    if (id) {
      setIdProducto(parseInt(id, 10));
    } else {
      navigate('/home-dashboard');
    }
  }, [location, navigate]);

  const handleArchivoChange = (event) => {
    const archivo = event.target.files && event.target.files[0];
    if (archivo) {
      const extension = archivo.name.split('.').pop().toLowerCase();
      if (extension === 'xlsx' || extension === 'xls') {
        setArchivoSeleccionado(archivo);
        setMensaje('');
        setTipoMensaje('');
      } else {
        setMensaje('Selecciona un archivo Excel (.xlsx o .xls)');
        setTipoMensaje('error');
        setArchivoSeleccionado(null);
      }
    }
  };

  const handleImportar = async () => {
    if (!archivoSeleccionado || !idProducto) {
      setMensaje('Debes seleccionar un archivo y tener un producto válido');
      setTipoMensaje('error');
      return;
    }

    setCargando(true);
    setMensaje('');
    setTipoMensaje('');

    try {
      const respuesta = await importarArchivoDashboard(idProducto, archivoSeleccionado);
      setMensaje(respuesta?.mensaje || 'Archivo importado correctamente');
      setTipoMensaje('success');
      setArchivoSeleccionado(null);
      const fileInput = document.getElementById('archivo-input');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Import error:', error);
      setMensaje(error?.message || 'Error importando archivo');
      setTipoMensaje('error');
    } finally {
      setCargando(false);
    }
  };

  const handleVolver = () => {
    navigate('/home');
  };

  const limpiarMensaje = () => {
    setMensaje('');
    setTipoMensaje('');
  };

  // Determinar la clase del tema (fallback defensivo)
  const themeClass = theme === 'dark' ? (styles?.darkTheme || defaultConfiguracionesDashboard.darkTheme || '') : (styles?.lightTheme || defaultConfiguracionesDashboard.lightTheme || '');

  return (
    <div className={`${C('container')} ${themeClass}`}>
      <div className={C('header')}>
        <div className={C('headerContent')}>
          <div className={C('titleSection')}>
            <div className={C('iconWrapper')}>
              <svg viewBox="0 0 24 24" className={C('headerIcon')}>
                <path fill="currentColor" d="M3,5H9V11H3V5M5,7V9H7V7H5M11,7H21V9H11V7M11,15H21V17H11V15M5,20L1.5,16.5L2.91,15.09L5,17.17L9.59,12.59L11,14L5,20Z" />
              </svg>
            </div>
            <div>
              <h1 className={C('title')}>Dashboard Settings</h1>
              <p className={C('subtitle')}>Manage and import your data efficiently</p>
            </div>
          </div>
          <button onClick={handleVolver} className={C('backButton')} aria-label="Back to home">
            <svg viewBox="0 0 24 24" className={C('backIcon')}>
              <path fill="currentColor" d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
            </svg>
            <span>Back</span>
          </button>
        </div>
      </div>

      <div className={C('content')}>
        <div className={C('mainSection')}>
          <div className={C('uploadCard')}>
            <div className={C('cardHeader')}>
              <div className={C('cardTitle')}>
                <svg viewBox="0 0 24 24" className={C('cardIcon')}>
                  <path fill="currentColor" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
                <h2>Import Data</h2>
              </div>
              <p className={C('cardDescription')}>
                Select an Excel file to import data to the dashboard. The file must contain columns that correspond to the model fields.
              </p>
            </div>

            <div className={C('uploadSection')}>
              <div className={C('fileInputContainer')}>
                <label htmlFor="archivo-input" className={C('fileLabel')}>
                  <div className={C('fileLabelContent')}>
                    <div className={C('uploadIcon')}>
                      <svg viewBox="0 0 24 24">
                        <path fill="currentColor" d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z" />
                      </svg>
                    </div>
                    <div className={C('uploadText')}>
                      <span className={C('uploadTitle')}>
                        {archivoSeleccionado ? archivoSeleccionado.name : 'Drag your file here'}
                      </span>
                      <span className={C('uploadSubtitle')}>
                        or click to select an Excel file (.xlsx, .xls)
                      </span>
                    </div>
                  </div>
                </label>
                <input
                  id="archivo-input"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleArchivoChange}
                  className={C('fileInput')}
                />
              </div>

              {archivoSeleccionado && (
                <div className={C('fileInfo')}>
                  <div className={C('fileDetails')}>
                    <div className={C('fileIcon')}>
                      <svg viewBox="0 0 24 24">
                        <path fill="currentColor" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                      </svg>
                    </div>
                    <div className={C('fileMetadata')}>
                      <div className={C('fileName')}>{archivoSeleccionado.name}</div>
                      <div className={C('fileSize')}>
                        {(archivoSeleccionado.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                  <div className={C('fileActions')}>
                    <button
                      onClick={() => {
                        setArchivoSeleccionado(null);
                        const fileInput = document.getElementById('archivo-input');
                        if (fileInput) fileInput.value = '';
                      }}
                      className={C('removeFile')}
                      aria-label="Remove file"
                    >
                      <svg viewBox="0 0 24 24">
                        <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              <div className={C('actionButtons')}>
                <button
                  onClick={handleImportar}
                  disabled={!archivoSeleccionado || cargando}
                  className={`${C('importButton')} ${cargando ? C('loading') : ''}`}
                >
                  {cargando ? (
                    <>
                      <div className={C('spinner')}></div>
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" className={C('buttonIcon')}>
                        <path fill="currentColor" d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z" />
                      </svg>
                      <span>Import Data</span>
                    </>
                  )}
                </button>

                {idProducto && (
                  <a
                    href={`/plantillas-dashboards/${idProducto}.xlsx`}
                    download
                    className={C('templateButton')}
                  >
                    <svg viewBox="0 0 24 24" className={C('buttonIcon')}>
                      <path fill="currentColor" d="M5,20H19V18H5V20M9,4V14H15V4H19L12,0L5,4H9Z" />
                    </svg>
                    <span>Download Template</span>
                  </a>
                )}
              </div>

              {mensaje && (
                <div className={`${C('mensaje')} ${C(tipoMensaje)}`}>
                  <div className={C('mensajeContent')}>
                    <div className={C('mensajeIcon')}>
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
                    <span className={C('mensajeText')}>{mensaje}</span>
                    <button onClick={limpiarMensaje} className={C('mensajeClose')} aria-label="Close message">
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

        <div className={C('sideSection')}>
          <div className={C('infoCard')}>
            <div className={C('infoHeader')}>
              <svg viewBox="0 0 24 24" className={C('infoIcon')}>
                <path fill="currentColor" d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z" />
              </svg>
              <h3>Import Process</h3>
            </div>
            <div className={C('processSteps')}>
              <div className={C('step')}>
                <div className={C('stepNumber')}>1</div>
                <div className={C('stepContent')}>
                  <div className={C('stepTitle')}>Validation</div>
                  <div className={C('stepDescription')}>The system will validate that the file is in Excel format</div>
                </div>
              </div>
              <div className={C('step')}>
                <div className={C('stepNumber')}>2</div>
                <div className={C('stepContent')}>
                  <div className={C('stepTitle')}>Normalization</div>
                  <div className={C('stepDescription')}>Column names will be normalized</div>
                </div>
              </div>
              <div className={C('step')}>
                <div className={C('stepNumber')}>3</div>
                <div className={C('stepContent')}>
                  <div className={C('stepTitle')}>Matching</div>
                  <div className={C('stepDescription')}>Only columns that match the model will be imported</div>
                </div>
              </div>
              <div className={C('step')}>
                <div className={C('stepNumber')}>4</div>
                <div className={C('stepContent')}>
                  <div className={C('stepTitle')}>Creation</div>
                  <div className={C('stepDescription')}>A record will be created for each row in the file</div>
                </div>
              </div>
            </div>
          </div>

          <div className={C('tipsCard')}>
            <div className={C('tipsHeader')}>
              <svg viewBox="0 0 24 24" className={C('tipsIcon')}>
                <path fill="currentColor" d="M12,2A7,7 0 0,1 19,9C19,11.38 17.81,13.47 16,14.74V17A1,1 0 0,1 15,18H9A1,1 0 0,1 8,17V14.74C6.19,13.47 5,11.38 5,9A7,7 0 0,1 12,2M9,21V20H15V21A1,1 0 0,1 14,22H10A1,1 0 0,1 9,21M12,4A5,5 0 0,0 7,9C7,11.05 8.23,12.81 10,13.58V16H14V13.58C15.77,12.81 17,11.05 17,9A5,5 0 0,0 12,4Z" />
              </svg>
              <h3>Useful Tips</h3>
            </div>
            <div className={C('tipsList')}>
              <div className={C('tip')}>
                <div className={C('tipIcon')}>
                  <svg viewBox="0 0 24 24">
                    <path fill="currentColor" d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                  </svg>
                </div>
                <span>Check that your file doesn't have empty rows</span>
              </div>
              <div className={C('tip')}>
                <div className={C('tipIcon')}>
                  <svg viewBox="0 0 24 24">
                    <path fill="currentColor" d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                  </svg>
                </div>
                <span>Make sure dates are in the correct format</span>
              </div>
              <div className={C('tip')}>
                <div className={C('tipIcon')}>
                  <svg viewBox="0 0 24 24">
                    <path fill="currentColor" d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                  </svg>
                </div>
                <span>Numeric fields shouldn't contain text</span>
              </div>
              <div className={C('tip')}>
                <div className={C('tipIcon')}>
                  <svg viewBox="0 0 24 24">
                    <path fill="currentColor" d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                  </svg>
                </div>
                <span>Make a backup before importing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionesDashboard;
