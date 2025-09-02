// src/components/pages/Perfil/ActivarDesactivarUsuarios.jsx
import React, { useEffect, useState } from 'react';
import styles from '../../../styles/CreacionUsuario.module.css';
import {
  obtenerUsuariosEmpresa,
  cambiarEstadoUsuario,
  crearUsuario,
  eliminarUsuario,
  obtenerPermisos
} from '../../../api/Profile';

const INACTIVE_STATE_ID = 2; // Ajusta si en tu BD el id de "inactivo" es otro
const ACTIVE_STATE_ID = 1;

const ActivarDesactivarUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // id_usuario en curso
  const [error, setError] = useState('');

  // Form crear
  const [creando, setCreando] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoApellidos, setNuevoApellidos] = useState('');
  const [nuevoCorreo, setNuevoCorreo] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmContrasena, setConfirmContrasena] = useState('');
  const [nuevoRolId, setNuevoRolId] = useState(''); // opcional
  const [permisos, setPermisos] = useState([]);

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
      // Si falla, permitimos creación sin listado (campo seguirá existiendo)
      console.error('Error al cargar permisos:', err);
    }
  };

  useEffect(() => {
    fetchUsuarios();
    fetchPermisos();
  }, []);

  const toggleEstado = async (usuario) => {
    const nuevoEstado = (usuario.id_estado === ACTIVE_STATE_ID) ? INACTIVE_STATE_ID : ACTIVE_STATE_ID;
    const confirmMsg = (nuevoEstado === ACTIVE_STATE_ID)
      ? `¿Deseas activar a ${usuario.nombres} (${usuario.correo})?`
      : `¿Deseas desactivar a ${usuario.nombres} (${usuario.correo})?`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(usuario.id_usuario);
    setError('');
    try {
      const res = await cambiarEstadoUsuario(usuario.id_usuario, nuevoEstado);
      setUsuarios(prev => prev.map(u => u.id_usuario === usuario.id_usuario ? { ...u, id_estado: res.id_estado, estado: res.estado } : u));
    } catch (err) {
      setError(err.message || 'Error al actualizar estado');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    setError('');
    if (!nuevoNombre || !nuevoCorreo || !nuevaContrasena || !confirmContrasena) {
      setError('Nombre, correo y ambas contraseñas son obligatorios');
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
        correo: nuevoCorreo,
        contrasena: nuevaContrasena,
        contrasena_confirm: confirmContrasena
      };
      if (nuevoRolId) payload.id_permiso_acceso = Number(nuevoRolId);

      const res = await crearUsuario(payload);
      // recargar lista o insertar nuevo
      await fetchUsuarios();
      // limpiar form
      setNuevoNombre('');
      setNuevoApellidos('');
      setNuevoCorreo('');
      setNuevaContrasena('');
      setConfirmContrasena('');
      setNuevoRolId('');
      alert('Usuario creado correctamente');
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
    try {
      await eliminarUsuario(usuario.id_usuario);
      // quitar de la lista
      setUsuarios(prev => prev.filter(u => u.id_usuario !== usuario.id_usuario));
    } catch (err) {
      setError(err.message || 'Error al eliminar usuario');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Administrar Usuarios (Activar / Desactivar / Crear / Eliminar)</h1>

      {error && <div className={styles.error}>{error}</div>}

      <section className={styles.createSection}>
        <h2>Crear usuario</h2>
        <form onSubmit={handleCrearUsuario} className={styles.form}>
          <div className={styles.formRow}>
            <label>Nombre</label>
            <input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} />
          </div>
          <div className={styles.formRow}>
            <label>Apellidos</label>
            <input value={nuevoApellidos} onChange={e => setNuevoApellidos(e.target.value)} />
          </div>
          <div className={styles.formRow}>
            <label>Correo</label>
            <input type="email" value={nuevoCorreo} onChange={e => setNuevoCorreo(e.target.value)} />
          </div>
          <div className={styles.formRow}>
            <label>Contraseña</label>
            <input type="password" value={nuevaContrasena} onChange={e => setNuevaContrasena(e.target.value)} />
          </div>
          <div className={styles.formRow}>
            <label>Confirmar Contraseña</label>
            <input type="password" value={confirmContrasena} onChange={e => setConfirmContrasena(e.target.value)} />
          </div>
          <div className={styles.formRow}>
            <label>Rol (opcional)</label>
            <select value={nuevoRolId} onChange={e => setNuevoRolId(e.target.value)}>
              <option value="">(Usar rol por defecto)</option>
              {permisos.map(p => (
                <option key={p.id_permiso_acceso} value={p.id_permiso_acceso}>{p.rol}</option>
              ))}
            </select>
          </div>
          <div className={styles.formRow}>
            <button type="submit" disabled={creando}>{creando ? 'Creando...' : 'Crear usuario'}</button>
          </div>
        </form>
      </section>

      <hr />

      {loading ? (
        <div>Cargando usuarios...</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan="5">No hay usuarios</td>
                </tr>
              )}
              {usuarios.map(u => (
                <tr key={u.id_usuario}>
                  <td>{u.nombres} {u.apellidos || ''}</td>
                  <td>{u.correo}</td>
                  <td>{u.rol || '-'}</td>
                  <td>{u.estado || (`ID ${u.id_estado}`)}</td>
                  <td>
                    <button
                      className={styles.actionButton}
                      disabled={actionLoading === u.id_usuario}
                      onClick={() => toggleEstado(u)}
                    >
                      {actionLoading === u.id_usuario ? 'Procesando...' : (u.id_estado === ACTIVE_STATE_ID ? 'Desactivar' : 'Activar')}
                    </button>
                    <button
                      className={styles.deleteButton}
                      disabled={actionLoading === u.id_usuario}
                      onClick={() => handleEliminar(u)}
                      style={{ marginLeft: 8 }}
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
