// src/components/.../AsgDashboardAsignarDashboards.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useTheme } from "../../componentes/ThemeContext";
import { useCompanyStyles } from '../../componentes/ThemeContextEmpresa';
import {
  AsgDashboard_obtenerUsuariosEmpresa,
  AsgDashboard_obtenerProductos,
  AsgDashboard_obtenerAsignacionesUsuario,
  AsgDashboard_asignarProductoUsuario,
  AsgDashboard_eliminarAsignacionUsuario
} from '../../../api/Profile';
import { obtenerInfoUsuario } from '../../../api/Usuario'; // si lo usas en otras partes, lo dejamos

// Importar estilos por defecto (fallback)
import defaultStyles from '../../../styles/Profile/AsignarDashboard.module.css';

const AsgDashboardAsignarDashboards = () => {
  const { theme } = useTheme();

  // Obtener estilos (empresa o default) desde CompanyStylesProvider (evita parpadeo)
  const styles = useCompanyStyles('AsignarDashboard', defaultStyles);

  const [usuarios, setUsuarios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const [modalType, setModalType] = useState(''); // 'asignar' or 'quitar'
  const [modalLoading, setModalLoading] = useState(false);

  // Helper defensivo para clases (devuelve clase del styles o fallback)
  const C = (cls) => (styles && styles[cls]) || (defaultStyles && defaultStyles[cls]) || '';

  // Cargar datos iniciales (no bloqueamos por estilos)
  useEffect(() => {
    cargarUsuarios();
    cargarProductos();
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
      const resp = await AsgDashboard_asignarProductoUsuario(selectedUser.id_usuario, producto.id_producto);
      // Resp contiene el detalle y _dashboard_context
      if (resp && resp._dashboard_context) {
        const created = resp._dashboard_context.created;
        if (created) {
          setMsg('Dashboard asignado y contexto guardado para la empresa.');
        } else {
          setMsg('Dashboard asignado (contexto ya existía).');
        }
      } else {
        setMsg('Dashboard asignado correctamente.');
      }

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

  // Variante basada en theme (evita fallback oscuro mientras se resuelve styles)
  const variantClass = theme === 'dark'
    ? (styles?.AsignardashboardDark || defaultStyles.AsignardashboardDark || '')
    : (styles?.AsignardashboardLight || defaultStyles.AsignardashboardLight || '');

  return (
    <main className={`${C('Asignardashboardcontainer')} ${variantClass}`} aria-labelledby="asignar-dashboards-title">
      
      {/* Header Section */}
      <section className={C('Asignardashboardheader')}>
        <div className={C('AsignardashboardheaderContent')}>
          <h1 id="asignar-dashboards-title" className={C('Asignardashboardtitle')}>
            Asignar Dashboards
          </h1>
          <p className={C('Asignardashboardsubtitle')}>
            Gestiona los dashboards asignados a los usuarios de tu empresa
          </p>
        </div>
        <div className={C('AsignardashboardheaderMeta')}>
          <button 
            className={C('AsignardashboardrefreshButton')}
            onClick={recargarTodo}
            aria-label="Recargar datos"
          >
            Actualizar
          </button>
        </div>
      </section>

      {/* Alert Messages */}
      {error && (
        <div className={C('AsignardashboarderrorBox')} role="alert">
          <div className={C('AsignardashboarderrorIcon')}>⚠️</div>
          <div className={C('AsignardashboarderrorText')}>{error}</div>
        </div>
      )}
      
      {msg && (
        <div className={C('AsignardashboardsuccessBox')} role="status">
          <div className={C('AsignardashboardsuccessIcon')}>✅</div>
          <div className={C('AsignardashboardsuccessText')}>{msg}</div>
        </div>
      )}

      {/* Users Section */}
      <section className={C('AsignardashboardusersSection')}>
        <div className={C('AsignardashboardsectionHeader')}>
          <h2 className={C('AsignardashboardsectionTitle')}>Usuarios de la Empresa</h2>
          <p className={C('AsignardashboardsectionSubtitle')}>
            {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} registrado{usuarios.length !== 1 ? 's' : ''}
          </p>
        </div>

        {loading ? (
          <div className={C('Asignardashboardloading')}>
            <div className={C('AsignardashboardloadingSpinner')}></div>
            <span>Cargando usuarios...</span>
          </div>
        ) : (
          <div className={C('AsignardashboardtableWrapper')}>
            <table className={C('Asignardashboardtable')}>
              <thead>
                <tr>
                  <th className={C('AsignardashboardtableHeader')}>Usuario</th>
                  <th className={C('AsignardashboardtableHeader')}>Área</th>
                  <th className={C('AsignardashboardtableHeader')}>Asignar Dashboard</th>
                  <th className={C('AsignardashboardtableHeader')}>Quitar Dashboard</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length === 0 ? (
                  <tr>
                    <td colSpan="4" className={C('AsignardashboardemptyState')}>
                      <div className={C('AsignardashboardemptyContent')}>
                        <span className={C('AsignardashboardemptyIcon')}>👥</span>
                        <p>No hay usuarios registrados</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  usuarios.map(usuario => (
                    <tr key={usuario.id_usuario} className={C('AsignardashboardtableRow')}>
                      <td className={C('AsignardashboardcellUser')}>
                        <div className={C('AsignardashboarduserInfo')}>
                          <span className={C('AsignardashboarduserName')}>
                            {usuario.nombres} {usuario.apellidos || ''}
                          </span>
                          <span className={C('AsignardashboarduserEmail')}>{usuario.correo}</span>
                        </div>
                      </td>
                      <td className={C('AsignardashboardcellArea')}>{usuario.area || '-'}</td>
                      <td className={C('AsignardashboardcellActions')}>
                        <button
                          className={C('AsignardashboardprimaryButton')}
                          onClick={() => abrirAsignar(usuario)}
                          aria-label={`Asignar dashboards a ${usuario.nombres}`}
                        >
                          Asignar
                        </button>
                      </td>
                      <td className={C('AsignardashboardcellActions')}>
                        <button
                          className={C('AsignardashboardsecondaryButton')}
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
          className={C('AsignardashboardmodalOverlay')}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-asignar-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) cerrarModal();
          }}
        >
          <div className={C('Asignardashboardmodal')} onClick={(e) => e.stopPropagation()}>
            <div className={C('AsignardashboardmodalHeader')}>
              <div className={C('AsignardashboardmodalTitle')}>
                <h2 id="modal-asignar-title">Asignar Dashboards</h2>
                <div className={C('AsignardashboarduserInfo')}>
                  <span className={C('AsignardashboarduserName')}>{selectedUser.nombres} {selectedUser.apellidos || ''}</span>
                  <span className={C('AsignardashboarduserEmail')}>{selectedUser.correo}</span>
                </div>
              </div>
              <button 
                className={C('AsignardashboardcloseButton')}
                onClick={cerrarModal}
                aria-label="Cerrar modal"
              >
                ×
              </button>
            </div>

            <div className={C('AsignardashboardmodalBody')}>
              <div className={C('AsignardashboardmodalSection')}>
                <h3 className={C('AsignardashboardmodalSubtitle')}>Dashboards Disponibles</h3>
                
                {modalLoading ? (
                  <div className={C('Asignardashboardloading')}>
                    <div className={C('AsignardashboardloadingSpinner')}></div>
                    <span>Cargando dashboards disponibles...</span>
                  </div>
                ) : (
                  <div className={C('AsignardashboardtableContainer')}>
                    <table className={C('AsignardashboardmodalTable')}>
                      <thead>
                        <tr>
                          <th className={C('AsignardashboardtableHeader')}>Dashboard</th>
                          <th className={C('AsignardashboardtableHeader')}>Área</th>
                          <th className={C('AsignardashboardtableHeader')}>Propietario</th>
                          <th className={C('AsignardashboardtableHeader')}>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productos.length === 0 ? (
                          <tr>
                            <td colSpan="4" className={C('AsignardashboardemptyState')}>
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
                              <tr key={producto.id_producto} className={C('AsignardashboardmodalTableRow')}>
                                <td className={C('AsignardashboardcellName')}>{producto.producto}</td>
                                <td className={C('AsignardashboardcellArea')}>{producto.area || '-'}</td>
                                <td className={C('AsignardashboardcellOwner')}>{propietario}</td>
                                <td className={C('AsignardashboardcellActions')}>
                                  <button
                                    className={`${C('AsignardashboardactionButton')} ${assigned ? C('AsignardashboardactionButtonDisabled') : ''}`}
                                    onClick={() => handleAsignar(producto)}
                                    disabled={assigned || actionLoading === producto.id_producto}
                                    aria-label={`${assigned ? 'Ya asignado' : 'Asignar'} dashboard ${producto.producto}`}
                                  >
                                    {actionLoading === producto.id_producto ? (
                                      <span className={C('AsignardashboardbuttonSpinner')}></span>
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

            <div className={C('AsignardashboardmodalFooter')}>
              <button 
                className={C('AsignardashboardcloseModalButton')}
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
          className={C('AsignardashboardmodalOverlay')}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-quitar-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) cerrarModal();
          }}
        >
          <div className={C('Asignardashboardmodal')} onClick={(e) => e.stopPropagation()}>
            <div className={C('AsignardashboardmodalHeader')}>
              <div className={C('AsignardashboardmodalTitle')}>
                <h2 id="modal-quitar-title">Quitar Dashboards</h2>
                <div className={C('AsignardashboarduserInfo')}>
                  <span className={C('AsignardashboarduserName')}>{selectedUser.nombres} {selectedUser.apellidos || ''}</span>
                  <span className={C('AsignardashboarduserEmail')}>{selectedUser.correo}</span>
                </div>
              </div>
              <button 
                className={C('AsignardashboardcloseButton')}
                onClick={cerrarModal}
                aria-label="Cerrar modal"
              >
                ×
              </button>
            </div>

            <div className={C('AsignardashboardmodalBody')}>
              <div className={C('AsignardashboardmodalSection')}>
                <h3 className={C('AsignardashboardmodalSubtitle')}>Dashboards Asignados</h3>
                
                {modalLoading ? (
                  <div className={C('Asignardashboardloading')}>
                    <div className={C('AsignardashboardloadingSpinner')}></div>
                    <span>Cargando dashboards asignados...</span>
                  </div>
                ) : (
                  <div className={C('AsignardashboardtableContainer')}>
                    <table className={C('AsignardashboardmodalTable')}>
                      <thead>
                        <tr>
                          <th className={C('AsignardashboardtableHeader')}>Dashboard</th>
                          <th className={C('AsignardashboardtableHeader')}>Área</th>
                          <th className={C('AsignardashboardtableHeader')}>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {asignaciones.length === 0 ? (
                          <tr>
                            <td colSpan="3" className={C('AsignardashboardemptyState')}>
                              No hay dashboards asignados
                            </td>
                          </tr>
                        ) : (
                          asignaciones.map(asignacion => {
                            const producto = asignacion.producto || (asignacion.id_producto && productos.find(p => p.id_producto === asignacion.id_producto));
                            if (!producto) return null;
                            
                            return (
                              <tr key={producto.id_producto} className={C('AsignardashboardmodalTableRow')}>
                                <td className={C('AsignardashboardcellName')}>{producto.producto}</td>
                                <td className={C('AsignardashboardcellArea')}>{producto.area || '-'}</td>
                                <td className={C('AsignardashboardcellActions')}>
                                  <button
                                    className={C('AsignardashboarddangerButton')}
                                    onClick={() => handleEliminar(producto)}
                                    disabled={actionLoading === producto.id_producto}
                                    aria-label={`Quitar dashboard ${producto.producto}`}
                                  >
                                    {actionLoading === producto.id_producto ? (
                                      <span className={C('AsignardashboardbuttonSpinner')}></span>
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

            <div className={C('AsignardashboardmodalFooter')}>
              <button 
                className={C('AsignardashboardcloseModalButton')}
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
