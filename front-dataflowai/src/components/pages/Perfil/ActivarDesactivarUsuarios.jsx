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
import { obtenerInfoUsuario } from '../../../api/Usuario';

// Función para cargar los estilos dinámicamente
const cargarEstilosEmpresa = async (empresaId, planId) => {
  const planesEspeciales = [3, 6]; // Planes que usan estilos personalizados
  
  try {
    // Verificar si el plan es especial y si existe la carpeta de la empresa
    if (planesEspeciales.includes(planId)) {
      try {
        // Intentar importar los estilos de la carpeta de la empresa
        const estilosEmpresa = await import(`../../../styles/empresas/${empresaId}/ActivarDesactivar.module.css`);
        return estilosEmpresa.default;
      } catch (error) {
        console.warn(`No se encontraron estilos personalizados para empresa ${empresaId}, usando estilos por defecto`);
      }
    }
    
    // Cargar estilos por defecto
    const estilosPorDefecto = await import('../../../styles/Profile/ActivarDesactivar.module.css');
    return estilosPorDefecto.default;
  } catch (error) {
    console.error('Error cargando estilos:', error);
    // Fallback a estilos por defecto
    const estilosPorDefecto = await import('../../../styles/Profile/ActivarDesactivar.module.css');
    return estilosPorDefecto.default;
  }
};

const INACTIVE_STATE_ID = 2;
const ACTIVE_STATE_ID = 1;
const ADMIN_ROLE_ID = 1;
const USER_ROLE_ID = 2;

const ActivarDesactivarUsuarios = () => {
  const { theme } = useTheme();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [styles, setStyles] = useState({});
  const [cargandoEstilos, setCargandoEstilos] = useState(true);

  // Form crear
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

  // Cargar información del usuario y estilos
  useEffect(() => {
    const cargarUsuarioYEstilos = async () => {
      setCargandoEstilos(true);
      try {
        const usuarioInfo = await obtenerInfoUsuario();
        const empresaId = usuarioInfo.empresa?.id;
        const planId = usuarioInfo.empresa?.plan?.id;
        
        if (empresaId && planId) {
          const estilosCargados = await cargarEstilosEmpresa(empresaId, planId);
          setStyles(estilosCargados);
        } else {
          // Fallback a estilos por defecto si no hay info de empresa/plan
          const estilosPorDefecto = await import('../../../styles/Profile/ActivarDesactivar.module.css');
          setStyles(estilosPorDefecto.default);
        }
      } catch (error) {
        console.error('Error cargando información del usuario:', error);
        // Fallback a estilos por defecto
        const estilosPorDefecto = await import('../../../styles/Profile/ActivarDesactivar.module.css');
        setStyles(estilosPorDefecto.default);
      } finally {
        setCargandoEstilos(false);
      }
    };

    cargarUsuarioYEstilos();
  }, []);

  useEffect(() => {
    if (!cargandoEstilos) {
      fetchUsuarios();
      fetchPermisos();
      fetchAreas();
      fetchMiPerfil();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargandoEstilos]);

  const fetchUsuarios = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await obtenerUsuariosEmpresa();
      setUsuarios(res.usuarios || []);
    } catch (err) {
      setError(err.message || 'Error al cargar usuarios');
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
      setError(err.message || 'Error al actualizar estado');
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
      setError(err.message || 'Error al actualizar rol');
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
      setNuevoNombre('');
      setNuevoApellidos('');
      setNuevoCorreo('');
      setNuevaContrasena('');
      setConfirmContrasena('');
      setNuevoRolId('');
      setNuevoAreaId('');
      setSuccess('Usuario creado correctamente.');
    } catch (err) {
      setError(err.message || 'Error al crear usuario');
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
      setError(err.message || 'Error al eliminar usuario');
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

  // Si aún se están cargando los estilos, mostrar loading
  if (cargandoEstilos) {
    return (
      <div className="cargando-estilos">
        <div>Cargando estilos...</div>
      </div>
    );
  }

  // clase variante (light/dark)
  const variantClass = theme === 'light' ? styles.ActivardesactivarLight : styles.ActivardesactivarDark;

  return (
    <main className={`${styles.Activardesactivarcontainer} ${variantClass}`} aria-labelledby="admin-usuarios-title">
      
      {/* Header Section */}
      <section className={styles.Activardesactivarheader}>
        <div className={styles.ActivardesactivarheaderContent}>
          <h1 id="admin-usuarios-title" className={styles.Activardesactivartitle}>
            Administrar Usuarios
          </h1>
          <p className={styles.Activardesactivarsubtitle}>
            Activa, desactiva, crea usuarios, asigna roles y gestiona acceso
          </p>
        </div>
        <div className={styles.ActivardesactivarheaderMeta}>
          <span className={styles.ActivardesactivarroleInfo}>
            {miPermisoId === ADMIN_ROLE_ID ? 'Administrador' : 'Usuario'}
          </span>
        </div>
      </section>

      {/* Alert Messages */}
      {error && (
        <div className={styles.ActivardesactivarerrorBox} role="alert">
          <div className={styles.ActivardesactivarerrorIcon}>⚠️</div>
          <div className={styles.ActivardesactivarerrorText}>{error}</div>
        </div>
      )}
      
      {success && (
        <div className={styles.ActivardesactivarsuccessBox} role="status">
          <div className={styles.ActivardesactivarsuccessIcon}>✅</div>
          <div className={styles.ActivardesactivarsuccessText}>{success}</div>
        </div>
      )}

      {/* Create User Section */}
      <section className={styles.ActivardesactivarcreateSection}>
        <div className={styles.ActivardesactivarsectionHeader}>
          <h2 className={styles.ActivardesactivarsectionTitle}>Crear Nuevo Usuario</h2>
          <p className={styles.ActivardesactivarsectionSubtitle}>Agrega nuevos usuarios al sistema</p>
        </div>
        
        <form onSubmit={handleCrearUsuario} className={styles.Activardesactivarform}>
          <div className={styles.ActivardesactivarformGrid}>
            <div className={styles.ActivardesactivarformGroup}>
              <label className={styles.Activardesactivarlabel}>
                <span className={styles.ActivardesactivarlabelText}>Nombre</span>
                <input 
                  className={styles.Activardesactivarinput} 
                  value={nuevoNombre} 
                  onChange={e => setNuevoNombre(e.target.value)}
                  placeholder="Ingresa el nombre"
                />
              </label>
            </div>

            <div className={styles.ActivardesactivarformGroup}>
              <label className={styles.Activardesactivarlabel}>
                <span className={styles.ActivardesactivarlabelText}>Apellidos</span>
                <input 
                  className={styles.Activardesactivarinput} 
                  value={nuevoApellidos} 
                  onChange={e => setNuevoApellidos(e.target.value)}
                  placeholder="Ingresa los apellidos"
                />
              </label>
            </div>

            <div className={styles.ActivardesactivarformGroup}>
              <label className={styles.Activardesactivarlabel}>
                <span className={styles.ActivardesactivarlabelText}>Correo Electrónico</span>
                <input 
                  className={styles.Activardesactivarinput} 
                  type="email" 
                  value={nuevoCorreo} 
                  onChange={e => setNuevoCorreo(e.target.value)}
                  placeholder="usuario@empresa.com"
                />
              </label>
            </div>

            <div className={styles.ActivardesactivarformGroup}>
              <label className={styles.Activardesactivarlabel}>
                <span className={styles.ActivardesactivarlabelText}>Contraseña</span>
                <input 
                  className={styles.Activardesactivarinput} 
                  type="password" 
                  value={nuevaContrasena} 
                  onChange={e => setNuevaContrasena(e.target.value)}
                  placeholder="Crea una contraseña segura"
                />
              </label>
            </div>

            <div className={styles.ActivardesactivarformGroup}>
              <label className={styles.Activardesactivarlabel}>
                <span className={styles.ActivardesactivarlabelText}>Confirmar Contraseña</span>
                <input 
                  className={styles.Activardesactivarinput} 
                  type="password" 
                  value={confirmContrasena} 
                  onChange={e => setConfirmContrasena(e.target.value)}
                  placeholder="Confirma la contraseña"
                />
              </label>
            </div>

            <div className={styles.ActivardesactivarformGroup}>
              <label className={styles.Activardesactivarlabel}>
                <span className={styles.ActivardesactivarlabelText}>Área de Trabajo</span>
                <CustomSelect
                  options={areaOptions}
                  value={nuevoAreaId}
                  onChange={val => setNuevoAreaId(val)}
                  placeholder="Selecciona un área"
                />
              </label>
            </div>

            <div className={styles.ActivardesactivarformGroup}>
              <label className={styles.Activardesactivarlabel}>
                <span className={styles.ActivardesactivarlabelText}>Rol de Usuario</span>
                <CustomSelect
                  options={permisoOptions}
                  value={nuevoRolId}
                  onChange={val => setNuevoRolId(val)}
                  placeholder="Selecciona un rol"
                />
              </label>
            </div>
          </div>

          <div className={styles.ActivardesactivarformActions}>
            <button 
              className={styles.ActivardesactivarprimaryButton} 
              type="submit" 
              disabled={creando}
            >
              {creando ? (
                <>
                  <span className={styles.Activardesactivarspinner}></span>
                  Creando Usuario...
                </>
              ) : (
                'Crear Usuario'
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Users Table Section */}
      <section className={styles.ActivardesactivartableSection}>
        <div className={styles.ActivardesactivarsectionHeader}>
          <h2 className={styles.ActivardesactivarsectionTitle}>Gestión de Usuarios</h2>
          <p className={styles.ActivardesactivarsectionSubtitle}>
            {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} en el sistema
          </p>
        </div>

        {loading ? (
          <div className={styles.Activardesactivarloading}>
            <div className={styles.ActivardesactivarloadingSpinner}></div>
            <span>Cargando usuarios...</span>
          </div>
        ) : (
          <div className={styles.ActivardesactivartableWrapper}>
            <table className={styles.Activardesactivartable}>
              <thead>
                <tr>
                  <th className={styles.ActivardesactivartableHeader}>Usuario</th>
                  <th className={styles.ActivardesactivartableHeader}>Correo</th>
                  <th className={styles.ActivardesactivartableHeader}>Rol</th>
                  <th className={styles.ActivardesactivartableHeader}>Área</th>
                  <th className={styles.ActivardesactivartableHeader}>Estado</th>
                  <th className={styles.ActivardesactivartableHeader}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length === 0 ? (
                  <tr>
                    <td colSpan="6" className={styles.ActivardesactivarnoUsers}>
                      <div className={styles.ActivardesactivaremptyState}>
                        <span className={styles.ActivardesactivaremptyIcon}>👥</span>
                        <p>No hay usuarios registrados</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  usuarios.map(usuario => (
                    <tr key={usuario.id_usuario} className={styles.ActivardesactivartableRow}>
                      <td className={styles.ActivardesactivarcellName}>
                        <div className={styles.ActivardesactivarusuarioInfo}>
                          <span className={styles.ActivardesactivarusuarioNombre}>
                            {usuario.nombres} {usuario.apellidos || ''}
                          </span>
                        </div>
                      </td>
                      <td className={styles.ActivardesactivarcellEmail}>{usuario.correo}</td>
                      <td className={styles.ActivardesactivarcellRole}>
                        <span className={styles.ActivardesactivarrolesBadge}>
                          {usuario.rol || 'Usuario'}
                        </span>
                      </td>
                      <td className={styles.ActivardesactivarcellArea}>{usuario.area_trabajo || '-'}</td>
                      <td className={styles.ActivardesactivarcellState}>
                        <span className={`${styles.ActivardesactivarstateBadge} ${
                          usuario.id_estado === ACTIVE_STATE_ID 
                            ? styles.ActivardesactivarstateActive 
                            : styles.ActivardesactivarstateInactive
                        }`}>
                          {usuario.estado || (usuario.id_estado === ACTIVE_STATE_ID ? 'Activo' : 'Inactivo')}
                        </span>
                      </td>
                      <td className={styles.ActivardesactivarcellActions}>
                        <div className={styles.ActivardesactivaractionButtons}>
                          <button
                            className={styles.ActivardesactivaractionButton}
                            disabled={actionLoading === usuario.id_usuario}
                            onClick={() => toggleEstado(usuario)}
                            title={usuario.id_estado === ACTIVE_STATE_ID ? 'Desactivar usuario' : 'Activar usuario'}
                          >
                            {actionLoading === usuario.id_usuario ? (
                              <span className={styles.ActivardesactivarbuttonSpinner}></span>
                            ) : usuario.id_estado === ACTIVE_STATE_ID ? (
                              'Desactivar'
                            ) : (
                              'Activar'
                            )}
                          </button>

                          {miPermisoId === ADMIN_ROLE_ID && (
                            <button
                              className={styles.ActivardesactivarroleButton}
                              disabled={actionLoading === usuario.id_usuario}
                              onClick={() => handleToggleRol(usuario)}
                              title={usuario.id_permiso_acceso === ADMIN_ROLE_ID ? 'Cambiar a Usuario' : 'Cambiar a Administrador'}
                            >
                              {actionLoading === usuario.id_usuario ? (
                                <span className={styles.ActivardesactivarbuttonSpinner}></span>
                              ) : usuario.id_permiso_acceso === ADMIN_ROLE_ID ? (
                                'Hacer Usuario'
                              ) : (
                                'Hacer Admin'
                              )}
                            </button>
                          )}

                          <button
                            className={styles.ActivardesactivardeleteButton}
                            disabled={actionLoading === usuario.id_usuario}
                            onClick={() => handleEliminar(usuario)}
                            title="Eliminar usuario permanentemente"
                          >
                            {actionLoading === usuario.id_usuario ? (
                              <span className={styles.ActivardesactivarbuttonSpinner}></span>
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
    </main>
  );
};

export default ActivarDesactivarUsuarios;