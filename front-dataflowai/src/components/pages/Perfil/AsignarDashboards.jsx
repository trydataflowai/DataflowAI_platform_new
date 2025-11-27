// src/components/.../AsgDashboardAsignarDashboards.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useTheme } from "../../componentes/ThemeContext";
import {
  AsgDashboard_obtenerUsuariosEmpresa,
  AsgDashboard_obtenerProductos,
  AsgDashboard_obtenerAsignacionesUsuario,
  AsgDashboard_asignarProductoUsuario,
  AsgDashboard_eliminarAsignacionUsuario
} from '../../../api/Profile';
import { obtenerInfoUsuario } from '../../../api/Usuario';

// Importar estilos por defecto (fallback)
import defaultStyles from '../../../styles/Profile/AsignarDashboard.module.css';

// Función para cargar los estilos dinámicamente (no bloqueante)
const cargarEstilosEmpresa = async (empresaId, planId) => {
  const planesEspeciales = [3, 6]; // Planes que usan estilos personalizados

  try {
    if (planesEspeciales.includes(planId) && empresaId) {
      try {
        const estilosEmpresa = await import(`../../../styles/empresas/${empresaId}/AsignarDashboard.module.css`);
        return estilosEmpresa.default || defaultStyles;
      } catch (err) {
        console.warn(`No se encontraron estilos personalizados para empresa ${empresaId}, usando estilos por defecto`);
      }
    }
    return defaultStyles;
  } catch (err) {
    console.error('Error cargando estilos:', err);
    return defaultStyles;
  }
};

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

  // iniciar con defaultStyles para evitar flash y tener clases disponibles
  const [styles, setStyles] = useState(defaultStyles);

  // Cargar estilos en background (no bloqueante) y datos iniciales
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const usuarioInfo = await obtenerInfoUsuario().catch(() => null);
        const empresaId = usuarioInfo?.empresa?.id;
        const planId = usuarioInfo?.empresa?.plan?.id;
        cargarEstilosEmpresa(empresaId, planId)
          .then((estilos) => {
            if (!mounted) return;
            if (estilos) setStyles(estilos);
          })
          .catch(() => {
            if (mounted) setStyles(defaultStyles);
          });
      } catch (err) {
        if (mounted) setStyles(defaultStyles);
      }
    })();

    // cargar datos sin esperar estilos
    cargarUsuarios();
    cargarProductos();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Evita scroll de fondo cuando el modal está abierto
  useEffect(() => {
    if (selectedUser) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev || 'unset';
      };
    }
    return undefined;
  }, [selectedUser]);

  const cargarUsuarios = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await AsgDashboard_obtenerUsuariosEmpresa();
      setUsuarios(data || []);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Error al obtener usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarProductos = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await AsgDashboard_obtenerProductos();
      setProductos(data || []);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Error al obtener productos');
    } finally {
      setLoading(false);
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

  // --- FIX: elegir la variante siempre en base al theme con fallback defensivo
  const variantClass = theme === 'dark'
    ? (styles?.AsignardashboardDark || defaultStyles.AsignardashboardDark || '')
    : (styles?.AsignardashboardLight || defaultStyles.AsignardashboardLight || '');

  return (
    <main className={`${styles.Asignardashboardcontainer} ${variantClass}`} aria-labelledby="asignar-dashboards-title">
      
      {/* Header Section */}
      <section className={styles.Asignardashboardheader}>
        <div className={styles.AsignardashboardheaderContent}>
          <h1 id="asignar-dashboards-title" className={styles.Asignardashboardtitle}>
            Asignar Dashboards
          </h1>
          <p className={styles.Asignardashboardsubtitle}>
            Gestiona los dashboards asignados a los usuarios de tu empresa
          </p>
        </div>
        <div className={styles.AsignardashboardheaderMeta}>
          <button 
            className={styles.AsignardashboardrefreshButton}
            onClick={recargarTodo}
            aria-label="Recargar datos"
          >
            Actualizar
          </button>
        </div>
      </section>

      {/* Alert Messages */}
      {error && (
        <div className={styles.AsignardashboarderrorBox} role="alert">
          <div className={styles.AsignardashboarderrorIcon}>⚠️</div>
          <div className={styles.AsignardashboarderrorText}>{error}</div>
        </div>
      )}
      
      {msg && (
        <div className={styles.AsignardashboardsuccessBox} role="status">
          <div className={styles.AsignardashboardsuccessIcon}>✅</div>
          <div className={styles.AsignardashboardsuccessText}>{msg}</div>
        </div>
      )}

      {/* Users Section */}
      <section className={styles.AsignardashboardusersSection}>
        <div className={styles.AsignardashboardsectionHeader}>
          <h2 className={styles.AsignardashboardsectionTitle}>Usuarios de la Empresa</h2>
          <p className={styles.AsignardashboardsectionSubtitle}>
            {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} registrado{usuarios.length !== 1 ? 's' : ''}
          </p>
        </div>

        {loading ? (
          <div className={styles.Asignardashboardloading}>
            <div className={styles.AsignardashboardloadingSpinner}></div>
            <span>Cargando usuarios...</span>
          </div>
        ) : (
          <div className={styles.AsignardashboardtableWrapper}>
            <table className={styles.Asignardashboardtable}>
              <thead>
                <tr>
                  <th className={styles.AsignardashboardtableHeader}>Usuario</th>
                  <th className={styles.AsignardashboardtableHeader}>Área</th>
                  <th className={styles.AsignardashboardtableHeader}>Asignar Dashboard</th>
                  <th className={styles.AsignardashboardtableHeader}>Quitar Dashboard</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length === 0 ? (
                  <tr>
                    <td colSpan="4" className={styles.AsignardashboardemptyState}>
                      <div className={styles.AsignardashboardemptyContent}>
                        <span className={styles.AsignardashboardemptyIcon}>👥</span>
                        <p>No hay usuarios registrados</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  usuarios.map(usuario => (
                    <tr key={usuario.id_usuario} className={styles.AsignardashboardtableRow}>
                      <td className={styles.AsignardashboardcellUser}>
                        <div className={styles.AsignardashboarduserInfo}>
                          <span className={styles.AsignardashboarduserName}>
                            {usuario.nombres} {usuario.apellidos || ''}
                          </span>
                          <span className={styles.AsignardashboarduserEmail}>{usuario.correo}</span>
                        </div>
                      </td>
                      <td className={styles.AsignardashboardcellArea}>{usuario.area || '-'}</td>
                      <td className={styles.AsignardashboardcellActions}>
                        <button
                          className={styles.AsignardashboardprimaryButton}
                          onClick={() => abrirAsignar(usuario)}
                          aria-label={`Asignar dashboards a ${usuario.nombres}`}
                        >
                          Asignar
                        </button>
                      </td>
                      <td className={styles.AsignardashboardcellActions}>
                        <button
                          className={styles.AsignardashboardsecondaryButton}
                          onClick={() => abrirQuitar(usuario)}
                          aria-label={`Quitar dashboards a ${usuario.nombres}`}
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal para Asignar Dashboards */}
      {selectedUser && modalType === 'asignar' && (
        <div
          className={styles.AsignardashboardmodalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-asignar-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) cerrarModal();
          }}
        >
          <div className={styles.Asignardashboardmodal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.AsignardashboardmodalHeader}>
              <div className={styles.AsignardashboardmodalTitle}>
                <h2 id="modal-asignar-title">Asignar Dashboards</h2>
                <div className={styles.AsignardashboarduserInfo}>
                  <span className={styles.AsignardashboarduserName}>{selectedUser.nombres} {selectedUser.apellidos || ''}</span>
                  <span className={styles.AsignardashboarduserEmail}>{selectedUser.correo}</span>
                </div>
              </div>
              <button 
                className={styles.AsignardashboardcloseButton}
                onClick={cerrarModal}
                aria-label="Cerrar modal"
              >
                ×
              </button>
            </div>

            <div className={styles.AsignardashboardmodalBody}>
              <div className={styles.AsignardashboardmodalSection}>
                <h3 className={styles.AsignardashboardmodalSubtitle}>Dashboards Disponibles</h3>
                
                {modalLoading ? (
                  <div className={styles.Asignardashboardloading}>
                    <div className={styles.AsignardashboardloadingSpinner}></div>
                    <span>Cargando dashboards disponibles...</span>
                  </div>
                ) : (
                  <div className={styles.AsignardashboardtableContainer}>
                    <table className={styles.AsignardashboardmodalTable}>
                      <thead>
                        <tr>
                          <th className={styles.AsignardashboardtableHeader}>Dashboard</th>
                          <th className={styles.AsignardashboardtableHeader}>Área</th>
                          <th className={styles.AsignardashboardtableHeader}>Propietario</th>
                          <th className={styles.AsignardashboardtableHeader}>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productos.length === 0 ? (
                          <tr>
                            <td colSpan="4" className={styles.AsignardashboardemptyState}>
                              No hay dashboards disponibles
                            </td>
                          </tr>
                        ) : (
                          productos.map(producto => {
                            const assigned = isAssigned(producto.id_producto);
                            const propietario = (producto.owned_by && producto.owned_by.length) 
                              ? producto.owned_by.map(o => o.nombre_empresa).join(', ') 
                              : 'Público';
                            
                            return (
                              <tr key={producto.id_producto} className={styles.AsignardashboardmodalTableRow}>
                                <td className={styles.AsignardashboardcellName}>{producto.producto}</td>
                                <td className={styles.AsignardashboardcellArea}>{producto.area || '-'}</td>
                                <td className={styles.AsignardashboardcellOwner}>{propietario}</td>
                                <td className={styles.AsignardashboardcellActions}>
                                  <button
                                    className={`${styles.AsignardashboardactionButton} ${assigned ? styles.AsignardashboardactionButtonDisabled : ''}`}
                                    onClick={() => handleAsignar(producto)}
                                    disabled={assigned || actionLoading === producto.id_producto}
                                    aria-label={`${assigned ? 'Ya asignado' : 'Asignar'} dashboard ${producto.producto}`}
                                  >
                                    {actionLoading === producto.id_producto ? (
                                      <>
                                        <span className={styles.AsignardashboardbuttonSpinner}></span>
                                        Procesando...
                                      </>
                                    ) : assigned ? (
                                      'Asignado'
                                    ) : (
                                      'Asignar'
                                    )}
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.AsignardashboardmodalFooter}>
              <button 
                className={styles.AsignardashboardcloseModalButton}
                onClick={cerrarModal}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Quitar Dashboards */}
      {selectedUser && modalType === 'quitar' && (
        <div
          className={styles.AsignardashboardmodalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-quitar-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) cerrarModal();
          }}
        >
          <div className={styles.Asignardashboardmodal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.AsignardashboardmodalHeader}>
              <div className={styles.AsignardashboardmodalTitle}>
                <h2 id="modal-quitar-title">Quitar Dashboards</h2>
                <div className={styles.AsignardashboarduserInfo}>
                  <span className={styles.AsignardashboarduserName}>{selectedUser.nombres} {selectedUser.apellidos || ''}</span>
                  <span className={styles.AsignardashboarduserEmail}>{selectedUser.correo}</span>
                </div>
              </div>
              <button 
                className={styles.AsignardashboardcloseButton}
                onClick={cerrarModal}
                aria-label="Cerrar modal"
              >
                ×
              </button>
            </div>

            <div className={styles.AsignardashboardmodalBody}>
              <div className={styles.AsignardashboardmodalSection}>
                <h3 className={styles.AsignardashboardmodalSubtitle}>Dashboards Asignados</h3>
                
                {modalLoading ? (
                  <div className={styles.Asignardashboardloading}>
                    <div className={styles.AsignardashboardloadingSpinner}></div>
                    <span>Cargando dashboards asignados...</span>
                  </div>
                ) : (
                  <div className={styles.AsignardashboardtableContainer}>
                    <table className={styles.AsignardashboardmodalTable}>
                      <thead>
                        <tr>
                          <th className={styles.AsignardashboardtableHeader}>Dashboard</th>
                          <th className={styles.AsignardashboardtableHeader}>Área</th>
                          <th className={styles.AsignardashboardtableHeader}>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {asignaciones.length === 0 ? (
                          <tr>
                            <td colSpan="3" className={styles.AsignardashboardemptyState}>
                              No hay dashboards asignados
                            </td>
                          </tr>
                        ) : (
                          asignaciones.map(asignacion => {
                            const producto = asignacion.producto || (asignacion.id_producto && productos.find(p => p.id_producto === asignacion.id_producto));
                            if (!producto) return null;
                            
                            return (
                              <tr key={producto.id_producto} className={styles.AsignardashboardmodalTableRow}>
                                <td className={styles.AsignardashboardcellName}>{producto.producto}</td>
                                <td className={styles.AsignardashboardcellArea}>{producto.area || '-'}</td>
                                <td className={styles.AsignardashboardcellActions}>
                                  <button
                                    className={styles.AsignardashboarddangerButton}
                                    onClick={() => handleEliminar(producto)}
                                    disabled={actionLoading === producto.id_producto}
                                    aria-label={`Quitar dashboard ${producto.producto}`}
                                  >
                                    {actionLoading === producto.id_producto ? (
                                      <>
                                        <span className={styles.AsignardashboardbuttonSpinner}></span>
                                        Procesando...
                                      </>
                                    ) : (
                                      'Quitar'
                                    )}
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.AsignardashboardmodalFooter}>
              <button 
                className={styles.AsignardashboardcloseModalButton}
                onClick={cerrarModal}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default AsgDashboardAsignarDashboards;
