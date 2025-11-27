// src/components/.../ModificarInformacionPersonal.jsx
import React, { useEffect, useState } from 'react';
import { useTheme } from '../../componentes/ThemeContext';
import {
  obtenerMiPerfil,
  actualizarMiUsuario,
  actualizarEmpresa
} from '../../../api/Profile';
import { obtenerInfoUsuario } from '../../../api/Usuario';

// Importar estilos por defecto (fallback)
import defaultStyles from '../../../styles/Profile/ModInfoPersonal.module.css';

// Función para cargar los estilos dinámicamente (no bloqueante)
const cargarEstilosEmpresa = async (empresaId, planId) => {
  const planesEspeciales = [3, 6]; // Planes que usan estilos personalizados

  try {
    // Verificar si el plan es especial y si existe la carpeta de la empresa
    if (planesEspeciales.includes(planId) && empresaId) {
      try {
        // Intentar importar los estilos de la carpeta de la empresa
        const estilosEmpresa = await import(`../../../styles/empresas/${empresaId}/ModInfoPersonal.module.css`);
        return estilosEmpresa.default || defaultStyles;
      } catch (error) {
        console.warn(`No se encontraron estilos personalizados para empresa ${empresaId}, usando estilos por defecto`);
      }
    }

    // Fallback a estilos por defecto
    return defaultStyles;
  } catch (error) {
    console.error('Error cargando estilos:', error);
    // Fallback a estilos por defecto
    return defaultStyles;
  }
};

const ModificarInformacionPersonal = () => {
  const { theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [styles, setStyles] = useState(defaultStyles); // iniciar con defaultStyles para evitar undefined

  // Usuario
  const [usuario, setUsuario] = useState(null);
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [correo, setCorreo] = useState('');
  const [permisoId, setPermisoId] = useState(null);

  // Empresa
  const [empresa, setEmpresa] = useState(null);
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [pais, setPais] = useState('');
  const [prefijoPais, setPrefijoPais] = useState('');
  const [correoEmpresa, setCorreoEmpresa] = useState('');
  const [paginaWeb, setPaginaWeb] = useState('');

  // Backups para cancelar edición
  const [backupUser, setBackupUser] = useState(null);
  const [backupCompany, setBackupCompany] = useState(null);

  // Cargar datos del perfil y estilos de forma no bloqueante
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setLoading(true);
      setError('');

      try {
        // Cargar info de usuario (contiene empresa y plan)
        const usuarioInfo = await obtenerInfoUsuario();
        const empresaId = usuarioInfo?.empresa?.id;
        const planId = usuarioInfo?.empresa?.plan?.id;

        // Lanzar carga de estilos en paralelo (no bloqueante)
        cargarEstilosEmpresa(empresaId, planId).then((estilosCargados) => {
          if (!mounted) return;
          if (estilosCargados) setStyles(estilosCargados);
        }).catch(() => {
          if (mounted) setStyles(defaultStyles);
        });

        // Cargar perfil completo (puede ser otra llamada)
        const res = await obtenerMiPerfil();
        const u = res.usuario || {};
        const e = res.empresa || {};
        if (!mounted) return;

        setUsuario(u);
        setNombres(u.nombres || '');
        setApellidos(u.apellidos || '');
        setCorreo(u.correo || '');
        setPermisoId(u.id_permiso_acceso || null);

        setEmpresa(e);
        setNombreEmpresa(e.nombre_empresa || '');
        setDireccion(e.direccion || '');
        setTelefono(e.telefono || '');
        setCiudad(e.ciudad || '');
        setPais(e.pais || '');
        setPrefijoPais(e.prefijo_pais || '');
        setCorreoEmpresa(e.correo || '');
        setPaginaWeb(e.pagina_web || '');
      } catch (err) {
        if (!mounted) return;
        console.error('Error inicializando perfil y estilos:', err);
        setError(err?.message || 'Error al cargar datos');
        // styles ya tiene defaultStyles
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  const isAdmin = permisoId === 1;

  const enterEdit = () => {
    setBackupUser({ nombres, apellidos, correo });
    setBackupCompany({
      nombreEmpresa,
      direccion,
      telefono,
      ciudad,
      pais,
      prefijoPais,
      correoEmpresa,
      paginaWeb
    });
    setError('');
    setSuccess('');
    setEditing(true);
  };

  const cancelEdit = () => {
    if (backupUser) {
      setNombres(backupUser.nombres);
      setApellidos(backupUser.apellidos);
      setCorreo(backupUser.correo);
    }
    if (backupCompany) {
      setNombreEmpresa(backupCompany.nombreEmpresa);
      setDireccion(backupCompany.direccion);
      setTelefono(backupCompany.telefono);
      setCiudad(backupCompany.ciudad);
      setPais(backupCompany.pais);
      setPrefijoPais(backupCompany.prefijoPais);
      setCorreoEmpresa(backupCompany.correoEmpresa);
      setPaginaWeb(backupCompany.paginaWeb);
    }
    setError('');
    setSuccess('');
    setEditing(false);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!nombres || !correo) {
      setError('Nombre y correo son obligatorios');
      return;
    }
    setSavingUser(true);
    try {
      const payload = { nombres, apellidos, correo };
      const res = await actualizarMiUsuario(payload);
      setUsuario(res.usuario);
      setSuccess('Información personal actualizada correctamente');
      setBackupUser({ nombres, apellidos, correo });
      setEditing(false);
    } catch (err) {
      setError(err.message || 'Error al actualizar información personal');
    } finally {
      setSavingUser(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!isAdmin) {
      setError('No autorizado para editar la información de la empresa');
      return;
    }
    setSavingCompany(true);
    try {
      const payload = {
        nombre_empresa: nombreEmpresa,
        direccion,
        telefono,
        ciudad,
        pais,
        prefijo_pais: prefijoPais,
        correo: correoEmpresa,
        pagina_web: paginaWeb
      };
      const res = await actualizarEmpresa(payload);
      setEmpresa(res.empresa);
      setSuccess('Información de la empresa actualizada correctamente');
      setBackupCompany({
        nombreEmpresa,
        direccion,
        telefono,
        ciudad,
        pais,
        prefijoPais,
        correoEmpresa,
        paginaWeb
      });
      setEditing(false);
    } catch (err) {
      setError(err.message || 'Error al actualizar información de la empresa');
    } finally {
      setSavingCompany(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  // --- FIX: elegir la variante siempre en base al theme
  // uso fallback defensivo a defaultStyles por si styles dinámico no contiene la clase
  const variantClass = theme === 'dark'
    ? (styles?.ModinfopersonalDark || defaultStyles.ModinfopersonalDark || '')
    : (styles?.ModinfopersonalLight || defaultStyles.ModinfopersonalLight || '');

  return (
    <main className={`${styles.Modinfopersonalcontainer} ${variantClass}`} aria-labelledby="modificar-info-title">
      
      {/* Header Section */}
      <section className={styles.Modinfopersonalheader}>
        <div className={styles.ModinfopersonalheaderContent}>
          <h1 id="modificar-info-title" className={styles.Modinfopersonaltitle}>
            Información Personal
          </h1>
          <p className={styles.Modinfopersonalsubtitle}>
            Actualiza tu información personal y de la empresa
          </p>
        </div>
        <div className={styles.ModinfopersonalheaderMeta}>
          <span className={styles.ModinfopersonalroleInfo}>
            {isAdmin ? 'Administrador' : 'Usuario'}
          </span>
          {!editing ? (
            <button 
              className={styles.ModinfopersonaleditButton}
              onClick={enterEdit}
            >
              Editar Información
            </button>
          ) : (
            <button 
              className={styles.ModinfopersonalcancelButton}
              onClick={cancelEdit}
            >
              Cancelar
            </button>
          )}
        </div>
      </section>

      {/* Alert Messages */}
      {error && (
        <div className={styles.ModinfopersonalerrorBox} role="alert">
          <div className={styles.ModinfopersonalerrorIcon}>⚠️</div>
          <div className={styles.ModinfopersonalerrorText}>{error}</div>
        </div>
      )}
      
      {success && (
        <div className={styles.ModinfopersonalsuccessBox} role="status">
          <div className={styles.ModinfopersonalsuccessIcon}>✅</div>
          <div className={styles.ModinfopersonalsuccessText}>{success}</div>
        </div>
      )}

      {/* Content Grid */}
      <div className={styles.Modinfopersonalcontent}>
        
        {/* Personal Information Card */}
        <section className={styles.Modinfopersonalcard}>
          <div className={styles.ModinfopersonalcardHeader}>
            <h2 className={styles.ModinfopersonalsectionTitle}>Información Personal</h2>
            <div className={styles.ModinfopersonaleditIndicator}>
              {editing ? 'Modo Edición' : 'Solo Lectura'}
            </div>
          </div>

          <form onSubmit={handleSaveUser} className={styles.Modinfopersonalform}>
            <div className={styles.ModinfopersonalformGrid}>
              <div className={styles.ModinfopersonalformGroup}>
                <label className={styles.Modinfopersonallabel}>
                  <span className={styles.ModinfopersonallabelText}>Nombre</span>
                  <input
                    className={styles.Modinfopersonalinput}
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    placeholder="Tu nombre"
                    readOnly={!editing}
                    aria-describedby="nombre-help"
                  />
                </label>
                <div id="nombre-help" className={styles.ModinfopersonalhelpText}>
                  Tu nombre de pila
                </div>
              </div>

              <div className={styles.ModinfopersonalformGroup}>
                <label className={styles.Modinfopersonallabel}>
                  <span className={styles.ModinfopersonallabelText}>Apellidos</span>
                  <input
                    className={styles.Modinfopersonalinput}
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    placeholder="Tus apellidos"
                    readOnly={!editing}
                    aria-describedby="apellidos-help"
                  />
                </label>
                <div id="apellidos-help" className={styles.ModinfopersonalhelpText}>
                  Tus apellidos completos
                </div>
              </div>

              <div className={styles.ModinfopersonalformGroup}>
                <label className={styles.Modinfopersonallabel}>
                  <span className={styles.ModinfopersonallabelText}>Correo Electrónico</span>
                  <input
                    className={styles.Modinfopersonalinput}
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="usuario@empresa.com"
                    readOnly={!editing}
                    aria-describedby="correo-help"
                  />
                </label>
                <div id="correo-help" className={styles.ModinfopersonalhelpText}>
                  Tu dirección de correo principal
                </div>
              </div>
            </div>

            <div className={styles.ModinfopersonalformActions}>
              <button
                className={styles.ModinfopersonalprimaryButton}
                type="submit"
                disabled={!editing || savingUser}
              >
                {savingUser ? (
                  <>
                    <span className={styles.Modinfopersonalspinner}></span>
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios Personales'
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Company Information Card */}
        <section className={styles.Modinfopersonalcard}>
          <div className={styles.ModinfopersonalcardHeader}>
            <h2 className={styles.ModinfopersonalsectionTitle}>
              Información de la Empresa
              {empresa && <span className={styles.ModinfopersonalcompanyName}> - {empresa.nombre_empresa}</span>}
            </h2>
            <div className={styles.ModinfopersonaleditIndicator}>
              {isAdmin ? (editing ? 'Modo Edición' : 'Solo Lectura') : 'Solo Lectura'}
            </div>
          </div>

          {!isAdmin && (
            <div className={styles.ModinfopersonalinfoBox}>
              <div className={styles.ModinfopersonalinfoIcon}>🔒</div>
              <div className={styles.ModinfopersonalinfoText}>
                Solo los administradores pueden editar la información de la empresa
              </div>
            </div>
          )}

          <form onSubmit={handleSaveCompany} className={styles.Modinfopersonalform}>
            <div className={styles.ModinfopersonalformGrid}>
              <div className={styles.ModinfopersonalformGroup}>
                <label className={styles.Modinfopersonallabel}>
                  <span className={styles.ModinfopersonallabelText}>Nombre de la Empresa</span>
                  <input
                    className={styles.Modinfopersonalinput}
                    value={nombreEmpresa}
                    onChange={(e) => setNombreEmpresa(e.target.value)}
                    disabled={!isAdmin || !editing}
                    readOnly={!editing}
                    placeholder="Nombre de la empresa"
                  />
                </label>
              </div>

              <div className={styles.ModinfopersonalformGroup}>
                <label className={styles.Modinfopersonallabel}>
                  <span className={styles.ModinfopersonallabelText}>Dirección</span>
                  <input
                    className={styles.Modinfopersonalinput}
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    disabled={!isAdmin || !editing}
                    readOnly={!editing}
                    placeholder="Dirección completa"
                  />
                </label>
              </div>

              <div className={styles.ModinfopersonalformGroup}>
                <label className={styles.Modinfopersonallabel}>
                  <span className={styles.ModinfopersonallabelText}>Teléfono</span>
                  <div className={styles.ModinfopersonalinputGroup}>
                    <input
                      className={styles.ModinfopersonalinputPrefix}
                      value={prefijoPais}
                      onChange={(e) => setPrefijoPais(e.target.value)}
                      disabled={!isAdmin || !editing}
                      readOnly={!editing}
                      placeholder="+57"
                      maxLength="4"
                    />
                    <input
                      className={styles.Modinfopersonalinput}
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      disabled={!isAdmin || !editing}
                      readOnly={!editing}
                      placeholder="Número de teléfono"
                    />
                  </div>
                </label>
              </div>

              <div className={styles.ModinfopersonalformGroup}>
                <label className={styles.Modinfopersonallabel}>
                  <span className={styles.ModinfopersonallabelText}>Ciudad</span>
                  <input
                    className={styles.Modinfopersonalinput}
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    disabled={!isAdmin || !editing}
                    readOnly={!editing}
                    placeholder="Ciudad"
                  />
                </label>
              </div>

              <div className={styles.ModinfopersonalformGroup}>
                <label className={styles.Modinfopersonallabel}>
                  <span className={styles.ModinfopersonallabelText}>País</span>
                  <input
                    className={styles.Modinfopersonalinput}
                    value={pais}
                    onChange={(e) => setPais(e.target.value)}
                    disabled={!isAdmin || !editing}
                    readOnly={!editing}
                    placeholder="País"
                  />
                </label>
              </div>

              <div className={styles.ModinfopersonalformGroup}>
                <label className={styles.Modinfopersonallabel}>
                  <span className={styles.ModinfopersonallabelText}>Correo de la Empresa</span>
                  <input
                    className={styles.Modinfopersonalinput}
                    type="email"
                    value={correoEmpresa}
                    onChange={(e) => setCorreoEmpresa(e.target.value)}
                    disabled={!isAdmin || !editing}
                    readOnly={!editing}
                    placeholder="contacto@empresa.com"
                  />
                </label>
              </div>

              <div className={styles.ModinfopersonalformGroup}>
                <label className={styles.Modinfopersonallabel}>
                  <span className={styles.ModinfopersonallabelText}>Página Web</span>
                  <input
                    className={styles.Modinfopersonalinput}
                    value={paginaWeb}
                    onChange={(e) => setPaginaWeb(e.target.value)}
                    disabled={!isAdmin || !editing}
                    readOnly={!editing}
                    placeholder="https://www.empresa.com"
                  />
                </label>
              </div>
            </div>

            <div className={styles.ModinfopersonalformActions}>
              <button
                className={styles.ModinfopersonalprimaryButton}
                type="submit"
                disabled={!editing || !isAdmin || savingCompany}
              >
                {savingCompany ? (
                  <>
                    <span className={styles.Modinfopersonalspinner}></span>
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios de Empresa'
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
};

export default ModificarInformacionPersonal;
