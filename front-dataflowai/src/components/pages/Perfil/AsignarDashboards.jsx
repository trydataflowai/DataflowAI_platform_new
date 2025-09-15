import React, { useEffect, useState } from 'react';
import styles from '../../../styles/Profile/AsignarDashboardDark.module.css';
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
  const [actionLoading, setActionLoading] = useState(null); // id_producto en curso
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarUsuarios();
    cargarProductos();
  }, []);

  // Evita scroll de fondo cuando el modal está abierto
  useEffect(() => {
    const original = document.body.style.overflow;
    if (selectedUser) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = original;
    }
    return () => {
      document.body.style.overflow = original;
    };
  }, [selectedUser]);

  const cargarUsuarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AsgDashboard_obtenerUsuariosEmpresa();
      setUsuarios(data || []);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Error al obtener usuarios');
    } finally {
      setLoading(false);
    }
  };

  const cargarProductos = async () => {
    setError(null);
    try {
      const data = await AsgDashboard_obtenerProductos();
      setProductos(data || []);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Error al obtener productos');
    }
  };

  const abrirAsignar = async (usuario) => {
    setSelectedUser(usuario);
    setMsg(null);
    setError(null);
    setAsignaciones([]);
    try {
      const data = await AsgDashboard_obtenerAsignacionesUsuario(usuario.id_usuario);
      setAsignaciones(data || []);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'No se pudo cargar asignaciones');
    }
  };

  const cerrarModal = () => {
    setSelectedUser(null);
    setAsignaciones([]);
    setMsg(null);
    setError(null);
  };

  const handleAsignar = async (producto) => {
    if (!selectedUser) return;
    setMsg(null);
    setError(null);
    setActionLoading(producto.id_producto);
    try {
      await AsgDashboard_asignarProductoUsuario(selectedUser.id_usuario, producto.id_producto);
      setMsg('Producto asignado correctamente.');
      const data = await AsgDashboard_obtenerAsignacionesUsuario(selectedUser.id_usuario);
      setAsignaciones(data || []);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Error al asignar producto.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEliminar = async (producto) => {
    if (!selectedUser) return;
    setMsg(null);
    setError(null);
    setActionLoading(producto.id_producto);
    try {
      await AsgDashboard_eliminarAsignacionUsuario(selectedUser.id_usuario, producto.id_producto);
      setMsg('Asignación eliminada.');
      const data = await AsgDashboard_obtenerAsignacionesUsuario(selectedUser.id_usuario);
      setAsignaciones(data || []);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Error al eliminar asignación.');
    } finally {
      setActionLoading(null);
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
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.pageTitle}>Asignar Dashboards</h1>
          <p className={styles.pageSubtitle}>Selecciona un usuario y asigna o quita productos (dashboards).</p>
        </div>
        <div>
          <button className={styles.refreshBtn} onClick={() => { cargarUsuarios(); cargarProductos(); }}>
            Recargar
          </button>
        </div>
      </div>

      {loading && <div className={styles.info}>Cargando usuarios...</div>}
      {error && <div className={styles.error}>{error}</div>}
      {msg && <div className={styles.success}>{msg}</div>}

      <section className={styles.usersSection}>
        <h2 className={styles.sectionTitle}>Usuarios de la empresa</h2>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Apellidos</th>
                <th>Correo</th>
                <th>Área</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan="5" className={styles.noData}>No hay usuarios</td>
                </tr>
              ) : usuarios.map(u => (
                <tr key={u.id_usuario}>
                  <td className={styles.cellBold}>{u.nombres}</td>
                  <td>{u.apellidos || '-'}</td>
                  <td className={styles.cellMuted}>{u.correo}</td>
                  <td className={styles.cellMuted}>{u.area || '-'}</td>
                  <td>
                    <button
                      className={styles.primarySmall}
                      onClick={() => abrirAsignar(u)}
                      aria-label={`Asignar dashboards a ${u.nombres}`}
                    >
                      Asignar dashboards
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal / panel lateral de asignaciones */}
      {selectedUser && (
        <div
          className={styles.modalBackdrop}
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            // cerrar si hace click fuera del modal
            if (e.target === e.currentTarget) cerrarModal();
          }}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Asignar dashboards a</h3>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{selectedUser.nombres} {selectedUser.apellidos || ''}</span>
                <span className={styles.userEmail}>{selectedUser.correo}</span>
              </div>
              <button className={styles.closeBtn} onClick={cerrarModal} aria-label="Cerrar">Cerrar</button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.leftColumn}>
                <h4 className={styles.subTitle}>Productos disponibles</h4>
                <div className={styles.scrollArea}>
                  <table className={styles.tableCompact}>
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Área</th>
                        <th>Propietario</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productos.length === 0 && (
                        <tr><td colSpan="4" className={styles.noData}>No hay productos</td></tr>
                      )}
                      {productos.map(p => {
                        const assigned = isAssigned(p.id_producto);
                        const propietario = (p.owned_by && p.owned_by.length) ? p.owned_by.map(o => o.nombre_empresa).join(', ') : 'Público';
                        return (
                          <tr key={p.id_producto}>
                            <td className={styles.cellBold}>{p.producto}</td>
                            <td className={styles.cellMuted}>{p.area || '-'}</td>
                            <td className={styles.cellMuted}>{propietario}</td>
                            <td>
                              <button
                                className={`${styles.smallBtn} ${assigned ? styles.disabledBtn : ''}`}
                                onClick={() => handleAsignar(p)}
                                disabled={assigned || actionLoading === p.id_producto}
                              >
                                {actionLoading === p.id_producto ? 'Procesando...' : (assigned ? 'Asignado' : 'Asignar')}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={styles.rightColumn}>
                <h4 className={styles.subTitle}>Productos asignados</h4>
                <div className={styles.scrollArea}>
                  <table className={styles.tableCompact}>
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Área</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asignaciones.length === 0 ? (
                        <tr><td colSpan="3" className={styles.noData}>No hay asignaciones</td></tr>
                      ) : asignaciones.map(a => {
                        const prod = a.producto || (a.id_producto && productos.find(p => p.id_producto === a.id_producto));
                        if (!prod) return null;
                        return (
                          <tr key={prod.id_producto}>
                            <td className={styles.cellBold}>{prod.producto}</td>
                            <td className={styles.cellMuted}>{prod.area || '-'}</td>
                            <td>
                              <button
                                className={styles.dangerSmall}
                                onClick={() => handleEliminar(prod)}
                                disabled={actionLoading === prod.id_producto}
                              >
                                {actionLoading === prod.id_producto ? 'Procesando...' : 'Quitar'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.secondaryBtn} onClick={cerrarModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AsgDashboardAsignarDashboards;
