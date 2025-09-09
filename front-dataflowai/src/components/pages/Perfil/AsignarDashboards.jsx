import React, { useEffect, useState } from 'react';
import styles from '../../../styles/Profile/ModInfoPersonalLight.module.css';
import {
  AsgDashboard_obtenerUsuariosEmpresa,
  AsgDashboard_obtenerProductos,
  AsgDashboard_obtenerAsignacionesUsuario,
  AsgDashboard_asignarProductoUsuario,
  AsgDashboard_eliminarAsignacionUsuario
} from '../../../api/Profile';

const AsgDashboardAsignarDashboards = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarUsuarios();
    cargarProductos();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const data = await AsgDashboard_obtenerUsuariosEmpresa();
      setUsuarios(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al obtener usuarios');
    } finally {
      setLoading(false);
    }
  };

  const cargarProductos = async () => {
    try {
      const data = await AsgDashboard_obtenerProductos();
      setProductos(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al obtener productos');
    }
  };

  const abrirAsignar = async (usuario) => {
    setSelectedUser(usuario);
    setMsg(null);
    setError(null);
    try {
      const data = await AsgDashboard_obtenerAsignacionesUsuario(usuario.id_usuario);
      setAsignaciones(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'No se pudo cargar asignaciones');
    }
  };

  const handleAsignar = async (producto) => {
    if (!selectedUser) return;
    setMsg(null);
    setError(null);
    try {
      await AsgDashboard_asignarProductoUsuario(selectedUser.id_usuario, producto.id_producto);
      setMsg('Producto asignado correctamente.');
      // recargar asignaciones
      const data = await AsgDashboard_obtenerAsignacionesUsuario(selectedUser.id_usuario);
      setAsignaciones(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al asignar producto.');
    }
  };

  const handleEliminar = async (producto) => {
    if (!selectedUser) return;
    setMsg(null);
    setError(null);
    try {
      await AsgDashboard_eliminarAsignacionUsuario(selectedUser.id_usuario, producto.id_producto);
      setMsg('Asignación eliminada.');
      const data = await AsgDashboard_obtenerAsignacionesUsuario(selectedUser.id_usuario);
      setAsignaciones(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al eliminar asignación.');
    }
  };

  const isAssigned = (productoId) => {
    return asignaciones.some(a => {
      if (a.producto && a.producto.id_producto) return a.producto.id_producto === productoId;
      if (a.id_producto) return a.id_producto === productoId;
      return false;
    });
  };

  return (
    <div className={styles.container}>
      <h1>Asignar Dashboard</h1>

      {loading && <p>Cargando...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {msg && <p style={{ color: 'green' }}>{msg}</p>}

      <h2>Usuarios de tu empresa</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Apellidos</th>
            <th>Correo</th>
            <th>Área</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map(u => (
            <tr key={u.id_usuario}>
              <td>{u.nombres}</td>
              <td>{u.apellidos}</td>
              <td>{u.correo}</td>
              <td>{u.area}</td>
              <td>
                <button onClick={() => abrirAsignar(u)}>Asignar dashboards</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedUser && (
        <div className={styles.modal}>
          <h3>Asignar dashboards a: {selectedUser.nombres} {selectedUser.apellidos}</h3>
          <button onClick={() => { setSelectedUser(null); setAsignaciones([]); setMsg(null); setError(null); }}>
            Cerrar
          </button>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ flex: 1 }}>
              <h4>Productos disponibles</h4>
              <div style={{ maxHeight: 300, overflow: 'auto' }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Área</th>
                      <th>Propietario</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map(p => {
                      const assigned = isAssigned(p.id_producto);
                      const propietario = (p.owned_by && p.owned_by.length) ? p.owned_by.map(o => o.nombre_empresa).join(', ') : 'Público';
                      return (
                        <tr key={p.id_producto}>
                          <td>{p.producto}</td>
                          <td>{p.area}</td>
                          <td>{propietario}</td>
                          <td>
                            <button
                              onClick={() => handleAsignar(p)}
                              disabled={assigned}
                            >
                              {assigned ? 'Asignado' : 'Asignar'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <h4>Productos asignados</h4>
              <div style={{ maxHeight: 300, overflow: 'auto' }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Área</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asignaciones.length === 0 && (
                      <tr><td colSpan={3}>No hay asignaciones</td></tr>
                    )}
                    {asignaciones.map(a => {
                      const prod = a.producto || (a.id_producto && productos.find(p => p.id_producto === a.id_producto));
                      if (!prod) return null;
                      return (
                        <tr key={prod.id_producto}>
                          <td>{prod.producto}</td>
                          <td>{prod.area}</td>
                          <td>
                            <button onClick={() => handleEliminar(prod)}>Quitar</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default AsgDashboardAsignarDashboards;
