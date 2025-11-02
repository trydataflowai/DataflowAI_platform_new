// src/components/.../ActivarDesactivarUsuarios.jsx
import React, { useEffect, useState, useRef } from 'react';
import styles from '../../../styles/Profile/ActivarDesactivar.module.css';
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
import { useTheme } from "../../componentes/ThemeContext"; // ajusta ruta si tu ThemeContext está en otra carpeta

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
      <div className={styles.PerfilactivardesactivarcustomSelect} ref={ref}>
        <button
          type="button"
          className={styles.PerfilactivardesactivarcustomSelectButton}
          onClick={() => setOpen(o => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className={styles.PerfilactivardesactivarcustomSelectValue}>
            {selected ? selected.label : placeholder}
          </span>
          <span className={styles.PerfilactivardesactivarcustomSelectArrow} aria-hidden />
        </button>

        {open && (
          <ul role="listbox" className={styles.PerfilactivardesactivarcustomSelectList}>
            {options.length === 0 && <li className={styles.PerfilactivardesactivarcustomSelectEmpty}>No hay opciones</li>}
            {options.map(opt => (
              <li
                key={opt.value}
                role="option"
                aria-selected={String(opt.value) === String(value)}
                className={`${styles.PerfilactivardesactivarcustomSelectItem} ${String(opt.value) === String(value) ? styles.PerfilactivardesactivarcustomSelectItemSelected : ''}`}
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

  // clase variante (light/dark)
  const variantClass = theme === 'light' ? styles.PerfilactivardesactivarLight : styles.PerfilactivardesactivarDark;

  return (
    <div className={`${styles.Perfilactivardesactivarcontainer} ${variantClass}`}>
      <h1 className={styles.PerfilactivardesactivarpageTitle}>Administrar Usuarios</h1>
      <p className={styles.PerfilactivardesactivarpageSubtitle}>Activa, desactiva, crea usuarios, asigna roles y gestiona acceso.</p>

      {error && <div className={styles.Perfilactivardesactivarerror}>{error}</div>}
      {success && <div className={styles.Perfilactivardesactivarsuccess}>{success}</div>}

      <section className={styles.PerfilactivardesactivarcreateSection}>
        <h2 className={styles.PerfilactivardesactivarsectionTitle}>Crear usuario</h2>
        <form onSubmit={handleCrearUsuario} className={styles.Perfilactivardesactivarform}>
          <div className={styles.PerfilactivardesactivarformRow}>
            <label className={styles.Perfilactivardesactivarlabel}>Nombre</label>
            <input className={styles.Perfilactivardesactivarinput} value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} />
          </div>
          <div className={styles.PerfilactivardesactivarformRow}>
            <label className={styles.Perfilactivardesactivarlabel}>Apellidos</label>
            <input className={styles.Perfilactivardesactivarinput} value={nuevoApellidos} onChange={e => setNuevoApellidos(e.target.value)} />
          </div>
          <div className={styles.PerfilactivardesactivarformRow}>
            <label className={styles.Perfilactivardesactivarlabel}>Correo</label>
            <input className={styles.Perfilactivardesactivarinput} type="email" value={nuevoCorreo} onChange={e => setNuevoCorreo(e.target.value)} />
          </div>
          <div className={styles.PerfilactivardesactivarformRow}>
            <label className={styles.Perfilactivardesactivarlabel}>Contraseña</label>
            <input className={styles.Perfilactivardesactivarinput} type="password" value={nuevaContrasena} onChange={e => setNuevaContrasena(e.target.value)} />
          </div>
          <div className={styles.PerfilactivardesactivarformRow}>
            <label className={styles.Perfilactivardesactivarlabel}>Confirmar Contraseña</label>
            <input className={styles.Perfilactivardesactivarinput} type="password" value={confirmContrasena} onChange={e => setConfirmContrasena(e.target.value)} />
          </div>

          <div className={styles.PerfilactivardesactivarformRow}>
            <label className={styles.Perfilactivardesactivarlabel}>Área</label>
            <CustomSelect
              options={areaOptions}
              value={nuevoAreaId}
              onChange={val => setNuevoAreaId(val)}
              placeholder="Selecciona un área"
            />
          </div>

          <div className={styles.PerfilactivardesactivarformRow}>
            <label className={styles.Perfilactivardesactivarlabel}>Rol (opcional)</label>
            <CustomSelect
              options={permisoOptions}
              value={nuevoRolId}
              onChange={val => setNuevoRolId(val)}
              placeholder="(Usar rol por defecto)"
            />
          </div>

          <div className={styles.PerfilactivardesactivarformRow}>
            <button className={styles.PerfilactivardesactivarprimaryButton} type="submit" disabled={creando}>{creando ? 'Creando...' : 'Crear usuario'}</button>
          </div>
        </form>
      </section>

      <hr className={styles.Perfilactivardesactivardivider} />

      {loading ? (
        <div className={styles.Perfilactivardesactivarloading}>Cargando usuarios...</div>
      ) : (
        <div className={styles.PerfilactivardesactivartableWrapper}>
          <table className={styles.Perfilactivardesactivartable}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Área</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan="6" className={styles.PerfilactivardesactivarnoUsers}>No hay usuarios</td>
                </tr>
              )}
              {usuarios.map(u => (
                <tr key={u.id_usuario}>
                  <td className={styles.PerfilactivardesactivarcellName}>{u.nombres} {u.apellidos || ''}</td>
                  <td className={styles.PerfilactivardesactivarcellEmail}>{u.correo}</td>
                  <td className={styles.PerfilactivardesactivarcellRole}>{u.rol || '-'}</td>
                  <td className={styles.PerfilactivardesactivarcellArea}>{u.area_trabajo || '-'}</td>
                  <td className={styles.PerfilactivardesactivarcellState}>
                    <span className={u.id_estado === ACTIVE_STATE_ID ? styles.PerfilactivardesactivarstateActive : styles.PerfilactivardesactivarstateInactive}>
                      {u.estado || (`ID ${u.id_estado}`)}
                    </span>
                  </td>
                  <td className={styles.PerfilactivardesactivarcellActions}>
                    <button
                      className={styles.PerfilactivardesactivaractionButton}
                      disabled={actionLoading === u.id_usuario}
                      onClick={() => toggleEstado(u)}
                    >
                      {actionLoading === u.id_usuario ? 'Procesando...' : (u.id_estado === ACTIVE_STATE_ID ? 'Desactivar' : 'Activar')}
                    </button>

                    {miPermisoId === ADMIN_ROLE_ID && (
                      <button
                        className={styles.PerfilactivardesactivarroleButton}
                        disabled={actionLoading === u.id_usuario}
                        onClick={() => handleToggleRol(u)}
                      >
                        {actionLoading === u.id_usuario ? 'Procesando...' : (u.id_permiso_acceso === ADMIN_ROLE_ID ? 'Volver Usuario' : 'Volver Administrador')}
                      </button>
                    )}

                    <button
                      className={styles.PerfilactivardesactivardeleteButton}
                      disabled={actionLoading === u.id_usuario}
                      onClick={() => handleEliminar(u)}
                    >
                      {actionLoading === u.id_usuario ? 'Procesando...' : 'Eliminar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ActivarDesactivarUsuarios;
