// src/components/.../ActivarDesactivarUsuarios.jsx
import React, { useEffect, useState, useRef } from 'react';
import {
  obtenerUsuariosEmpresa,
  cambiarEstadoUsuario,
  crearUsuario,
  eliminarUsuario,
  obtenerPermisos,
  cambiarRolUsuario,
  obtenerMiPerfil,
  obtenerAreas
} from '../../../api/Profile';
import { useTheme } from "../../componentes/ThemeContext";
import { useCompanyStyles } from '../../componentes/ThemeContextEmpresa';

// Importar estilos por defecto (fallback)
import defaultStyles from '../../../styles/Profile/ActivarDesactivar.module.css';

const INACTIVE_STATE_ID = 2;
const ACTIVE_STATE_ID = 1;
const ADMIN_ROLE_ID = 1;
const USER_ROLE_ID = 2;

const ActivarDesactivarUsuarios = () => {
  const { theme } = useTheme();

  // Obtener estilos (empresa o default) desde el provider — evita parpadeo
  const styles = useCompanyStyles('ActivarDesactivar', defaultStyles);

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal crear usuario
  const [modalAbierto, setModalAbierto] = useState(false);
  const [creando, setCreando] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoApellidos, setNuevoApellidos] = useState('');
  const [nuevoCorreo, setNuevoCorreo] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmContrasena, setConfirmContrasena] = useState('');
  const [nuevoRolId, setNuevoRolId] = useState('');
  const [permisos, setPermisos] = useState([]);
  const [miPermisoId, setMiPermisoId] = useState(null);
  const [areas, setAreas] = useState([]);
  const [nuevoAreaId, setNuevoAreaId] = useState('');

  // Fetchers iniciales
  useEffect(() => {
    fetchUsuarios();
    fetchPermisos();
    fetchAreas();
    fetchMiPerfil();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await obtenerUsuariosEmpresa();
      setUsuarios(res.usuarios || []);
    } catch (err) {
      setError(err?.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermisos = async () => {
    try {
      const res = await obtenerPermisos();
      setPermisos(res.permisos || []);
    } catch (err) {
      console.error('Error al cargar permisos:', err);
    }
  };

  const fetchAreas = async () => {
    try {
      const res = await obtenerAreas();
      setAreas(res.areas || []);
    } catch (err) {
      console.error('Error al cargar áreas:', err);
    }
  };

  const fetchMiPerfil = async () => {
    try {
      const res = await obtenerMiPerfil();
      const u = res.usuario || {};
      setMiPermisoId(u.id_permiso_acceso || null);
    } catch (err) {
      console.error('No se pudo obtener perfil:', err);
    }
  };

  const abrirModal = () => {
    setModalAbierto(true);
    setError('');
    setSuccess('');
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setNuevoNombre('');
    setNuevoApellidos('');
    setNuevoCorreo('');
    setNuevaContrasena('');
    setConfirmContrasena('');
    setNuevoRolId('');
    setNuevoAreaId('');
    setError('');
  };

  const toggleEstado = async (usuario) => {
    const nuevoEstado = (usuario.id_estado === ACTIVE_STATE_ID) ? INACTIVE_STATE_ID : ACTIVE_STATE_ID;
    const confirmMsg = (nuevoEstado === ACTIVE_STATE_ID)
      ? `¿Deseas activar a ${usuario.nombres} (${usuario.correo})?`
      : `¿Deseas desactivar a ${usuario.nombres} (${usuario.correo})?`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(usuario.id_usuario);
    setError('');
    setSuccess('');
    try {
      const res = await cambiarEstadoUsuario(usuario.id_usuario, nuevoEstado);
      setUsuarios(prev => prev.map(u => u.id_usuario === usuario.id_usuario ? { ...u, id_estado: res.id_estado, estado: res.estado } : u));
      setSuccess('Estado actualizado correctamente.');
    } catch (err) {
      setError(err?.message || 'Error al actualizar estado');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleRol = async (usuario) => {
    if (miPermisoId !== ADMIN_ROLE_ID) {
      setError('No autorizado para cambiar roles');
      return;
    }
    try {
      const miPerfil = await obtenerMiPerfil();
      if (miPerfil.usuario && miPerfil.usuario.id_usuario === usuario.id_usuario) {
        setError('No puedes cambiar tu propio rol');
        return;
      }
    } catch (e) {}

    const nuevoRol = (usuario.id_permiso_acceso === ADMIN_ROLE_ID) ? USER_ROLE_ID : ADMIN_ROLE_ID;
    if (!window.confirm(`¿Confirmas el cambio de rol para ${usuario.nombres}?`)) return;

    setActionLoading(usuario.id_usuario);
    setError('');
    setSuccess('');
    try {
      const res = await cambiarRolUsuario(usuario.id_usuario, nuevoRol);
      setUsuarios(prev => prev.map(u => u.id_usuario === usuario.id_usuario ? { ...u, id_permiso_acceso: res.id_permiso_acceso, rol: res.rol } : u));
      setSuccess('Rol actualizado correctamente.');
    } catch (err) {
      setError(err?.message || 'Error al actualizar rol');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!nuevoNombre || !nuevoCorreo || !nuevaContrasena || !confirmContrasena || !nuevoAreaId) {
      setError('Nombre, correo, contraseñas y área son obligatorios');
      return;
    }
    if (nuevaContrasena !== confirmContrasena) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setCreando(true);
    try {
      const payload = {
        nombres: nuevoNombre,
        apellidos: nuevoApellidos,
        correo: nuevoCorreo.trim().toLowerCase(),
        contrasena: nuevaContrasena,
        contrasena_confirm: confirmContrasena,
        id_area: Number(nuevoAreaId)
      };
      if (nuevoRolId) payload.id_permiso_acceso = Number(nuevoRolId);

      await crearUsuario(payload);
      await fetchUsuarios();
      cerrarModal();
      setSuccess('Usuario creado correctamente.');
    } catch (err) {
      setError(err?.message || 'Error al crear usuario');
    } finally {
      setCreando(false);
    }
  };

  const handleEliminar = async (usuario) => {
    if (!window.confirm(`¿Eliminar a ${usuario.nombres} (${usuario.correo})? Esta acción no se puede deshacer.`)) return;
    setActionLoading(usuario.id_usuario);
    setError('');
    setSuccess('');
    try {
      await eliminarUsuario(usuario.id_usuario);
      setUsuarios(prev => prev.filter(u => u.id_usuario !== usuario.id_usuario));
      setSuccess('Usuario eliminado.');
    } catch (err) {
      setError(err?.message || 'Error al eliminar usuario');
    } finally {
      setActionLoading(null);
    }
  };

  /* -----------------------
     CustomSelect component
     ----------------------- */
  const CustomSelect = ({ options = [], value, onChange, placeholder = 'Selecciona...' }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
      const handler = (e) => {
        if (ref.current && !ref.current.contains(e.target)) setOpen(false);
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selected = options.find(opt => String(opt.value) === String(value));

    return (
      <div className={styles.ActivardesactivarcustomSelect} ref={ref}>
        <button
          type="button"
          className={styles.ActivardesactivarcustomSelectButton}
          onClick={() => setOpen(o => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className={styles.ActivardesactivarcustomSelectValue}>
            {selected ? selected.label : placeholder}
          </span>
          <span className={styles.ActivardesactivarcustomSelectArrow} aria-hidden />
        </button>

        {open && (
          <ul role="listbox" className={styles.ActivardesactivarcustomSelectList}>
            {options.length === 0 && <li className={styles.ActivardesactivarcustomSelectEmpty}>No hay opciones</li>}
            {options.map(opt => (
              <li
                key={opt.value}
                role="option"
                aria-selected={String(opt.value) === String(value)}
                className={`${styles.ActivardesactivarcustomSelectItem} ${String(opt.value) === String(value) ? styles.ActivardesactivarcustomSelectItemSelected : ''}`}
                onClick={() => { onChange(String(opt.value)); setOpen(false); }}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  /* build options for custom selects */
  const areaOptions = areas.map(a => ({ value: a.id_area, label: a.area_trabajo }));
  const permisoOptions = permisos.map(p => ({ value: p.id_permiso_acceso, label: p.rol }));

  // variante basada en ThemeContext (evita fallback oscuro)
  const variantClass = theme === 'dark'
    ? (styles?.ActivardesactivarDark || defaultStyles.ActivardesactivarDark || '')
    : (styles?.ActivardesactivarLight || defaultStyles.ActivardesactivarLight || '');

  // Defensive class getter
  const C = (cls) => styles?.[cls] || defaultStyles?.[cls] || '';

  return (
    <main className={`${C('Activardesactivarcontainer')} ${variantClass}`} aria-labelledby="admin-usuarios-title">
      
      {/* Header Section */}
      <section className={C('Activardesactivarheader')}>
        <div className={C('ActivardesactivarheaderContent')}>
          <h1 id="admin-usuarios-title" className={C('Activardesactivartitle')}>
            Administrar Usuarios
          </h1>
          <p className={C('Activardesactivarsubtitle')}>
            Activa, desactiva, crea usuarios, asigna roles y gestiona acceso
          </p>
        </div>
        <div className={C('ActivardesactivarheaderActions')}>
          <button 
            className={C('ActivardesactivarcreateButton')}
            onClick={abrirModal}
          >
            <span className={C('ActivardesactivarcreateButtonIcon')}>+</span>
            Crear Usuario
          </button>
          <span className={C('ActivardesactivarroleInfo')}>
            {miPermisoId === ADMIN_ROLE_ID ? 'Administrador' : 'Usuario'}
          </span>
        </div>
      </section>

      {/* Alert Messages */}
      {error && (
        <div className={C('ActivardesactivarerrorBox')} role="alert">
          <div className={C('ActivardesactivarerrorIcon')}>⚠️</div>
          <div className={C('ActivardesactivarerrorText')}>{error}</div>
        </div>
      )}
      
      {success && (
        <div className={C('ActivardesactivarsuccessBox')} role="status">
          <div className={C('ActivardesactivarsuccessIcon')}>✅</div>
          <div className={C('ActivardesactivarsuccessText')}>{success}</div>
        </div>
      )}

      {/* Users Table Section */}
      <section className={C('ActivardesactivartableSection')}>
        <div className={C('ActivardesactivarsectionHeader')}>
          <h2 className={C('ActivardesactivarsectionTitle')}>Gestión de Usuarios</h2>
          <p className={C('ActivardesactivarsectionSubtitle')}>
            {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} en el sistema
          </p>
        </div>

        {loading ? (
          <div className={C('Activardesactivarloading')}>
            <div className={C('ActivardesactivarloadingSpinner')}></div>
            <span>Cargando usuarios...</span>
          </div>
        ) : (
          <div className={C('ActivardesactivartableWrapper')}>
            <table className={C('Activardesactivartable')}>
              <thead>
                <tr>
                  <th className={C('ActivardesactivartableHeader')}>Usuario</th>
                  <th className={C('ActivardesactivartableHeader')}>Correo</th>
                  <th className={C('ActivardesactivartableHeader')}>Rol</th>
                  <th className={C('ActivardesactivartableHeader')}>Área</th>
                  <th className={C('ActivardesactivartableHeader')}>Estado</th>
                  <th className={C('ActivardesactivartableHeader')}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length === 0 ? (
                  <tr>
                    <td colSpan="6" className={C('ActivardesactivarnoUsers')}>
                      <div className={C('ActivardesactivaremptyState')}>
                        <span className={C('ActivardesactivaremptyIcon')}>👥</span>
                        <p>No hay usuarios registrados</p>
                        <button 
                          className={C('ActivardesactivarcreateButton')}
                          onClick={abrirModal}
                        >
                          <span className={C('ActivardesactivarcreateButtonIcon')}>+</span>
                          Crear Primer Usuario
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  usuarios.map(usuario => (
                    <tr key={usuario.id_usuario} className={C('ActivardesactivartableRow')}>
                      <td className={C('ActivardesactivarcellName')}>
                        <div className={C('ActivardesactivarusuarioInfo')}>
                          <span className={C('ActivardesactivarusuarioNombre')}>
                            {usuario.nombres} {usuario.apellidos || ''}
                          </span>
                        </div>
                      </td>
                      <td className={C('ActivardesactivarcellEmail')}>{usuario.correo}</td>
                      <td className={C('ActivardesactivarcellRole')}>
                        <span className={C('ActivardesactivarrolesBadge')}>
                          {usuario.rol || 'Usuario'}
                        </span>
                      </td>
                      <td className={C('ActivardesactivarcellArea')}>{usuario.area_trabajo || '-'}</td>
                      <td className={C('ActivardesactivarcellState')}>
                        <span className={`${C('ActivardesactivarstateBadge')} ${
                          usuario.id_estado === ACTIVE_STATE_ID 
                            ? C('ActivardesactivarstateActive') 
                            : C('ActivardesactivarstateInactive')
                        }`}>
                          {usuario.estado || (usuario.id_estado === ACTIVE_STATE_ID ? 'Activo' : 'Inactivo')}
                        </span>
                      </td>
                      <td className={C('ActivardesactivarcellActions')}>
                        <div className={C('ActivardesactivaractionButtons')}>
                          <button
                            className={C('ActivardesactivaractionButton')}
                            disabled={actionLoading === usuario.id_usuario}
                            onClick={() => toggleEstado(usuario)}
                            title={usuario.id_estado === ACTIVE_STATE_ID ? 'Desactivar usuario' : 'Activar usuario'}
                          >
                            {actionLoading === usuario.id_usuario ? (
                              <span className={C('ActivardesactivarbuttonSpinner')}></span>
                            ) : usuario.id_estado === ACTIVE_STATE_ID ? (
                              'Desactivar'
                            ) : (
                              'Activar'
                            )}
                          </button>

                          {miPermisoId === ADMIN_ROLE_ID && (
                            <button
                              className={C('ActivardesactivarroleButton')}
                              disabled={actionLoading === usuario.id_usuario}
                              onClick={() => handleToggleRol(usuario)}
                              title={usuario.id_permiso_acceso === ADMIN_ROLE_ID ? 'Cambiar a Usuario' : 'Cambiar a Administrador'}
                            >
                              {actionLoading === usuario.id_usuario ? (
                                <span className={C('ActivardesactivarbuttonSpinner')}></span>
                              ) : usuario.id_permiso_acceso === ADMIN_ROLE_ID ? (
                                'Hacer Usuario'
                              ) : (
                                'Hacer Admin'
                              )}
                            </button>
                          )}

                          <button
                            className={C('ActivardesactivardeleteButton')}
                            disabled={actionLoading === usuario.id_usuario}
                            onClick={() => handleEliminar(usuario)}
                            title="Eliminar usuario permanentemente"
                          >
                            {actionLoading === usuario.id_usuario ? (
                              <span className={C('ActivardesactivarbuttonSpinner')}></span>
                            ) : (
                              'Eliminar'
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal Crear Usuario */}
      {modalAbierto && (
        <div className={C('ActivardesactivarmodalOverlay')}>
          <div className={C('Activardesactivarmodal')}>
            <div className={C('ActivardesactivarmodalHeader')}>
              <h2 className={C('ActivardesactivarmodalTitle')}>Crear Nuevo Usuario</h2>
              <button 
                className={C('ActivardesactivarmodalClose')}
                onClick={cerrarModal}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCrearUsuario} className={C('ActivardesactivarmodalForm')}>
              <div className={C('ActivardesactivarformGrid')}>
                <div className={C('ActivardesactivarformGroup')}>
                  <label className={C('Activardesactivarlabel')}>
                    <span className={C('ActivardesactivarlabelText')}>Nombre *</span>
                    <input 
                      className={C('Activardesactivarinput')} 
                      value={nuevoNombre} 
                      onChange={e => setNuevoNombre(e.target.value)}
                      placeholder="Ingresa el nombre"
                      required
                    />
                  </label>
                </div>

                <div className={C('ActivardesactivarformGroup')}>
                  <label className={C('Activardesactivarlabel')}>
                    <span className={C('ActivardesactivarlabelText')}>Apellidos</span>
                    <input 
                      className={C('Activardesactivarinput')} 
                      value={nuevoApellidos} 
                      onChange={e => setNuevoApellidos(e.target.value)}
                      placeholder="Ingresa los apellidos"
                    />
                  </label>
                </div>

                <div className={C('ActivardesactivarformGroup')}>
                  <label className={C('Activardesactivarlabel')}>
                    <span className={C('ActivardesactivarlabelText')}>Correo Electrónico *</span>
                    <input 
                      className={C('Activardesactivarinput')} 
                      type="email" 
                      value={nuevoCorreo} 
                      onChange={e => setNuevoCorreo(e.target.value)}
                      placeholder="usuario@empresa.com"
                      required
                    />
                  </label>
                </div>

                <div className={C('ActivardesactivarformGroup')}>
                  <label className={C('Activardesactivarlabel')}>
                    <span className={C('ActivardesactivarlabelText')}>Contraseña *</span>
                    <input 
                      className={C('Activardesactivarinput')} 
                      type="password" 
                      value={nuevaContrasena} 
                      onChange={e => setNuevaContrasena(e.target.value)}
                      placeholder="Crea una contraseña segura"
                      required
                    />
                  </label>
                </div>

                <div className={C('ActivardesactivarformGroup')}>
                  <label className={C('Activardesactivarlabel')}>
                    <span className={C('ActivardesactivarlabelText')}>Confirmar Contraseña *</span>
                    <input 
                      className={C('Activardesactivarinput')} 
                      type="password" 
                      value={confirmContrasena} 
                      onChange={e => setConfirmContrasena(e.target.value)}
                      placeholder="Confirma la contraseña"
                      required
                    />
                  </label>
                </div>

                <div className={C('ActivardesactivarformGroup')}>
                  <label className={C('Activardesactivarlabel')}>
                    <span className={C('ActivardesactivarlabelText')}>Área de Trabajo *</span>
                    <CustomSelect
                      options={areaOptions}
                      value={nuevoAreaId}
                      onChange={val => setNuevoAreaId(val)}
                      placeholder="Selecciona un área"
                    />
                  </label>
                </div>

                <div className={C('ActivardesactivarformGroup')}>
                  <label className={C('Activardesactivarlabel')}>
                    <span className={C('ActivardesactivarlabelText')}>Rol de Usuario</span>
                    <CustomSelect
                      options={permisoOptions}
                      value={nuevoRolId}
                      onChange={val => setNuevoRolId(val)}
                      placeholder="Selecciona un rol"
                    />
                  </label>
                </div>
              </div>

              <div className={C('ActivardesactivarmodalActions')}>
                <button 
                  type="button"
                  className={C('ActivardesactivarmodalCancel')}
                  onClick={cerrarModal}
                  disabled={creando}
                >
                  Cancelar
                </button>
                <button 
                  className={C('ActivardesactivarmodalSubmit')} 
                  type="submit" 
                  disabled={creando}
                >
                  {creando ? (
                    <>
                      <span className={C('Activardesactivarspinner')}></span>
                      Creando...
                    </>
                  ) : (
                    'Crear Usuario'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default ActivarDesactivarUsuarios;
