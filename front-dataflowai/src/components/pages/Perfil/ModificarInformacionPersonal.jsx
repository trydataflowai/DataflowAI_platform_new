// src/components/.../ModificarInformacionPersonal.jsx
import React, { useEffect, useState } from 'react';
import { useTheme } from '../../componentes/ThemeContext';
import { useCompanyStyles } from '../../componentes/ThemeContextEmpresa';
import {
  obtenerMiPerfil,
  actualizarMiUsuario,
  actualizarEmpresa
} from '../../../api/Profile';
import { obtenerInfoUsuario } from '../../../api/Usuario';

// Importar estilos por defecto (fallback)
import defaultStyles from '../../../styles/Profile/ModInfoPersonal.module.css';

const ModificarInformacionPersonal = () => {
  const { theme } = useTheme();

  // Obtener estilos (empresa o default) desde el provider — evita parpadeo
  const styles = useCompanyStyles('ModInfoPersonal', defaultStyles);

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  // Cargar datos del perfil y (estilos ya provistos por el provider)
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setLoading(true);
      setError('');

      try {
        // Cargar perfil completo
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
        console.error('Error inicializando perfil:', err);
        setError(err?.message || 'Error al cargar datos');
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
      console.error('Error actualizando usuario:', err);
      setError(err?.message || 'Error al actualizar información personal');
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
      console.error('Error actualizando empresa:', err);
      setError(err?.message || 'Error al actualizar información de la empresa');
    } finally {
      setSavingCompany(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  // Variante basada únicamente en ThemeContext (evita fallback oscuro)
  const variantClass = theme === 'dark'
    ? (styles?.ModinfopersonalDark || defaultStyles.ModinfopersonalDark || '')
    : (styles?.ModinfopersonalLight || defaultStyles.ModinfopersonalLight || '');

  // Defensive class getters (use styles if present, otherwise defaultStyles)
  const C = (cls) => styles?.[cls] || defaultStyles?.[cls] || '';

  return (
    <main className={`${C('Modinfopersonalcontainer')} ${variantClass}`} aria-labelledby="modificar-info-title">
      
      {/* Header Section */}
      <section className={C('Modinfopersonalheader')}>
        <div className={C('ModinfopersonalheaderContent')}>
          <h1 id="modificar-info-title" className={C('Modinfopersonaltitle')}>
            Información Personal
          </h1>
          <p className={C('Modinfopersonalsubtitle')}>
            Actualiza tu información personal y de la empresa
          </p>
        </div>
        <div className={C('ModinfopersonalheaderMeta')}>
          <span className={C('ModinfopersonalroleInfo')}>
            {isAdmin ? 'Administrador' : 'Usuario'}
          </span>
          {!editing ? (
            <button 
              className={C('ModinfopersonaleditButton')}
              onClick={enterEdit}
            >
              Editar Información
            </button>
          ) : (
            <button 
              className={C('ModinfopersonalcancelButton')}
              onClick={cancelEdit}
            >
              Cancelar
            </button>
          )}
        </div>
      </section>

      {/* Alert Messages */}
      {error && (
        <div className={C('ModinfopersonalerrorBox')} role="alert">
          <div className={C('ModinfopersonalerrorIcon')}>⚠️</div>
          <div className={C('ModinfopersonalerrorText')}>{error}</div>
        </div>
      )}
      
      {success && (
        <div className={C('ModinfopersonalsuccessBox')} role="status">
          <div className={C('ModinfopersonalsuccessIcon')}>✅</div>
          <div className={C('ModinfopersonalsuccessText')}>{success}</div>
        </div>
      )}

      {/* Content Grid */}
      <div className={C('Modinfopersonalcontent')}>
        
        {/* Personal Information Card */}
        <section className={C('Modinfopersonalcard')}>
          <div className={C('ModinfopersonalcardHeader')}>
            <h2 className={C('ModinfopersonalsectionTitle')}>Información Personal</h2>
            <div className={C('ModinfopersonaleditIndicator')}>
              {editing ? 'Modo Edición' : 'Solo Lectura'}
            </div>
          </div>

          <form onSubmit={handleSaveUser} className={C('Modinfopersonalform')}>
            <div className={C('ModinfopersonalformGrid')}>
              <div className={C('ModinfopersonalformGroup')}>
                <label className={C('Modinfopersonallabel')}>
                  <span className={C('ModinfopersonallabelText')}>Nombre</span>
                  <input
                    className={C('Modinfopersonalinput')}
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    placeholder="Tu nombre"
                    readOnly={!editing}
                    aria-describedby="nombre-help"
                  />
                </label>
                <div id="nombre-help" className={C('ModinfopersonalhelpText')}>
                  Tu nombre de pila
                </div>
              </div>

              <div className={C('ModinfopersonalformGroup')}>
                <label className={C('Modinfopersonallabel')}>
                  <span className={C('ModinfopersonallabelText')}>Apellidos</span>
                  <input
                    className={C('Modinfopersonalinput')}
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    placeholder="Tus apellidos"
                    readOnly={!editing}
                    aria-describedby="apellidos-help"
                  />
                </label>
                <div id="apellidos-help" className={C('ModinfopersonalhelpText')}>
                  Tus apellidos completos
                </div>
              </div>

              <div className={C('ModinfopersonalformGroup')}>
                <label className={C('Modinfopersonallabel')}>
                  <span className={C('ModinfopersonallabelText')}>Correo Electrónico</span>
                  <input
                    className={C('Modinfopersonalinput')}
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="usuario@empresa.com"
                    readOnly={!editing}
                    aria-describedby="correo-help"
                  />
                </label>
                <div id="correo-help" className={C('ModinfopersonalhelpText')}>
                  Tu dirección de correo principal
                </div>
              </div>
            </div>

            <div className={C('ModinfopersonalformActions')}>
              <button
                className={C('ModinfopersonalprimaryButton')}
                type="submit"
                disabled={!editing || savingUser}
              >
                {savingUser ? (
                  <>
                    <span className={C('Modinfopersonalspinner')}></span>
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
        <section className={C('Modinfopersonalcard')}>
          <div className={C('ModinfopersonalcardHeader')}>
            <h2 className={C('ModinfopersonalsectionTitle')}>
              Información de la Empresa
              {empresa && <span className={C('ModinfopersonalcompanyName')}> - {empresa.nombre_empresa}</span>}
            </h2>
            <div className={C('ModinfopersonaleditIndicator')}>
              {isAdmin ? (editing ? 'Modo Edición' : 'Solo Lectura') : 'Solo Lectura'}
            </div>
          </div>

          {!isAdmin && (
            <div className={C('ModinfopersonalinfoBox')}>
              <div className={C('ModinfopersonalinfoIcon')}>🔒</div>
              <div className={C('ModinfopersonalinfoText')}>
                Solo los administradores pueden editar la información de la empresa
              </div>
            </div>
          )}

          <form onSubmit={handleSaveCompany} className={C('Modinfopersonalform')}>
            <div className={C('ModinfopersonalformGrid')}>
              <div className={C('ModinfopersonalformGroup')}>
                <label className={C('Modinfopersonallabel')}>
                  <span className={C('ModinfopersonallabelText')}>Nombre de la Empresa</span>
                  <input
                    className={C('Modinfopersonalinput')}
                    value={nombreEmpresa}
                    onChange={(e) => setNombreEmpresa(e.target.value)}
                    disabled={!isAdmin || !editing}
                    readOnly={!editing}
                    placeholder="Nombre de la empresa"
                  />
                </label>
              </div>

              <div className={C('ModinfopersonalformGroup')}>
                <label className={C('Modinfopersonallabel')}>
                  <span className={C('ModinfopersonallabelText')}>Dirección</span>
                  <input
                    className={C('Modinfopersonalinput')}
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    disabled={!isAdmin || !editing}
                    readOnly={!editing}
                    placeholder="Dirección completa"
                  />
                </label>
              </div>

              <div className={C('ModinfopersonalformGroup')}>
                <label className={C('Modinfopersonallabel')}>
                  <span className={C('ModinfopersonallabelText')}>Teléfono</span>
                  <div className={C('ModinfopersonalinputGroup')}>
                    <input
                      className={C('ModinfopersonalinputPrefix')}
                      value={prefijoPais}
                      onChange={(e) => setPrefijoPais(e.target.value)}
                      disabled={!isAdmin || !editing}
                      readOnly={!editing}
                      placeholder="+57"
                      maxLength="4"
                    />
                    <input
                      className={C('Modinfopersonalinput')}
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      disabled={!isAdmin || !editing}
                      readOnly={!editing}
                      placeholder="Número de teléfono"
                    />
                  </div>
                </label>
              </div>

              <div className={C('ModinfopersonalformGroup')}>
                <label className={C('Modinfopersonallabel')}>
                  <span className={C('ModinfopersonallabelText')}>Ciudad</span>
                  <input
                    className={C('Modinfopersonalinput')}
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    disabled={!isAdmin || !editing}
                    readOnly={!editing}
                    placeholder="Ciudad"
                  />
                </label>
              </div>

              <div className={C('ModinfopersonalformGroup')}>
                <label className={C('Modinfopersonallabel')}>
                  <span className={C('ModinfopersonallabelText')}>País</span>
                  <input
                    className={C('Modinfopersonalinput')}
                    value={pais}
                    onChange={(e) => setPais(e.target.value)}
                    disabled={!isAdmin || !editing}
                    readOnly={!editing}
                    placeholder="País"
                  />
                </label>
              </div>

              <div className={C('ModinfopersonalformGroup')}>
                <label className={C('Modinfopersonallabel')}>
                  <span className={C('ModinfopersonallabelText')}>Correo de la Empresa</span>
                  <input
                    className={C('Modinfopersonalinput')}
                    type="email"
                    value={correoEmpresa}
                    onChange={(e) => setCorreoEmpresa(e.target.value)}
                    disabled={!isAdmin || !editing}
                    readOnly={!editing}
                    placeholder="contacto@empresa.com"
                  />
                </label>
              </div>

              <div className={C('ModinfopersonalformGroup')}>
                <label className={C('Modinfopersonallabel')}>
                  <span className={C('ModinfopersonallabelText')}>Página Web</span>
                  <input
                    className={C('Modinfopersonalinput')}
                    value={paginaWeb}
                    onChange={(e) => setPaginaWeb(e.target.value)}
                    disabled={!isAdmin || !editing}
                    readOnly={!editing}
                    placeholder="https://www.empresa.com"
                  />
                </label>
              </div>
            </div>

            <div className={C('ModinfopersonalformActions')}>
              <button
                className={C('ModinfopersonalprimaryButton')}
                type="submit"
                disabled={!editing || !isAdmin || savingCompany}
              >
                {savingCompany ? (
                  <>
                    <span className={C('Modinfopersonalspinner')}></span>
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
