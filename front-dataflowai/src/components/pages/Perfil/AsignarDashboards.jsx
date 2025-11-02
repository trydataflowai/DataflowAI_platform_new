// src/components/.../AsgDashboardAsignarDashboards.jsx
import React, { useEffect, useState, useCallback } from 'react';
import styles from '../../../styles/Profile/AsignarDashboard.module.css';
import { useTheme } from "../../componentes/ThemeContext"; // ajusta ruta si es necesario
import {
  AsgDashboard_obtenerUsuariosEmpresa,
  AsgDashboard_obtenerProductos,
  AsgDashboard_obtenerAsignacionesUsuario,
  AsgDashboard_asignarProductoUsuario,
  AsgDashboard_eliminarAsignacionUsuario
} from '../../../api/Profile';

const AsgDashboardAsignarDashboards = () => {
  const { theme } = useTheme();
  const [usuarios, setUsuarios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const [modalType, setModalType] = useState(''); // 'asignar' o 'quitar'
  const [modalLoading, setModalLoading] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      setLoading(true);
      try {
        const [usuariosData, productosData] = await Promise.all([
          AsgDashboard_obtenerUsuariosEmpresa(),
          AsgDashboard_obtenerProductos()
        ]);
        setUsuarios(usuariosData || []);
        setProductos(productosData || []);
      } catch (err) {
        console.error(err);
        setError(err?.message || 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    cargarDatosIniciales();
  }, []);

  // Evita scroll de fondo cuando el modal está abierto
  useEffect(() => {
    if (selectedUser) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedUser]);

  const cargarUsuarios = useCallback(async () => {
    setError(null);
    try {
      const data = await AsgDashboard_obtenerUsuariosEmpresa();
      setUsuarios(data || []);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Error al obtener usuarios');
    }
  }, []);

  const cargarProductos = useCallback(async () => {
    setError(null);
    try {
      const data = await AsgDashboard_obtenerProductos();
      setProductos(data || []);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Error al obtener productos');
    }
  }, []);

  const abrirAsignar = async (usuario) => {
    setSelectedUser(usuario);
    setModalType('asignar');
    setMsg(null);
    setError(null);
    setAsignaciones([]);
    setModalLoading(true);
    try {
      const data = await AsgDashboard_obtenerAsignacionesUsuario(usuario.id_usuario);
      setAsignaciones(data || []);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'No se pudo cargar asignaciones');
    } finally {
      setModalLoading(false);
    }
  };

  const abrirQuitar = async (usuario) => {
    setSelectedUser(usuario);
    setModalType('quitar');
    setMsg(null);
    setError(null);
    setAsignaciones([]);
    setModalLoading(true);
    try {
      const data = await AsgDashboard_obtenerAsignacionesUsuario(usuario.id_usuario);
      setAsignaciones(data || []);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'No se pudo cargar asignaciones');
    } finally {
      setModalLoading(false);
    }
  };

  const cerrarModal = () => {
    setSelectedUser(null);
    setModalType('');
    setAsignaciones([]);
    setMsg(null);
    setError(null);
    setModalLoading(false);
  };

  const handleAsignar = async (producto) => {
    if (!selectedUser) return;
    setMsg(null);
    setError(null);
    setActionLoading(producto.id_producto);
    try {
      await AsgDashboard_asignarProductoUsuario(selectedUser.id_usuario, producto.id_producto);
      setMsg('Dashboard asignado correctamente.');
      const data = await AsgDashboard_obtenerAsignacionesUsuario(selectedUser.id_usuario);
      setAsignaciones(data || []);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Error al asignar dashboard.');
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
      setMsg('Dashboard eliminado correctamente.');
      const data = await AsgDashboard_obtenerAsignacionesUsuario(selectedUser.id_usuario);
      setAsignaciones(data || []);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Error al eliminar dashboard.');
    } finally {
      setActionLoading(null);
    }
  };

  const isAssigned = useCallback((productoId) => {
    return asignaciones.some(a => {
      if (a.producto && a.producto.id_producto) return a.producto.id_producto === productoId;
      if (a.id_producto) return a.id_producto === productoId;
      return false;
    });
  }, [asignaciones]);

  const recargarTodo = useCallback(() => {
    setError(null);
    setMsg(null);
    Promise.all([cargarUsuarios(), cargarProductos()]);
  }, [cargarUsuarios, cargarProductos]);

  // clase variante (light/dark) aplicada al contenedor principal
  const variantClass = theme === 'light' ? styles.asignardashboardLight : styles.asignardashboardDark;

  return (
    <div className={`${styles.asignardashboardcontainer} ${variantClass}`}>
      <div className={styles.asignardashboardheaderRow}>
        <div>
          <h1 className={styles.asignardashboardpageTitle}>Asignar Dashboards</h1>
          <p className={styles.asignardashboardpageSubtitle}>Selecciona un usuario y asigna o quita dashboards.</p>
        </div>
        <div>
          <button className={styles.asignardashboardrefreshBtn} onClick={recargarTodo}>
            Recargar
          </button>
        </div>
      </div>

      {loading && <div className={styles.asignardashboardinfo}>Cargando datos...</div>}
      {error && <div className={styles.asignardashboarderror}>{error}</div>}
      {msg && <div className={styles.asignardashboardsuccess}>{msg}</div>}

      <section className={styles.asignardashboardusersSection}>
        <h2 className={styles.asignardashboardsectionTitle}>Usuarios de la empresa</h2>

        <div className={styles.asignardashboardtableWrapper}>
          <table className={styles.asignardashboardtable}>
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>Área</th>
                <th>Asignar Dashboard</th>
                <th>Quitar Dashboard</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 && !loading ? (
                <tr>
                  <td colSpan="4" className={styles.asignardashboardnoData}>No hay usuarios registrados</td>
                </tr>
              ) : usuarios.map(u => (
                <tr key={u.id_usuario} className={styles.asignardashboardtableRow}>
                  <td className={styles.asignardashboardcellBold}>{u.nombres} {u.apellidos || ''}</td>
                  <td className={styles.asignardashboardcellMuted}>{u.area || '-'}</td>
                  <td>
                    <button
                      className={styles.asignardashboardprimarySmall}
                      onClick={() => abrirAsignar(u)}
                      aria-label={`Asignar dashboards a ${u.nombres}`}
                    >
                      Asignar
                    </button>
                  </td>
                  <td>
                    <button
                      className={styles.asignardashboarddangerSmall}
                      onClick={() => abrirQuitar(u)}
                      aria-label={`Quitar dashboards a ${u.nombres}`}
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal para Asignar Dashboards */}
      {selectedUser && modalType === 'asignar' && (
        <div
          className={styles.asignardashboardmodalBackdrop}
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) cerrarModal();
          }}
        >
          <div className={styles.asignardashboardmodalAsignar} onClick={(e) => e.stopPropagation()}>
            <div className={styles.asignardashboardmodalHeader}>
              <div className={styles.asignardashboardmodalTitle}>
                <h3>Asignar Dashboards</h3>
                <div className={styles.asignardashboarduserInfo}>
                  <span className={styles.asignardashboarduserName}>{selectedUser.nombres} {selectedUser.apellidos || ''}</span>
                  <span className={styles.asignardashboarduserEmail}>{selectedUser.correo}</span>
                </div>
              </div>
              <button className={styles.asignardashboardcloseBtn} onClick={cerrarModal} aria-label="Cerrar">
                ×
              </button>
            </div>

            <div className={styles.asignardashboardmodalBody}>
              <div className={styles.asignardashboardfullColumn}>
                <h4 className={styles.asignardashboardsubTitle}>Dashboards Disponibles para Asignar</h4>
                <div className={styles.asignardashboardscrollArea}>
                  {modalLoading ? (
                    <div className={styles.asignardashboardloadingData}>Cargando dashboards...</div>
                  ) : (
                    <div className={styles.asignardashboardtableContainer}>
                      <table className={styles.asignardashboardtableCompact}>
                        <thead>
                          <tr className={styles.asignardashboardtableHeaderRow}>
                            <th>Dashboard</th>
                            <th>Área</th>
                            <th>Propietario</th>
                            <th>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productos.length === 0 ? (
                            <tr><td colSpan="4" className={styles.asignardashboardnoData}>No hay dashboards disponibles</td></tr>
                          ) : productos.map(p => {
                            const assigned = isAssigned(p.id_producto);
                            const propietario = (p.owned_by && p.owned_by.length) ? p.owned_by.map(o => o.nombre_empresa).join(', ') : 'Público';
                            return (
                              <tr key={p.id_producto} className={styles.asignardashboardmodalTableRow}>
                                <td className={styles.asignardashboardcellBold}>{p.producto}</td>
                                <td className={styles.asignardashboardcellMuted}>{p.area || '-'}</td>
                                <td className={styles.asignardashboardcellMuted}>{propietario}</td>
                                <td>
                                  <button
                                    className={`${styles.asignardashboardsmallBtn} ${assigned ? styles.asignardashboarddisabledBtn : ''}`}
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
                  )}
                </div>
              </div>
            </div>

            <div className={styles.asignardashboardmodalFooter}>
              <button className={styles.asignardashboardsecondaryBtn} onClick={cerrarModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Quitar Dashboards */}
      {selectedUser && modalType === 'quitar' && (
        <div
          className={styles.asignardashboardmodalBackdrop}
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) cerrarModal();
          }}
        >
          <div className={styles.asignardashboardmodalQuitar} onClick={(e) => e.stopPropagation()}>
            <div className={styles.asignardashboardmodalHeader}>
              <div className={styles.asignardashboardmodalTitle}>
                <h3>Quitar Dashboards</h3>
                <div className={styles.asignardashboarduserInfo}>
                  <span className={styles.asignardashboarduserName}>{selectedUser.nombres} {selectedUser.apellidos || ''}</span>
                  <span className={styles.asignardashboarduserEmail}>{selectedUser.correo}</span>
                </div>
              </div>
              <button className={styles.asignardashboardcloseBtn} onClick={cerrarModal} aria-label="Cerrar">
                ×
              </button>
            </div>

            <div className={styles.asignardashboardmodalBody}>
              <div className={styles.asignardashboardfullColumn}>
                <h4 className={styles.asignardashboardsubTitle}>Dashboards Actualmente Asignados</h4>
                <div className={styles.asignardashboardscrollArea}>
                  {modalLoading ? (
                    <div className={styles.asignardashboardloadingData}>Cargando asignaciones...</div>
                  ) : (
                    <div className={styles.asignardashboardtableContainer}>
                      <table className={styles.asignardashboardtableCompact}>
                        <thead>
                          <tr className={styles.asignardashboardtableHeaderRow}>
                            <th>Dashboard</th>
                            <th>Área</th>
                            <th>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {asignaciones.length === 0 ? (
                            <tr><td colSpan="3" className={styles.asignardashboardnoData}>No hay dashboards asignados</td></tr>
                          ) : asignaciones.map(a => {
                            const prod = a.producto || (a.id_producto && productos.find(p => p.id_producto === a.id_producto));
                            if (!prod) return null;
                            return (
                              <tr key={prod.id_producto} className={styles.asignardashboardmodalTableRow}>
                                <td className={styles.asignardashboardcellBold}>{prod.producto}</td>
                                <td className={styles.asignardashboardcellMuted}>{prod.area || '-'}</td>
                                <td>
                                  <button
                                    className={styles.asignardashboarddangerSmall}
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
                  )}
                </div>
              </div>
            </div>

            <div className={styles.asignardashboardmodalFooter}>
              <button className={styles.asignardashboardsecondaryBtn} onClick={cerrarModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AsgDashboardAsignarDashboards;
