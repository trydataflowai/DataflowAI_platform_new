import React, { useEffect, useState } from 'react';
import styles from '../../../styles/Dashboards/dashboard-ventas-e-inventarios/crudVentas.module.css';
import {
  fetchDashVeinteVentas,
  fetchDashVeinteVenta,
  createDashVeinteVenta,
  updateDashVeinteVenta,
  deleteDashVeinteVenta,
  fetchTiendasForSelect,
  fetchProductosForSelect,
} from '../../../api/DashboardsApis/dashboard-ventas-e-inventarios/DashboardApiCrudVentas';

const emptyForm = {
  id_tienda: '',
  id_producto: '',
  cantidad_vendida: '',
  dinero_vendido: '',
  fecha_venta: '',
};

const DashboardVentaseInventariosCrudVentas = () => {
  const [ventas, setVentas] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [productos, setProductos] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [refreshFlag, setRefreshFlag] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {};
        if (search && search.trim()) params.search = search.trim();
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        const data = await fetchDashVeinteVentas(params);
        setVentas(Array.isArray(data) ? data : (data.results || []));
      } catch (err) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search, startDate, endDate, refreshFlag]);

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
      const data = await fetchDashVeinteVenta(id);
      setForm({
        id_tienda: data.id_tienda ?? '',
        id_producto: data.id_producto ?? '',
        cantidad_vendida: data.cantidad_vendida ?? '',
        dinero_vendido: data.dinero_vendido ?? '',
        fecha_venta: data.fecha_venta ?? '',
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
    if (!window.confirm('¿Eliminar registro de venta?')) return;
    setLoading(true);
    setError(null);
    try {
      await deleteDashVeinteVenta(id);
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

    if (!form.id_tienda || !form.id_producto || !form.fecha_venta) {
      setError('Tienda, producto y fecha son requeridos');
      setLoading(false);
      return;
    }
    if (form.cantidad_vendida === '' || isNaN(Number(form.cantidad_vendida))) {
      setError('Cantidad inválida');
      setLoading(false);
      return;
    }
    if (form.dinero_vendido === '' || isNaN(Number(form.dinero_vendido))) {
      setError('Dinero vendido inválido');
      setLoading(false);
      return;
    }

    const payload = {
      id_tienda: Number(form.id_tienda),
      id_producto: Number(form.id_producto),
      cantidad_vendida: Number(form.cantidad_vendida),
      dinero_vendido: Number(form.dinero_vendido),
      fecha_venta: form.fecha_venta,
    };

    try {
      if (isEditing && editingId) {
        await updateDashVeinteVenta(editingId, payload);
        alert('Venta actualizada');
      } else {
        await createDashVeinteVenta(payload);
        alert('Venta creada');
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
    <main className={`${styles.container} ${styles.CrudVentasLight}`}>
      {/* Header Section */}
      <section className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>CRUD Ventas</h1>
          <p className={styles.subtitle}>Gestión de registros de ventas del sistema</p>
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
                placeholder="Buscar por tienda o producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          <div className={styles.dateGroup}>
            <div className={styles.dateInputWrapper}>
              <span className={styles.dateLabel}>Desde:</span>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className={styles.dateInput}
              />
            </div>
            <div className={styles.dateInputWrapper}>
              <span className={styles.dateLabel}>Hasta:</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className={styles.dateInput}
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
              Nueva Venta
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className={styles.contentSection}>
        <div className={styles.contentContainer}>
          {/* Loading State */}
          {loading && (
            <div className={styles.loadingState}>
              <div className={styles.loadingSpinner}></div>
              <p className={styles.loadingText}>Cargando registros...</p>
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
            {ventas.length === 0 && !loading ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M3 10H21M7 15H8M12 15H13M6 21H18C19.6569 21 21 19.6569 21 18V6C21 4.34315 19.6569 3 18 3H6C4.34315 3 3 4.34315 3 6V18C3 19.6569 4.34315 21 6 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className={styles.emptyTitle}>No hay registros de ventas</h3>
                <p className={styles.emptyDescription}>
                  {search || startDate || endDate 
                    ? "Intenta cambiar los filtros de búsqueda" 
                    : "Comienza creando una nueva venta"}
                </p>
              </div>
            ) : (
              <table className={styles.table}>
                <thead className={styles.tableHeader}>
                  <tr>
                    <th className={styles.tableHeaderCell}>ID</th>
                    <th className={styles.tableHeaderCell}>Fecha</th>
                    <th className={styles.tableHeaderCell}>Tienda</th>
                    <th className={styles.tableHeaderCell}>Producto</th>
                    <th className={styles.tableHeaderCell}>Cantidad</th>
                    <th className={styles.tableHeaderCell}>Dinero</th>
                    <th className={styles.tableHeaderCell}>Acciones</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {ventas.map(v => (
                    <tr key={v.id_registro ?? v.id ?? v.pk} className={styles.tableRow}>
                      <td className={styles.tableCell}>
                        <span className={styles.idBadge}>{v.id_registro ?? v.id ?? v.pk}</span>
                      </td>
                      <td className={styles.tableCell}>
                        <div className={styles.dateCell}>
                          <span className={styles.dateValue}>{v.fecha_venta}</span>
                        </div>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={styles.entityName}>{v.tienda_nombre ?? v.id_tienda}</span>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={styles.entityName}>{v.producto_nombre ?? v.id_producto}</span>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={styles.quantityBadge}>{v.cantidad_vendida}</span>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={styles.amountBadge}>${parseFloat(v.dinero_vendido).toLocaleString()}</span>
                      </td>
                      <td className={styles.tableCell}>
                        <div className={styles.actionButtons}>
                          <button 
                            onClick={() => openEdit(v.id_registro ?? v.id ?? v.pk)} 
                            className={styles.actionBtnEdit}
                            title="Editar"
                          >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                              <path d="M11.3333 2.00001C11.5084 1.82491 11.7163 1.686 11.945 1.59076C12.1737 1.49552 12.4189 1.4458 12.6667 1.44445C12.9145 1.4458 13.1597 1.49552 13.3884 1.59076C13.6171 1.686 13.825 1.82491 14 2.00001C14.1751 2.17511 14.314 2.383 14.4092 2.61171C14.5045 2.84043 14.5542 3.08564 14.5556 3.33334C14.5542 3.58105 14.5045 3.82626 14.4092 4.05497C14.314 4.28369 14.1751 4.49157 14 4.66668L5.00001 13.6667L1.33334 14.6667L2.33334 11L11.3333 2.00001Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDelete(v.id_registro ?? v.id ?? v.pk)} 
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
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {ventas.length > 0 && (
            <div className={styles.pagination}>
              <div className={styles.paginationInfo}>
                Mostrando {ventas.length} registros
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
                {isEditing ? 'Editar Venta' : 'Crear Venta'}
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
                    Fecha de venta
                    <span className={styles.required}>*</span>
                  </label>
                  <input 
                    name="fecha_venta" 
                    type="date" 
                    value={form.fecha_venta} 
                    onChange={handleChange} 
                    required 
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Tienda
                    <span className={styles.required}>*</span>
                  </label>
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
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Producto
                    <span className={styles.required}>*</span>
                  </label>
                  <select 
                    name="id_producto" 
                    value={form.id_producto} 
                    onChange={handleChange} 
                    required 
                    className={styles.formSelect}
                  >
                    <option value="">-- Seleccionar producto --</option>
                    {productos.map(p => (
                      <option key={p.id_producto ?? p.id ?? p.pk} value={p.id_producto ?? p.id ?? p.pk}>
                        {p.nombre_producto ?? p.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Cantidad vendida
                    <span className={styles.required}>*</span>
                  </label>
                  <input 
                    name="cantidad_vendida" 
                    type="number" 
                    min="1"
                    value={form.cantidad_vendida} 
                    onChange={handleChange} 
                    required 
                    className={styles.formInput}
                    placeholder="Ej: 10"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Dinero vendido ($)
                    <span className={styles.required}>*</span>
                  </label>
                  <input 
                    name="dinero_vendido" 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={form.dinero_vendido} 
                    onChange={handleChange} 
                    required 
                    className={styles.formInput}
                    placeholder="Ej: 1500.50"
                  />
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
                    isEditing ? 'Guardar cambios' : 'Crear venta'
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

export default DashboardVentaseInventariosCrudVentas;