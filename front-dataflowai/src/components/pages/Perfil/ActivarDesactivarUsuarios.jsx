import React, { useEffect, useState, useRef } from 'react';
import styles from '../../../styles/Profile/ActivarDesactivarDark.module.css';
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

const INACTIVE_STATE_ID = 2;
const ACTIVE_STATE_ID = 1;
const ADMIN_ROLE_ID = 1;
const USER_ROLE_ID = 2;

const ActivarDesactivarUsuarios = () => {
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
  const [nuevoAreaId, setNuevoAreaId] = useState(''); // <-- campo nuevo

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

  useEffect(() => {
    fetchUsuarios();
    fetchPermisos();
    fetchAreas();
    fetchMiPerfil();
  }, []);

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
      <div className={styles.customSelect} ref={ref}>
        <button
          type="button"
          className={styles.customSelectButton}
          onClick={() => setOpen(o => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className={styles.customSelectValue}>
            {selected ? selected.label : placeholder}
          </span>
          <span className={styles.customSelectArrow} aria-hidden />
        </button>

        {open && (
          <ul role="listbox" className={styles.customSelectList}>
            {options.length === 0 && <li className={styles.customSelectEmpty}>No hay opciones</li>}
            {options.map(opt => (
              <li
                key={opt.value}
                role="option"
                aria-selected={String(opt.value) === String(value)}
                className={`${styles.customSelectItem} ${String(opt.value) === String(value) ? styles.customSelectItemSelected : ''}`}
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

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Administrar Usuarios</h1>
      <p className={styles.pageSubtitle}>Activa, desactiva, crea usuarios, asigna roles y gestiona acceso.</p>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <section className={styles.createSection}>
        <h2 className={styles.sectionTitle}>Crear usuario</h2>
        <form onSubmit={handleCrearUsuario} className={styles.form}>
          <div className={styles.formRow}>
            <label className={styles.label}>Nombre</label>
            <input className={styles.input} value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Apellidos</label>
            <input className={styles.input} value={nuevoApellidos} onChange={e => setNuevoApellidos(e.target.value)} />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Correo</label>
            <input className={styles.input} type="email" value={nuevoCorreo} onChange={e => setNuevoCorreo(e.target.value)} />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Contraseña</label>
            <input className={styles.input} type="password" value={nuevaContrasena} onChange={e => setNuevaContrasena(e.target.value)} />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Confirmar Contraseña</label>
            <input className={styles.input} type="password" value={confirmContrasena} onChange={e => setConfirmContrasena(e.target.value)} />
          </div>

          <div className={styles.formRow}>
            <label className={styles.label}>Área</label>
            <CustomSelect
              options={areaOptions}
              value={nuevoAreaId}
              onChange={val => setNuevoAreaId(val)}
              placeholder="Selecciona un área"
            />
          </div>

          <div className={styles.formRow}>
            <label className={styles.label}>Rol (opcional)</label>
            <CustomSelect
              options={permisoOptions}
              value={nuevoRolId}
              onChange={val => setNuevoRolId(val)}
              placeholder="(Usar rol por defecto)"
            />
          </div>

          <div className={styles.formRow}>
            <button className={styles.primaryButton} type="submit" disabled={creando}>{creando ? 'Creando...' : 'Crear usuario'}</button>
          </div>
        </form>
      </section>

      <hr className={styles.divider} />

      {loading ? (
        <div className={styles.loading}>Cargando usuarios...</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
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
                  <td colSpan="6" className={styles.noUsers}>No hay usuarios</td>
                </tr>
              )}
              {usuarios.map(u => (
                <tr key={u.id_usuario}>
                  <td className={styles.cellName}>{u.nombres} {u.apellidos || ''}</td>
                  <td className={styles.cellEmail}>{u.correo}</td>
                  <td className={styles.cellRole}>{u.rol || '-'}</td>
                  <td className={styles.cellArea}>{u.area_trabajo || '-'}</td>
                  <td className={styles.cellState}>
                    <span className={u.id_estado === ACTIVE_STATE_ID ? styles.stateActive : styles.stateInactive}>
                      {u.estado || (`ID ${u.id_estado}`)}
                    </span>
                  </td>
                  <td className={styles.cellActions}>
                    <button
                      className={styles.actionButton}
                      disabled={actionLoading === u.id_usuario}
                      onClick={() => toggleEstado(u)}
                    >
                      {actionLoading === u.id_usuario ? 'Procesando...' : (u.id_estado === ACTIVE_STATE_ID ? 'Desactivar' : 'Activar')}
                    </button>

                    {miPermisoId === ADMIN_ROLE_ID && (
                      <button
                        className={styles.roleButton}
                        disabled={actionLoading === u.id_usuario}
                        onClick={() => handleToggleRol(u)}
                      >
                        {actionLoading === u.id_usuario ? 'Procesando...' : (u.id_permiso_acceso === ADMIN_ROLE_ID ? 'Volver Usuario' : 'Volver Administrador')}
                      </button>
                    )}

                    <button
                      className={styles.deleteButton}
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
