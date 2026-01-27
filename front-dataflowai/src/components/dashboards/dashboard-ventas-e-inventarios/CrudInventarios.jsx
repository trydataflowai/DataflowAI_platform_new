import React, { useEffect, useState } from 'react';
import styles from '../../../styles/Dashboards/dashboard-ventas-e-inventarios/crudInventario.module.css';
import {
  fetchDashVeinteInventarios,
  fetchDashVeinteInventario,
  createDashVeinteInventario,
  updateDashVeinteInventario,
  deleteDashVeinteInventario,
  fetchTiendasForSelect,
  fetchProductosForSelect,
} from '../../../api/DashboardsApis/dashboard-ventas-e-inventarios/DashboardApiCrudInventarios';

const emptyForm = {
  id_tienda: '',
  id_producto: '',
  inventario_cantidad: '',
};

const DashboardVentaseInventariosCrudInventarios = () => {
  const [inventarios, setInventarios] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [productos, setProductos] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [search, setSearch] = useState('');
  const [refreshFlag, setRefreshFlag] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {};
        if (search && search.trim()) params.search = search.trim();
        const data = await fetchDashVeinteInventarios(params);
        setInventarios(Array.isArray(data) ? data : (data.results || []));
      } catch (err) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search, refreshFlag]);

  useEffect(() => {
    const loadSelects = async () => {
      try {
        const [t, p] = await Promise.all([fetchTiendasForSelect(), fetchProductosForSelect()]);
        setTiendas(Array.isArray(t) ? t : (t.results || []));
        setProductos(Array.isArray(p) ? p : (p.results || []));
      } catch (err) {
        console.warn('No se pudieron cargar tiendas/productos:', err);
      }
    };
    loadSelects();
  }, []);

  const openCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashVeinteInventario(id);
      setForm({
        id_tienda: data.id_tienda ?? '',
        id_producto: data.id_producto ?? '',
        inventario_cantidad: data.inventario_cantidad ?? '',
      });
      setIsEditing(true);
      setEditingId(id);
      setShowModal(true);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar registro de inventario?')) return;
    setLoading(true);
    setError(null);
    try {
      await deleteDashVeinteInventario(id);
      setRefreshFlag(f => f + 1);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!form.id_tienda || !form.id_producto) {
      setError('Seleccione tienda y producto');
      setLoading(false);
      return;
    }
    if (form.inventario_cantidad === '' || isNaN(Number(form.inventario_cantidad))) {
      setError('Cantidad de inventario inválida');
      setLoading(false);
      return;
    }

    const payload = {
      id_tienda: Number(form.id_tienda),
      id_producto: Number(form.id_producto),
      inventario_cantidad: Number(form.inventario_cantidad),
    };

    try {
      if (isEditing && editingId) {
        await updateDashVeinteInventario(editingId, payload);
        alert('Inventario actualizado');
      } else {
        await createDashVeinteInventario(payload);
        alert('Inventario creada');
      }
      setShowModal(false);
      setRefreshFlag(f => f + 1);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <main className={`${styles.container} ${styles.CrudInventariosLight}`}>
      {/* Header Section */}
      <section className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>CRUD Inventarios</h1>
          <p className={styles.subtitle}>Gestión de niveles de inventario por tienda</p>
        </div>
      </section>

      {/* Filtros Section */}
      <section className={styles.filtersSection}>
        <div className={styles.filtersContainer}>
          <div className={styles.searchGroup}>
            <div className={styles.searchInputWrapper}>
              <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M11.3333 11.3333L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <input
                type="text"
                placeholder="Buscar por tienda, producto o cantidad..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          <div className={styles.actionsGroup}>
            <button 
              onClick={() => setRefreshFlag(f => f + 1)} 
              className={styles.btnSecondary}
            >
              <svg className={styles.btnIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13.5 8C13.5 11.0376 11.0376 13.5 8 13.5C4.96243 13.5 2.5 11.0376 2.5 8C2.5 4.96243 4.96243 2.5 8 2.5C10.1579 2.5 12.0379 3.73188 13 5.5M13.5 2.5V5.5H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Refrescar
            </button>
            <button onClick={openCreate} className={styles.btnPrimary}>
              <svg className={styles.btnIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3.5V12.5M12.5 8H3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Nuevo Inventario
            </button>
          </div>
        </div>
      </section>

      {/* Statistics Section - MOVIDO ARRIBA DE LA TABLA */}
      {inventarios.length > 0 && (
        <section className={styles.statsSectionTop}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3 3V21H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 14L11 10L15 13L21 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>
                  {inventarios.reduce((sum, inv) => sum + (parseInt(inv.inventario_cantidad) || 0), 0).toLocaleString()}
                </div>
                <div className={styles.statLabel}>Total unidades</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6H21M3 12H21M3 18H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>
                  {[...new Set(inventarios.map(inv => inv.id_tienda))].length}
                </div>
                <div className={styles.statLabel}>Tiendas con stock</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 17L15 11M9 11L15 17M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>
                  {inventarios.filter(inv => parseInt(inv.inventario_cantidad) <= 0).length}
                </div>
                <div className={styles.statLabel}>Productos agotados</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>
                  {inventarios.filter(inv => parseInt(inv.inventario_cantidad) <= 5 && parseInt(inv.inventario_cantidad) > 0).length}
                </div>
                <div className={styles.statLabel}>Bajo stock</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className={styles.contentSection}>
        <div className={styles.contentContainer}>
          {/* Loading State */}
          {loading && (
            <div className={styles.loadingState}>
              <div className={styles.loadingSpinner}></div>
              <p className={styles.loadingText}>Cargando inventarios...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className={styles.errorState}>
              <div className={styles.errorIcon}>!</div>
              <p className={styles.errorText}>{error}</p>
              <button 
                onClick={() => setError(null)} 
                className={styles.errorClose}
              >
                ×
              </button>
            </div>
          )}

          {/* Table Section */}
          <div className={styles.tableContainer}>
            {inventarios.length === 0 && !loading ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M19 11H5M19 11C20.1046 11 21 11.8954 21 13V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V13C3 11.8954 3.89543 11 5 11M19 11V9C19 7.89543 18.1046 7 17 7M5 11V9C5 7.89543 5.89543 7 7 7M7 7V5C7 3.89543 7.89543 3 9 3H15C16.1046 3 17 3.89543 17 5V7M7 7H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className={styles.emptyTitle}>No hay registros de inventario</h3>
                <p className={styles.emptyDescription}>
                  {search 
                    ? "Intenta cambiar el término de búsqueda" 
                    : "Comienza creando un nuevo registro de inventario"}
                </p>
                {!search && (
                  <button onClick={openCreate} className={styles.btnPrimary}>
                    Crear primer inventario
                  </button>
                )}
              </div>
            ) : (
              <table className={styles.table}>
                <thead className={styles.tableHeader}>
                  <tr>
                    <th className={styles.tableHeaderCell}>ID</th>
                    <th className={styles.tableHeaderCell}>Tienda</th>
                    <th className={styles.tableHeaderCell}>Producto</th>
                    <th className={styles.tableHeaderCell}>Cantidad</th>
                    <th className={styles.tableHeaderCell}>Estado</th>
                    <th className={styles.tableHeaderCell}>Acciones</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {inventarios.map(inv => {
                    const cantidad = inv.inventario_cantidad;
                    let stockStatus = 'normal';
                    let stockText = 'En stock';
                    
                    if (cantidad <= 0) {
                      stockStatus = 'out';
                      stockText = 'Agotado';
                    } else if (cantidad <= 5) {
                      stockStatus = 'low';
                      stockText = 'Bajo stock';
                    } else if (cantidad <= 20) {
                      stockStatus = 'medium';
                      stockText = 'Stock moderado';
                    } else {
                      stockStatus = 'high';
                      stockText = 'Stock alto';
                    }

                    return (
                      <tr key={inv.id_registro ?? inv.id ?? inv.pk} className={styles.tableRow}>
                        <td className={styles.tableCell}>
                          <span className={styles.idBadge}>{inv.id_registro ?? inv.id ?? inv.pk}</span>
                        </td>
                        <td className={styles.tableCell}>
                          <div className={styles.storeInfo}>
                            <span className={styles.storeName}>{inv.tienda_nombre ?? inv.id_tienda}</span>
                          </div>
                        </td>
                        <td className={styles.tableCell}>
                          <div className={styles.productInfo}>
                            <span className={styles.productName}>{inv.producto_nombre ?? inv.id_producto}</span>
                          </div>
                        </td>
                        <td className={styles.tableCell}>
                          <div className={styles.quantityWrapper}>
                            <span className={`${styles.quantityBadge} ${styles[`quantity${stockStatus}`]}`}>
                              {cantidad}
                            </span>
                          </div>
                        </td>
                        <td className={styles.tableCell}>
                          <span className={`${styles.stockStatus} ${styles[`status${stockStatus}`]}`}>
                            <span className={styles.statusDot}></span>
                            {stockText}
                          </span>
                        </td>
                        <td className={styles.tableCell}>
                          <div className={styles.actionButtons}>
                            <button 
                              onClick={() => openEdit(inv.id_registro ?? inv.id ?? inv.pk)} 
                              className={styles.actionBtnEdit}
                              title="Editar"
                            >
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <path d="M11.3333 2.00001C11.5084 1.82491 11.7163 1.686 11.945 1.59076C12.1737 1.49552 12.4189 1.4458 12.6667 1.44445C12.9145 1.4458 13.1597 1.49552 13.3884 1.59076C13.6171 1.686 13.825 1.82491 14 2.00001C14.1751 2.17511 14.314 2.383 14.4092 2.61171C14.5045 2.84043 14.5542 3.08564 14.5556 3.33334C14.5542 3.58105 14.5045 3.82626 14.4092 4.05497C14.314 4.28369 14.1751 4.49157 14 4.66668L5.00001 13.6667L1.33334 14.6667L2.33334 11L11.3333 2.00001Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                            <button 
                              onClick={() => handleDelete(inv.id_registro ?? inv.id ?? inv.pk)} 
                              className={styles.actionBtnDelete}
                              title="Eliminar"
                            >
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <path d="M2 4H14M5.33333 4V2.66667C5.33333 2.48986 5.40357 2.32029 5.5286 2.19526C5.65362 2.07024 5.82319 2 6 2H10C10.1768 2 10.3464 2.07024 10.4714 2.19526C10.5964 2.32029 10.6667 2.48986 10.6667 2.66667V4M12.6667 4V13.3333C12.6667 13.5101 12.5964 13.6797 12.4714 13.8047C12.3464 13.9298 12.1768 14 12 14H4C3.82319 14 3.65362 13.9298 3.5286 13.8047C3.40357 13.6797 3.33333 13.5101 3.33333 13.3333V4H12.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {inventarios.length > 0 && (
            <div className={styles.pagination}>
              <div className={styles.paginationInfo}>
                Mostrando {inventarios.length} registros de inventario
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Modal */}
      {showModal && (
        <div 
          className={styles.modalOverlay}
          onClick={() => setShowModal(false)}
        >
          <div 
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {isEditing ? 'Editar Inventario' : 'Crear Inventario'}
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                className={styles.modalClose}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Tienda
                    <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.selectWrapper}>
                    <select 
                      name="id_tienda" 
                      value={form.id_tienda} 
                      onChange={handleChange} 
                      required 
                      className={styles.formSelect}
                    >
                      <option value="">-- Seleccionar tienda --</option>
                      {tiendas.map(t => (
                        <option key={t.id_tienda ?? t.id ?? t.pk} value={t.id_tienda ?? t.id ?? t.pk}>
                          {t.nombre_tienda ?? t.nombre}
                        </option>
                      ))}
                    </select>
                    <div className={styles.selectArrow}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Producto
                    <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.selectWrapper}>
                    <select 
                      name="id_producto" 
                      value={form.id_producto} 
                      onChange={handleChange} 
                      required 
                      className={styles.formSelect}
                    >
                      <option value="">-- Seleccionar producto --</option>
                      {productos.map(p => (
                        <option key={p.id_producto ?? p.id ?? t.pk} value={p.id_producto ?? p.id ?? t.pk}>
                          {p.nombre_producto ?? p.nombre}
                        </option>
                      ))}
                    </select>
                    <div className={styles.selectArrow}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Cantidad en inventario
                    <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.quantityInputWrapper}>
                    <input 
                      name="inventario_cantidad" 
                      value={form.inventario_cantidad} 
                      onChange={handleChange} 
                      type="number" 
                      min="0"
                      required
                      className={styles.formInput}
                      placeholder="0"
                    />
                    <div className={styles.quantityIndicators}>
                      <button 
                        type="button" 
                        className={styles.quantityQuickBtn}
                        onClick={() => setForm(prev => ({ ...prev, inventario_cantidad: '0' }))}
                      >
                        0
                      </button>
                      <button 
                        type="button" 
                        className={styles.quantityQuickBtn}
                        onClick={() => setForm(prev => ({ ...prev, inventario_cantidad: '10' }))}
                      >
                        10
                      </button>
                      <button 
                        type="button" 
                        className={styles.quantityQuickBtn}
                        onClick={() => setForm(prev => ({ ...prev, inventario_cantidad: '50' }))}
                      >
                        50
                      </button>
                      <button 
                        type="button" 
                        className={styles.quantityQuickBtn}
                        onClick={() => setForm(prev => ({ ...prev, inventario_cantidad: '100' }))}
                      >
                        100
                      </button>
                    </div>
                  </div>
                  <p className={styles.inputHelper}>
                    Cantidad actual en almacén (unidades enteras)
                  </p>
                </div>
              </div>

              <div className={styles.formPreview}>
                <div className={styles.previewCard}>
                  <div className={styles.previewHeader}>
                    <span className={styles.previewTitle}>Vista previa</span>
                    <div className={styles.previewStatus}>
                      {form.id_tienda && form.id_producto && form.inventario_cantidad ? (
                        parseInt(form.inventario_cantidad) <= 0 ? (
                          <span className={styles.previewStatusBadgeDanger}>Agotado</span>
                        ) : parseInt(form.inventario_cantidad) <= 5 ? (
                          <span className={styles.previewStatusBadgeWarning}>Bajo stock</span>
                        ) : parseInt(form.inventario_cantidad) <= 20 ? (
                          <span className={styles.previewStatusBadgeInfo}>Stock moderado</span>
                        ) : (
                          <span className={styles.previewStatusBadgeSuccess}>Stock alto</span>
                        )
                      ) : (
                        <span className={styles.previewStatusBadgeNeutral}>Incompleto</span>
                      )}
                    </div>
                  </div>
                  <div className={styles.previewContent}>
                    <div className={styles.previewRow}>
                      <span className={styles.previewLabel}>Tienda:</span>
                      <span className={styles.previewValue}>
                        {tiendas.find(t => (t.id_tienda ?? t.id ?? t.pk) == form.id_tienda)?.nombre_tienda ?? '—'}
                      </span>
                    </div>
                    <div className={styles.previewRow}>
                      <span className={styles.previewLabel}>Producto:</span>
                      <span className={styles.previewValue}>
                        {productos.find(p => (p.id_producto ?? p.id ?? t.pk) == form.id_producto)?.nombre_producto ?? '—'}
                      </span>
                    </div>
                    <div className={styles.previewRow}>
                      <span className={styles.previewLabel}>Cantidad:</span>
                      <span className={styles.previewValue}>
                        {form.inventario_cantidad || '—'} unidades
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className={styles.btnCancel}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className={styles.btnSubmit}
                >
                  {loading ? (
                    <span className={styles.btnLoading}>
                      <span className={styles.btnSpinner}></span>
                      Procesando...
                    </span>
                  ) : (
                    isEditing ? 'Guardar cambios' : 'Crear inventario'
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

export default DashboardVentaseInventariosCrudInventarios;