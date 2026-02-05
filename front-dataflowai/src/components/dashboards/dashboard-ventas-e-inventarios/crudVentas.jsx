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
    <main className={`${styles["dh-veinte-crdventas-container"]} ${styles["dh-veinte-crdventas-CrudVentasLight"]}`}>
      {/* Header Section */}
      <section className={styles["dh-veinte-crdventas-header"]}>
        <div className={styles["dh-veinte-crdventas-headerContent"]}>
          <h1 className={styles["dh-veinte-crdventas-title"]}>CRUD Ventas</h1>
          <p className={styles["dh-veinte-crdventas-subtitle"]}>Gestión de registros de ventas del sistema</p>
        </div>
      </section>

      {/* Filtros Section */}
      <section className={styles["dh-veinte-crdventas-filtersSection"]}>
        <div className={styles["dh-veinte-crdventas-filtersContainer"]}>
          <div className={styles["dh-veinte-crdventas-searchGroup"]}>
            <div className={styles["dh-veinte-crdventas-searchInputWrapper"]}>
              <svg className={styles["dh-veinte-crdventas-searchIcon"]} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M11.3333 11.3333L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <input
                type="text"
                placeholder="Buscar por tienda o producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles["dh-veinte-crdventas-searchInput"]}
              />
            </div>
          </div>

          <div className={styles["dh-veinte-crdventas-dateGroup"]}>
            <div className={styles["dh-veinte-crdventas-dateInputWrapper"]}>
              <span className={styles["dh-veinte-crdventas-dateLabel"]}>Desde:</span>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className={styles["dh-veinte-crdventas-dateInput"]}
              />
            </div>
            <div className={styles["dh-veinte-crdventas-dateInputWrapper"]}>
              <span className={styles["dh-veinte-crdventas-dateLabel"]}>Hasta:</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className={styles["dh-veinte-crdventas-dateInput"]}
              />
            </div>
          </div>

          <div className={styles["dh-veinte-crdventas-actionsGroup"]}>
            <button 
              onClick={() => setRefreshFlag(f => f + 1)} 
              className={styles["dh-veinte-crdventas-btnSecondary"]}
            >
              <svg className={styles["dh-veinte-crdventas-btnIcon"]} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13.5 8C13.5 11.0376 11.0376 13.5 8 13.5C4.96243 13.5 2.5 11.0376 2.5 8C2.5 4.96243 4.96243 2.5 8 2.5C10.1579 2.5 12.0379 3.73188 13 5.5M13.5 2.5V5.5H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Refrescar
            </button>
            <button onClick={openCreate} className={styles["dh-veinte-crdventas-btnPrimary"]}>
              <svg className={styles["dh-veinte-crdventas-btnIcon"]} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3.5V12.5M12.5 8H3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Nueva Venta
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className={styles["dh-veinte-crdventas-contentSection"]}>
        <div className={styles["dh-veinte-crdventas-contentContainer"]}>
          {/* Loading State */}
          {loading && (
            <div className={styles["dh-veinte-crdventas-loadingState"]}>
              <div className={styles["dh-veinte-crdventas-loadingSpinner"]}></div>
              <p className={styles["dh-veinte-crdventas-loadingText"]}>Cargando registros...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className={styles["dh-veinte-crdventas-errorState"]}>
              <div className={styles["dh-veinte-crdventas-errorIcon"]}>!</div>
              <p className={styles["dh-veinte-crdventas-errorText"]}>{error}</p>
              <button 
                onClick={() => setError(null)} 
                className={styles["dh-veinte-crdventas-errorClose"]}
              >
                ×
              </button>
            </div>
          )}

          {/* Table Section */}
          <div className={styles["dh-veinte-crdventas-tableContainer"]}>
            {ventas.length === 0 && !loading ? (
              <div className={styles["dh-veinte-crdventas-emptyState"]}>
                <div className={styles["dh-veinte-crdventas-emptyIcon"]}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M3 10H21M7 15H8M12 15H13M6 21H18C19.6569 21 21 19.6569 21 18V6C21 4.34315 19.6569 3 18 3H6C4.34315 3 3 4.34315 3 6V18C3 19.6569 4.34315 21 6 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className={styles["dh-veinte-crdventas-emptyTitle"]}>No hay registros de ventas</h3>
                <p className={styles["dh-veinte-crdventas-emptyDescription"]}>
                  {search || startDate || endDate 
                    ? "Intenta cambiar los filtros de búsqueda" 
                    : "Comienza creando una nueva venta"}
                </p>
              </div>
            ) : (
              <table className={styles["dh-veinte-crdventas-table"]}>
                <thead className={styles["dh-veinte-crdventas-tableHeader"]}>
                  <tr>
                    <th className={styles["dh-veinte-crdventas-tableHeaderCell"]}>ID</th>
                    <th className={styles["dh-veinte-crdventas-tableHeaderCell"]}>Fecha</th>
                    <th className={styles["dh-veinte-crdventas-tableHeaderCell"]}>Tienda</th>
                    <th className={styles["dh-veinte-crdventas-tableHeaderCell"]}>Producto</th>
                    <th className={styles["dh-veinte-crdventas-tableHeaderCell"]}>Cantidad</th>
                    <th className={styles["dh-veinte-crdventas-tableHeaderCell"]}>Dinero</th>
                    <th className={styles["dh-veinte-crdventas-tableHeaderCell"]}>Acciones</th>
                  </tr>
                </thead>
                <tbody className={styles["dh-veinte-crdventas-tableBody"]}>
                  {ventas.map(v => (
                    <tr key={v.id_registro ?? v.id ?? v.pk} className={styles["dh-veinte-crdventas-tableRow"]}>
                      <td className={styles["dh-veinte-crdventas-tableCell"]}>
                        <span className={styles["dh-veinte-crdventas-idBadge"]}>{v.id_registro ?? v.id ?? v.pk}</span>
                      </td>
                      <td className={styles["dh-veinte-crdventas-tableCell"]}>
                        <div className={styles["dh-veinte-crdventas-dateCell"]}>
                          <span className={styles["dh-veinte-crdventas-dateValue"]}>{v.fecha_venta}</span>
                        </div>
                      </td>
                      <td className={styles["dh-veinte-crdventas-tableCell"]}>
                        <span className={styles["dh-veinte-crdventas-entityName"]}>{v.tienda_nombre ?? v.id_tienda}</span>
                      </td>
                      <td className={styles["dh-veinte-crdventas-tableCell"]}>
                        <span className={styles["dh-veinte-crdventas-entityName"]}>{v.producto_nombre ?? v.id_producto}</span>
                      </td>
                      <td className={styles["dh-veinte-crdventas-tableCell"]}>
                        <span className={styles["dh-veinte-crdventas-quantityBadge"]}>{v.cantidad_vendida}</span>
                      </td>
                      <td className={styles["dh-veinte-crdventas-tableCell"]}>
                        <span className={styles["dh-veinte-crdventas-amountBadge"]}>${parseFloat(v.dinero_vendido).toLocaleString()}</span>
                      </td>
                      <td className={styles["dh-veinte-crdventas-tableCell"]}>
                        <div className={styles["dh-veinte-crdventas-actionButtons"]}>
                          <button 
                            onClick={() => openEdit(v.id_registro ?? v.id ?? v.pk)} 
                            className={styles["dh-veinte-crdventas-actionBtnEdit"]}
                            title="Editar"
                          >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                              <path d="M11.3333 2.00001C11.5084 1.82491 11.7163 1.686 11.945 1.59076C12.1737 1.49552 12.4189 1.4458 12.6667 1.44445C12.9145 1.4458 13.1597 1.49552 13.3884 1.59076C13.6171 1.686 13.825 1.82491 14 2.00001C14.1751 2.17511 14.314 2.383 14.4092 2.61171C14.5045 2.84043 14.5542 3.08564 14.5556 3.33334C14.5542 3.58105 14.5045 3.82626 14.4092 4.05497C14.314 4.28369 14.1751 4.49157 14 4.66668L5.00001 13.6667L1.33334 14.6667L2.33334 11L11.3333 2.00001Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDelete(v.id_registro ?? v.id ?? v.pk)} 
                            className={styles["dh-veinte-crdventas-actionBtnDelete"]}
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
            <div className={styles["dh-veinte-crdventas-pagination"]}>
              <div className={styles["dh-veinte-crdventas-paginationInfo"]}>
                Mostrando {ventas.length} registros
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Modal */}
      {showModal && (
        <div 
          className={styles["dh-veinte-crdventas-modalOverlay"]}
          onClick={() => setShowModal(false)}
        >
          <div 
            className={styles["dh-veinte-crdventas-modal"]}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles["dh-veinte-crdventas-modalHeader"]}>
              <h2 className={styles["dh-veinte-crdventas-modalTitle"]}>
                {isEditing ? 'Editar Venta' : 'Crear Venta'}
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                className={styles["dh-veinte-crdventas-modalClose"]}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles["dh-veinte-crdventas-modalForm"]}>
              <div className={styles["dh-veinte-crdventas-formGrid"]}>
                <div className={styles["dh-veinte-crdventas-formGroup"]}>
                  <label className={styles["dh-veinte-crdventas-formLabel"]}>
                    Fecha de venta
                    <span className={styles["dh-veinte-crdventas-required"]}>*</span>
                  </label>
                  <input 
                    name="fecha_venta" 
                    type="date" 
                    value={form.fecha_venta} 
                    onChange={handleChange} 
                    required 
                    className={styles["dh-veinte-crdventas-formInput"]}
                  />
                </div>

                <div className={styles["dh-veinte-crdventas-formGroup"]}>
                  <label className={styles["dh-veinte-crdventas-formLabel"]}>
                    Tienda
                    <span className={styles["dh-veinte-crdventas-required"]}>*</span>
                  </label>
                  <select 
                    name="id_tienda" 
                    value={form.id_tienda} 
                    onChange={handleChange} 
                    required 
                    className={styles["dh-veinte-crdventas-formSelect"]}
                  >
                    <option value="">-- Seleccionar tienda --</option>
                    {tiendas.map(t => (
                      <option key={t.id_tienda ?? t.id ?? t.pk} value={t.id_tienda ?? t.id ?? t.pk}>
                        {t.nombre_tienda ?? t.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles["dh-veinte-crdventas-formGroup"]}>
                  <label className={styles["dh-veinte-crdventas-formLabel"]}>
                    Producto
                    <span className={styles["dh-veinte-crdventas-required"]}>*</span>
                  </label>
                  <select 
                    name="id_producto" 
                    value={form.id_producto} 
                    onChange={handleChange} 
                    required 
                    className={styles["dh-veinte-crdventas-formSelect"]}
                  >
                    <option value="">-- Seleccionar producto --</option>
                    {productos.map(p => (
                      <option key={p.id_producto ?? p.id ?? p.pk} value={p.id_producto ?? p.id ?? p.pk}>
                        {p.nombre_producto ?? p.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles["dh-veinte-crdventas-formGroup"]}>
                  <label className={styles["dh-veinte-crdventas-formLabel"]}>
                    Cantidad vendida
                    <span className={styles["dh-veinte-crdventas-required"]}>*</span>
                  </label>
                  <input 
                    name="cantidad_vendida" 
                    type="number" 
                    min="1"
                    value={form.cantidad_vendida} 
                    onChange={handleChange} 
                    required 
                    className={styles["dh-veinte-crdventas-formInput"]}
                    placeholder="Ej: 10"
                  />
                </div>

                <div className={styles["dh-veinte-crdventas-formGroup"]}>
                  <label className={styles["dh-veinte-crdventas-formLabel"]}>
                    Dinero vendido ($)
                    <span className={styles["dh-veinte-crdventas-required"]}>*</span>
                  </label>
                  <input 
                    name="dinero_vendido" 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={form.dinero_vendido} 
                    onChange={handleChange} 
                    required 
                    className={styles["dh-veinte-crdventas-formInput"]}
                    placeholder="Ej: 1500.50"
                  />
                </div>
              </div>

              <div className={styles["dh-veinte-crdventas-modalActions"]}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className={styles["dh-veinte-crdventas-btnCancel"]}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className={styles["dh-veinte-crdventas-btnSubmit"]}
                >
                  {loading ? (
                    <span className={styles["dh-veinte-crdventas-btnLoading"]}>
                      <span className={styles["dh-veinte-crdventas-btnSpinner"]}></span>
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