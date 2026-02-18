import React, { useEffect, useState } from 'react';
import styles from '../../../styles/Dashboards/dashboard-ventas-e-inventarios/crudMetas.module.css';
import {
  fetchDashVeinteMetas,
  fetchDashVeinteMeta,
  createDashVeinteMeta,
  updateDashVeinteMeta,
  deleteDashVeinteMeta,
  fetchTiendasForSelect,
  fetchProductosForSelect,
} from '../../../api/DashboardsApis/dashboard-ventas-e-inventarios/DashboardApiCrudMetas';

const emptyForm = {
  id_tienda: '',
  id_producto: '',
  meta_cantidad: '',
  meta_dinero: '',
  fecha_meta: '',
};

const DashboardVentaseInventariosCrudMetas = () => {
  const [metas, setMetas] = useState([]);
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
        const data = await fetchDashVeinteMetas(params);
        setMetas(Array.isArray(data) ? data : (data.results || []));
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
      const data = await fetchDashVeinteMeta(id);
      setForm({
        id_tienda: data.id_tienda ?? '',
        id_producto: data.id_producto ?? '',
        meta_cantidad: data.meta_cantidad ?? '',
        meta_dinero: data.meta_dinero ?? '',
        fecha_meta: data.fecha_meta ?? '',
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
    if (!window.confirm('¿Eliminar registro de meta?')) return;
    setLoading(true);
    setError(null);
    try {
      await deleteDashVeinteMeta(id);
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

    if (!form.id_tienda || !form.id_producto || !form.fecha_meta) {
      setError('Tienda, producto y fecha son requeridos');
      setLoading(false);
      return;
    }
    if (form.meta_cantidad === '' || isNaN(Number(form.meta_cantidad))) {
      setError('Meta cantidad inválida');
      setLoading(false);
      return;
    }
    if (form.meta_dinero === '' || isNaN(Number(form.meta_dinero))) {
      setError('Meta dinero inválido');
      setLoading(false);
      return;
    }

    const payload = {
      id_tienda: Number(form.id_tienda),
      id_producto: Number(form.id_producto),
      meta_cantidad: Number(form.meta_cantidad),
      meta_dinero: Number(form.meta_dinero),
      fecha_meta: form.fecha_meta,
    };

    try {
      if (isEditing && editingId) {
        await updateDashVeinteMeta(editingId, payload);
        alert('Meta actualizada');
      } else {
        await createDashVeinteMeta(payload);
        alert('Meta creada');
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
    <main className={`${styles.dhveinteCrdMet} ${styles.dhveinteCrdMetLight}`}>
      {/* Header Section */}
      <section className={styles.dhveinteCrdMetHeader}>
        <div className={styles.dhveinteCrdMetHeaderContent}>
          <h1 className={styles.dhveinteCrdMetTitle}>CRUD Metas</h1>
          <p className={styles.dhveinteCrdMetSubtitle}>Gestión de objetivos y metas de ventas</p>
        </div>
      </section>

      {/* Filtros Section */}
      <section className={styles.dhveinteCrdMetFiltersSection}>
        <div className={styles.dhveinteCrdMetFiltersContainer}>
          <div className={styles.dhveinteCrdMetSearchGroup}>
            <div className={styles.dhveinteCrdMetSearchInputWrapper}>
              <svg className={styles.dhveinteCrdMetSearchIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M11.3333 11.3333L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <input
                type="text"
                placeholder="Buscar por tienda o producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.dhveinteCrdMetSearchInput}
              />
            </div>
          </div>

          <div className={styles.dhveinteCrdMetDateGroup}>
            <div className={styles.dhveinteCrdMetDateInputWrapper}>
              <span className={styles.dhveinteCrdMetDateLabel}>Desde:</span>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className={styles.dhveinteCrdMetDateInput}
              />
            </div>
            <div className={styles.dhveinteCrdMetDateInputWrapper}>
              <span className={styles.dhveinteCrdMetDateLabel}>Hasta:</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className={styles.dhveinteCrdMetDateInput}
              />
            </div>
          </div>

          <div className={styles.dhveinteCrdMetActionsGroup}>
            <button 
              onClick={() => setRefreshFlag(f => f + 1)} 
              className={styles.dhveinteCrdMetBtnSecondary}
            >
              <svg className={styles.dhveinteCrdMetBtnIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13.5 8C13.5 11.0376 11.0376 13.5 8 13.5C4.96243 13.5 2.5 11.0376 2.5 8C2.5 4.96243 4.96243 2.5 8 2.5C10.1579 2.5 12.0379 3.73188 13 5.5M13.5 2.5V5.5H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Refrescar
            </button>
            <button onClick={openCreate} className={styles.dhveinteCrdMetBtnPrimary}>
              <svg className={styles.dhveinteCrdMetBtnIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3.5V12.5M12.5 8H3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Nueva Meta
            </button>
          </div>
        </div>
      </section>

      {/* Statistics Section - MOVIDO ARRIBA DE LA TABLA */}
      {metas.length > 0 && (
        <section className={styles.dhveinteCrdMetStatsSectionTop}>
          <div className={styles.dhveinteCrdMetStatsGrid}>
            <div className={styles.dhveinteCrdMetStatCard}>
              <div className={styles.dhveinteCrdMetStatIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className={styles.dhveinteCrdMetStatContent}>
                <div className={styles.dhveinteCrdMetStatValue}>
                  {metas.length}
                </div>
                <div className={styles.dhveinteCrdMetStatLabel}>Metas totales</div>
              </div>
            </div>

            <div className={styles.dhveinteCrdMetStatCard}>
              <div className={styles.dhveinteCrdMetStatIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6H21M3 12H21M3 18H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className={styles.dhveinteCrdMetStatContent}>
                <div className={styles.dhveinteCrdMetStatValue}>
                  {[...new Set(metas.map(m => m.fecha_meta.split('-')[0]))].length}
                </div>
                <div className={styles.dhveinteCrdMetStatLabel}>Años cubiertos</div>
              </div>
            </div>

            <div className={styles.dhveinteCrdMetStatCard}>
              <div className={styles.dhveinteCrdMetStatIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className={styles.dhveinteCrdMetStatContent}>
                <div className={styles.dhveinteCrdMetStatValue}>
                  ${metas
                    .reduce((sum, m) => sum + (parseFloat(m.meta_dinero) || 0), 0)
                    .toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className={styles.dhveinteCrdMetStatLabel}>Dinero objetivo total</div>
              </div>
            </div>

            <div className={styles.dhveinteCrdMetStatCard}>
              <div className={styles.dhveinteCrdMetStatIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M7 12L9.5 9.5L12 12L17 7M19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className={styles.dhveinteCrdMetStatContent}>
                <div className={styles.dhveinteCrdMetStatValue}>
                  {[...new Set(metas.map(m => m.id_tienda))].length}
                </div>
                <div className={styles.dhveinteCrdMetStatLabel}>Tiendas con metas</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className={styles.dhveinteCrdMetContentSection}>
        <div className={styles.dhveinteCrdMetContentContainer}>
          {/* Loading State */}
          {loading && (
            <div className={styles.dhveinteCrdMetLoadingState}>
              <div className={styles.dhveinteCrdMetLoadingSpinner}></div>
              <p className={styles.dhveinteCrdMetLoadingText}>Cargando metas...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className={styles.dhveinteCrdMetErrorState}>
              <div className={styles.dhveinteCrdMetErrorIcon}>!</div>
              <p className={styles.dhveinteCrdMetErrorText}>{error}</p>
              <button 
                onClick={() => setError(null)} 
                className={styles.dhveinteCrdMetErrorClose}
              >
                ×
              </button>
            </div>
          )}

          {/* Table Section */}
          <div className={styles.dhveinteCrdMetTableContainer}>
            {metas.length === 0 && !loading ? (
              <div className={styles.dhveinteCrdMetEmptyState}>
                <div className={styles.dhveinteCrdMetEmptyIcon}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className={styles.dhveinteCrdMetEmptyTitle}>No hay metas registradas</h3>
                <p className={styles.dhveinteCrdMetEmptyDescription}>
                  {search || startDate || endDate 
                    ? "Intenta cambiar los filtros de búsqueda" 
                    : "Comienza creando una nueva meta"}
                </p>
                {!search && !startDate && !endDate && (
                  <button onClick={openCreate} className={styles.dhveinteCrdMetBtnPrimary}>
                    Crear primera meta
                  </button>
                )}
              </div>
            ) : (
              <table className={styles.dhveinteCrdMetTable}>
                <thead className={styles.dhveinteCrdMetTableHeader}>
                  <tr>
                    <th className={styles.dhveinteCrdMetTableHeaderCell}>ID</th>
                    <th className={styles.dhveinteCrdMetTableHeaderCell}>Fecha</th>
                    <th className={styles.dhveinteCrdMetTableHeaderCell}>Tienda</th>
                    <th className={styles.dhveinteCrdMetTableHeaderCell}>Producto</th>
                    <th className={styles.dhveinteCrdMetTableHeaderCell}>Meta Cantidad</th>
                    <th className={styles.dhveinteCrdMetTableHeaderCell}>Meta Dinero</th>
                    <th className={styles.dhveinteCrdMetTableHeaderCell}>Acciones</th>
                  </tr>
                </thead>
                <tbody className={styles.dhveinteCrdMetTableBody}>
                  {metas.map(m => {
                    const cantidad = parseFloat(m.meta_cantidad) || 0;
                    const dinero = parseFloat(m.meta_dinero) || 0;
                    
                    let objetivoClass = '';
                    if (dinero >= 10000) objetivoClass = styles.dhveinteCrdMetObjetivoAlto;
                    else if (dinero >= 5000) objetivoClass = styles.dhveinteCrdMetObjetivoMedio;
                    else if (dinero >= 1000) objetivoClass = styles.dhveinteCrdMetObjetivoBajo;
                    else objetivoClass = styles.dhveinteCrdMetObjetivoBasico;

                    return (
                      <tr key={m.id_registro ?? m.id ?? m.pk} className={styles.dhveinteCrdMetTableRow}>
                        <td className={styles.dhveinteCrdMetTableCell}>
                          <span className={styles.dhveinteCrdMetIdBadge}>{m.id_registro ?? m.id ?? m.pk}</span>
                        </td>
                        <td className={styles.dhveinteCrdMetTableCell}>
                          <div className={styles.dhveinteCrdMetDateCell}>
                            <span className={styles.dhveinteCrdMetDateValue}>{m.fecha_meta}</span>
                          </div>
                        </td>
                        <td className={styles.dhveinteCrdMetTableCell}>
                          <div className={styles.dhveinteCrdMetStoreInfo}>
                            <span className={styles.dhveinteCrdMetStoreName}>{m.tienda_nombre ?? m.id_tienda}</span>
                          </div>
                        </td>
                        <td className={styles.dhveinteCrdMetTableCell}>
                          <div className={styles.dhveinteCrdMetProductInfo}>
                            <span className={styles.dhveinteCrdMetProductName}>{m.producto_nombre ?? m.id_producto}</span>
                          </div>
                        </td>
                        <td className={styles.dhveinteCrdMetTableCell}>
                          <span className={`${styles.dhveinteCrdMetQuantityBadge} ${objetivoClass}`}>
                            {cantidad.toLocaleString()}
                          </span>
                        </td>
                        <td className={styles.dhveinteCrdMetTableCell}>
                          <span className={`${styles.dhveinteCrdMetMoneyBadge} ${objetivoClass}`}>
                            ${dinero.toLocaleString('es-MX', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        </td>
                        <td className={styles.dhveinteCrdMetTableCell}>
                          <div className={styles.dhveinteCrdMetActionButtons}>
                            <button 
                              onClick={() => openEdit(m.id_registro ?? m.id ?? m.pk)} 
                              className={styles.dhveinteCrdMetActionBtnEdit}
                              title="Editar"
                            >
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <path d="M11.3333 2.00001C11.5084 1.82491 11.7163 1.686 11.945 1.59076C12.1737 1.49552 12.4189 1.4458 12.6667 1.44445C12.9145 1.4458 13.1597 1.49552 13.3884 1.59076C13.6171 1.686 13.825 1.82491 14 2.00001C14.1751 2.17511 14.314 2.383 14.4092 2.61171C14.5045 2.84043 14.5542 3.08564 14.5556 3.33334C14.5542 3.58105 14.5045 3.82626 14.4092 4.05497C14.314 4.28369 14.1751 4.49157 14 4.66668L5.00001 13.6667L1.33334 14.6667L2.33334 11L11.3333 2.00001Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                            <button 
                              onClick={() => handleDelete(m.id_registro ?? m.id ?? m.pk)} 
                              className={styles.dhveinteCrdMetActionBtnDelete}
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
          {metas.length > 0 && (
            <div className={styles.dhveinteCrdMetPagination}>
              <div className={styles.dhveinteCrdMetPaginationInfo}>
                Mostrando {metas.length} metas
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Modal */}
      {showModal && (
        <div 
          className={styles.dhveinteCrdMetModalOverlay}
          onClick={() => setShowModal(false)}
        >
          <div 
            className={styles.dhveinteCrdMetModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.dhveinteCrdMetModalHeader}>
              <h2 className={styles.dhveinteCrdMetModalTitle}>
                {isEditing ? 'Editar Meta' : 'Crear Meta'}
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                className={styles.dhveinteCrdMetModalClose}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.dhveinteCrdMetModalForm}>
              <div className={styles.dhveinteCrdMetFormGrid}>
                <div className={styles.dhveinteCrdMetFormGroup}>
                  <label className={styles.dhveinteCrdMetFormLabel}>
                    Fecha de la meta
                    <span className={styles.dhveinteCrdMetRequired}>*</span>
                  </label>
                  <input 
                    name="fecha_meta" 
                    type="date" 
                    value={form.fecha_meta} 
                    onChange={handleChange} 
                    required 
                    className={styles.dhveinteCrdMetFormInput}
                  />
                </div>

                <div className={styles.dhveinteCrdMetFormGroup}>
                  <label className={styles.dhveinteCrdMetFormLabel}>
                    Tienda
                    <span className={styles.dhveinteCrdMetRequired}>*</span>
                  </label>
                  <div className={styles.dhveinteCrdMetSelectWrapper}>
                    <select 
                      name="id_tienda" 
                      value={form.id_tienda} 
                      onChange={handleChange} 
                      required 
                      className={styles.dhveinteCrdMetFormSelect}
                    >
                      <option value="">-- Seleccionar tienda --</option>
                      {tiendas.map(t => (
                        <option key={t.id_tienda ?? t.id ?? t.pk} value={t.id_tienda ?? t.id ?? t.pk}>
                          {t.nombre_tienda ?? t.nombre}
                        </option>
                      ))}
                    </select>
                    <div className={styles.dhveinteCrdMetSelectArrow}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className={styles.dhveinteCrdMetFormGroup}>
                  <label className={styles.dhveinteCrdMetFormLabel}>
                    Producto
                    <span className={styles.dhveinteCrdMetRequired}>*</span>
                  </label>
                  <div className={styles.dhveinteCrdMetSelectWrapper}>
                    <select 
                      name="id_producto" 
                      value={form.id_producto} 
                      onChange={handleChange} 
                      required 
                      className={styles.dhveinteCrdMetFormSelect}
                    >
                      <option value="">-- Seleccionar producto --</option>
                      {productos.map(p => (
                        <option key={p.id_producto ?? p.id ?? p.pk} value={p.id_producto ?? p.id ?? p.pk}>
                          {p.nombre_producto ?? p.nombre}
                        </option>
                      ))}
                    </select>
                    <div className={styles.dhveinteCrdMetSelectArrow}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className={styles.dhveinteCrdMetFormGroup}>
                  <label className={styles.dhveinteCrdMetFormLabel}>
                    Meta de cantidad
                    <span className={styles.dhveinteCrdMetRequired}>*</span>
                  </label>
                  <div className={styles.dhveinteCrdMetQuantityInputWrapper}>
                    <input 
                      name="meta_cantidad" 
                      type="number" 
                      min="1"
                      value={form.meta_cantidad} 
                      onChange={handleChange} 
                      required 
                      className={styles.dhveinteCrdMetFormInput}
                      placeholder="Ej: 100"
                    />
                    <div className={styles.dhveinteCrdMetQuickTargets}>
                      <span className={styles.dhveinteCrdMetQuickTargetsLabel}>Objetivos rápidos:</span>
                      <div className={styles.dhveinteCrdMetQuickTargetButtons}>
                        <button 
                          type="button" 
                          className={styles.dhveinteCrdMetQuickTargetBtn}
                          onClick={() => setForm(prev => ({ ...prev, meta_cantidad: '50' }))}
                        >
                          50
                        </button>
                        <button 
                          type="button" 
                          className={styles.dhveinteCrdMetQuickTargetBtn}
                          onClick={() => setForm(prev => ({ ...prev, meta_cantidad: '100' }))}
                        >
                          100
                        </button>
                        <button 
                          type="button" 
                          className={styles.dhveinteCrdMetQuickTargetBtn}
                          onClick={() => setForm(prev => ({ ...prev, meta_cantidad: '500' }))}
                        >
                          500
                        </button>
                        <button 
                          type="button" 
                          className={styles.dhveinteCrdMetQuickTargetBtn}
                          onClick={() => setForm(prev => ({ ...prev, meta_cantidad: '1000' }))}
                        >
                          1K
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.dhveinteCrdMetFormGroup}>
                  <label className={styles.dhveinteCrdMetFormLabel}>
                    Meta de dinero ($)
                    <span className={styles.dhveinteCrdMetRequired}>*</span>
                  </label>
                  <div className={styles.dhveinteCrdMetMoneyInputWrapper}>
                    <span className={styles.dhveinteCrdMetCurrencySymbol}>$</span>
                    <input 
                      name="meta_dinero" 
                      type="number" 
                      step="0.01"
                      min="0"
                      value={form.meta_dinero} 
                      onChange={handleChange} 
                      required 
                      className={styles.dhveinteCrdMetFormInputMoney}
                      placeholder="0.00"
                    />
                    <div className={styles.dhveinteCrdMetQuickMoneyTargets}>
                      <span className={styles.dhveinteCrdMetQuickTargetsLabel}>Metas comunes:</span>
                      <div className={styles.dhveinteCrdMetQuickMoneyButtons}>
                        <button 
                          type="button" 
                          className={styles.dhveinteCrdMetQuickMoneyBtn}
                          onClick={() => setForm(prev => ({ ...prev, meta_dinero: '1000' }))}
                        >
                          $1K
                        </button>
                        <button 
                          type="button" 
                          className={styles.dhveinteCrdMetQuickMoneyBtn}
                          onClick={() => setForm(prev => ({ ...prev, meta_dinero: '5000' }))}
                        >
                          $5K
                        </button>
                        <button 
                          type="button" 
                          className={styles.dhveinteCrdMetQuickMoneyBtn}
                          onClick={() => setForm(prev => ({ ...prev, meta_dinero: '10000' }))}
                        >
                          $10K
                        </button>
                        <button 
                          type="button" 
                          className={styles.dhveinteCrdMetQuickMoneyBtn}
                          onClick={() => setForm(prev => ({ ...prev, meta_dinero: '50000' }))}
                        >
                          $50K
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.dhveinteCrdMetPreviewSection}>
                <div className={styles.dhveinteCrdMetPreviewCard}>
                  <div className={styles.dhveinteCrdMetPreviewHeader}>
                    <span className={styles.dhveinteCrdMetPreviewTitle}>Resumen de la meta</span>
                    {form.meta_dinero && (
                      <div className={styles.dhveinteCrdMetPreviewIndicator}>
                        {parseFloat(form.meta_dinero) >= 10000 ? (
                          <span className={styles.dhveinteCrdMetPreviewIndicatorHigh}>Meta ambiciosa</span>
                        ) : parseFloat(form.meta_dinero) >= 5000 ? (
                          <span className={styles.dhveinteCrdMetPreviewIndicatorMedium}>Meta moderada</span>
                        ) : (
                          <span className={styles.dhveinteCrdMetPreviewIndicatorLow}>Meta básica</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className={styles.dhveinteCrdMetPreviewContent}>
                    <div className={styles.dhveinteCrdMetPreviewRow}>
                      <div className={styles.dhveinteCrdMetPreviewItem}>
                        <span className={styles.dhveinteCrdMetPreviewItemLabel}>Tienda:</span>
                        <span className={styles.dhveinteCrdMetPreviewItemValue}>
                          {tiendas.find(t => (t.id_tienda ?? t.id ?? t.pk) == form.id_tienda)?.nombre_tienda ?? '—'}
                        </span>
                      </div>
                      <div className={styles.dhveinteCrdMetPreviewItem}>
                        <span className={styles.dhveinteCrdMetPreviewItemLabel}>Producto:</span>
                        <span className={styles.dhveinteCrdMetPreviewItemValue}>
                          {productos.find(p => (p.id_producto ?? p.id ?? p.pk) == form.id_producto)?.nombre_producto ?? '—'}
                        </span>
                      </div>
                    </div>
                    <div className={styles.dhveinteCrdMetPreviewRow}>
                      <div className={styles.dhveinteCrdMetPreviewItem}>
                        <span className={styles.dhveinteCrdMetPreviewItemLabel}>Fecha:</span>
                        <span className={styles.dhveinteCrdMetPreviewItemValue}>{form.fecha_meta || '—'}</span>
                      </div>
                      <div className={styles.dhveinteCrdMetPreviewItem}>
                        <span className={styles.dhveinteCrdMetPreviewItemLabel}>Objetivo:</span>
                        <span className={styles.dhveinteCrdMetPreviewItemValue}>
                          {form.meta_cantidad ? `${form.meta_cantidad} unidades` : '—'}
                        </span>
                      </div>
                    </div>
                    {form.meta_dinero && (
                      <div className={styles.dhveinteCrdMetMoneyPreview}>
                        <div className={styles.dhveinteCrdMetMoneyPreviewLabel}>Valor monetario:</div>
                        <div className={styles.dhveinteCrdMetMoneyPreviewValue}>
                          ${parseFloat(form.meta_dinero || 0).toLocaleString('es-MX', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.dhveinteCrdMetModalActions}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className={styles.dhveinteCrdMetBtnCancel}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className={styles.dhveinteCrdMetBtnSubmit}
                >
                  {loading ? (
                    <span className={styles.dhveinteCrdMetBtnLoading}>
                      <span className={styles.dhveinteCrdMetBtnSpinner}></span>
                      Procesando...
                    </span>
                  ) : (
                    isEditing ? 'Guardar cambios' : 'Crear meta'
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

export default DashboardVentaseInventariosCrudMetas;