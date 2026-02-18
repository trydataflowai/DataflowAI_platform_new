import React, { useEffect, useState } from 'react';
import styles from '../../../styles/Dashboards/dashboard-ventas-e-inventarios/crudProductos.module.css';
import {
  fetchDashVeinteProducts,
  fetchDashVeinteProduct,
  createDashVeinteProduct,
  updateDashVeinteProduct,
  deleteDashVeinteProduct,
} from '../../../api/DashboardsApis/dashboard-ventas-e-inventarios/DashboardApiCrudProductos';

const emptyForm = {
  nombre_producto: '',
  categoria: '',
  marca: '',
  valor_producto: '',
};

const DashboardVentaseInventariosCrudProductos = () => {
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
        const data = await fetchDashVeinteProducts(params);
        setProductos(Array.isArray(data) ? data : (data.results || []));
      } catch (err) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search, refreshFlag]);

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
      const data = await fetchDashVeinteProduct(id);
      setForm({
        nombre_producto: data.nombre_producto || '',
        categoria: data.categoria || '',
        marca: data.marca || '',
        valor_producto: data.valor_producto ?? '',
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
    if (!window.confirm('¿Eliminar producto?')) return;
    setLoading(true);
    setError(null);
    try {
      await deleteDashVeinteProduct(id);
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

    if (!form.nombre_producto || form.nombre_producto.trim().length < 1) {
      setError('Nombre de producto requerido');
      setLoading(false);
      return;
    }

    const payload = {
      nombre_producto: form.nombre_producto,
      categoria: form.categoria,
      marca: form.marca,
      valor_producto: form.valor_producto === '' ? null : parseFloat(form.valor_producto),
    };

    try {
      if (isEditing && editingId) {
        await updateDashVeinteProduct(editingId, payload);
        alert('Producto actualizado');
      } else {
        await createDashVeinteProduct(payload);
        alert('Producto creado');
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
    <main className={`${styles['dhveinte-CrdPro-container']} ${styles['dhveinte-CrdPro-light']}`}>
      {/* Header Section */}
      <section className={styles['dhveinte-CrdPro-header']}>
        <div className={styles['dhveinte-CrdPro-headerContent']}>
          <h1 className={styles['dhveinte-CrdPro-title']}>CRUD Productos</h1>
          <p className={styles['dhveinte-CrdPro-subtitle']}>Gestión del catálogo de productos</p>
        </div>
      </section>

      {/* Filtros Section */}
      <section className={styles['dhveinte-CrdPro-filtersSection']}>
        <div className={styles['dhveinte-CrdPro-filtersContainer']}>
          <div className={styles['dhveinte-CrdPro-searchGroup']}>
            <div className={styles['dhveinte-CrdPro-searchInputWrapper']}>
              <svg className={styles['dhveinte-CrdPro-searchIcon']} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M11.3333 11.3333L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <input
                type="text"
                placeholder="Buscar por nombre, categoría o marca..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles['dhveinte-CrdPro-searchInput']}
              />
            </div>
          </div>

          <div className={styles['dhveinte-CrdPro-actionsGroup']}>
            <button 
              onClick={() => setRefreshFlag(f => f + 1)} 
              className={styles['dhveinte-CrdPro-btnSecondary']}
            >
              <svg className={styles['dhveinte-CrdPro-btnIcon']} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13.5 8C13.5 11.0376 11.0376 13.5 8 13.5C4.96243 13.5 2.5 11.0376 2.5 8C2.5 4.96243 4.96243 2.5 8 2.5C10.1579 2.5 12.0379 3.73188 13 5.5M13.5 2.5V5.5H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Refrescar
            </button>
            <button onClick={openCreate} className={styles['dhveinte-CrdPro-btnPrimary']}>
              <svg className={styles['dhveinte-CrdPro-btnIcon']} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3.5V12.5M12.5 8H3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Nuevo Producto
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className={styles['dhveinte-CrdPro-contentSection']}>
        <div className={styles['dhveinte-CrdPro-contentContainer']}>
          {/* Loading State */}
          {loading && (
            <div className={styles['dhveinte-CrdPro-loadingState']}>
              <div className={styles['dhveinte-CrdPro-loadingSpinner']}></div>
              <p className={styles['dhveinte-CrdPro-loadingText']}>Cargando productos...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className={styles['dhveinte-CrdPro-errorState']}>
              <div className={styles['dhveinte-CrdPro-errorIcon']}>!</div>
              <p className={styles['dhveinte-CrdPro-errorText']}>{error}</p>
              <button 
                onClick={() => setError(null)} 
                className={styles['dhveinte-CrdPro-errorClose']}
              >
                ×
              </button>
            </div>
          )}

          {/* Table Section */}
          <div className={styles['dhveinte-CrdPro-tableContainer']}>
            {productos.length === 0 && !loading ? (
              <div className={styles['dhveinte-CrdPro-emptyState']}>
                <div className={styles['dhveinte-CrdPro-emptyIcon']}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M3 10H21M7 15H8M12 15H13M6 21H18C19.6569 21 21 19.6569 21 18V6C21 4.34315 19.6569 3 18 3H6C4.34315 3 3 4.34315 3 6V18C3 19.6569 4.34315 21 6 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className={styles['dhveinte-CrdPro-emptyTitle']}>No hay productos registrados</h3>
                <p className={styles['dhveinte-CrdPro-emptyDescription']}>
                  {search 
                    ? "Intenta cambiar el término de búsqueda" 
                    : "Comienza creando un nuevo producto"}
                </p>
                {!search && (
                  <button onClick={openCreate} className={styles['dhveinte-CrdPro-btnPrimary']}>
                    Crear primer producto
                  </button>
                )}
              </div>
            ) : (
              <table className={styles['dhveinte-CrdPro-table']}>
                <thead className={styles['dhveinte-CrdPro-tableHeader']}>
                  <tr>
                    <th className={styles['dhveinte-CrdPro-tableHeaderCell']}>ID</th>
                    <th className={styles['dhveinte-CrdPro-tableHeaderCell']}>Nombre</th>
                    <th className={styles['dhveinte-CrdPro-tableHeaderCell']}>Categoría</th>
                    <th className={styles['dhveinte-CrdPro-tableHeaderCell']}>Marca</th>
                    <th className={styles['dhveinte-CrdPro-tableHeaderCell']}>Valor</th>
                    <th className={styles['dhveinte-CrdPro-tableHeaderCell']}>Acciones</th>
                  </tr>
                </thead>
                <tbody className={styles['dhveinte-CrdPro-tableBody']}>
                  {productos.map(p => (
                    <tr key={p.id_producto ?? p.id ?? p.pk} className={styles['dhveinte-CrdPro-tableRow']}>
                      <td className={styles['dhveinte-CrdPro-tableCell']}>
                        <span className={styles['dhveinte-CrdPro-idBadge']}>{p.id_producto ?? p.id ?? p.pk}</span>
                      </td>
                      <td className={styles['dhveinte-CrdPro-tableCell']}>
                        <div className={styles['dhveinte-CrdPro-productInfo']}>
                          <span className={styles['dhveinte-CrdPro-productName']}>{p.nombre_producto}</span>
                        </div>
                      </td>
                      <td className={styles['dhveinte-CrdPro-tableCell']}>
                        <span className={`${styles['dhveinte-CrdPro-categoryBadge']} ${
                          p.categoria ? styles['dhveinte-CrdPro-categoryWithText'] : styles['dhveinte-CrdPro-categoryEmpty']
                        }`}>
                          {p.categoria || '—'}
                        </span>
                      </td>
                      <td className={styles['dhveinte-CrdPro-tableCell']}>
                        <span className={`${styles['dhveinte-CrdPro-brandBadge']} ${
                          p.marca ? styles['dhveinte-CrdPro-brandWithText'] : styles['dhveinte-CrdPro-brandEmpty']
                        }`}>
                          {p.marca || '—'}
                        </span>
                      </td>
                      <td className={styles['dhveinte-CrdPro-tableCell']}>
                        {p.valor_producto ? (
                          <span className={styles['dhveinte-CrdPro-priceBadge']}>
                            ${parseFloat(p.valor_producto).toLocaleString('es-MX', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        ) : (
                          <span className={styles['dhveinte-CrdPro-priceEmpty']}>—</span>
                        )}
                      </td>
                      <td className={styles['dhveinte-CrdPro-tableCell']}>
                        <div className={styles['dhveinte-CrdPro-actionButtons']}>
                          <button 
                            onClick={() => openEdit(p.id_producto ?? p.id ?? p.pk)} 
                            className={styles['dhveinte-CrdPro-actionBtnEdit']}
                            title="Editar"
                          >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                              <path d="M11.3333 2.00001C11.5084 1.82491 11.7163 1.686 11.945 1.59076C12.1737 1.49552 12.4189 1.4458 12.6667 1.44445C12.9145 1.4458 13.1597 1.49552 13.3884 1.59076C13.6171 1.686 13.825 1.82491 14 2.00001C14.1751 2.17511 14.314 2.383 14.4092 2.61171C14.5045 2.84043 14.5542 3.08564 14.5556 3.33334C14.5542 3.58105 14.5045 3.82626 14.4092 4.05497C14.314 4.28369 14.1751 4.49157 14 4.66668L5.00001 13.6667L1.33334 14.6667L2.33334 11L11.3333 2.00001Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDelete(p.id_producto ?? p.id ?? p.pk)} 
                            className={styles['dhveinte-CrdPro-actionBtnDelete']}
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
          {productos.length > 0 && (
            <div className={styles['dhveinte-CrdPro-pagination']}>
              <div className={styles['dhveinte-CrdPro-paginationInfo']}>
                Mostrando {productos.length} productos
              </div>
              <div className={styles['dhveinte-CrdPro-paginationSummary']}>
                <span className={styles['dhveinte-CrdPro-summaryItem']}>
                  <span className={styles['dhveinte-CrdPro-summaryIcon']}>📦</span>
                  Total: {productos.length}
                </span>
                {productos.some(p => p.valor_producto) && (
                  <span className={styles['dhveinte-CrdPro-summaryItem']}>
                    <span className={styles['dhveinte-CrdPro-summaryIcon']}>💰</span>
                    Valor promedio: ${(
                      productos
                        .filter(p => p.valor_producto)
                        .reduce((sum, p) => sum + parseFloat(p.valor_producto), 0) / 
                      productos.filter(p => p.valor_producto).length
                    ).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Modal */}
      {showModal && (
        <div 
          className={styles['dhveinte-CrdPro-modalOverlay']}
          onClick={() => setShowModal(false)}
        >
          <div 
            className={styles['dhveinte-CrdPro-modal']}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles['dhveinte-CrdPro-modalHeader']}>
              <h2 className={styles['dhveinte-CrdPro-modalTitle']}>
                {isEditing ? 'Editar Producto' : 'Crear Producto'}
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                className={styles['dhveinte-CrdPro-modalClose']}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles['dhveinte-CrdPro-modalForm']}>
              <div className={styles['dhveinte-CrdPro-formGrid']}>
                <div className={styles['dhveinte-CrdPro-formGroup']}>
                  <label className={styles['dhveinte-CrdPro-formLabel']}>
                    Nombre del producto
                    <span className={styles['dhveinte-CrdPro-required']}>*</span>
                  </label>
                  <input 
                    name="nombre_producto" 
                    value={form.nombre_producto} 
                    onChange={handleChange} 
                    required 
                    className={styles['dhveinte-CrdPro-formInput']}
                    placeholder="Ej: Laptop Gamer"
                  />
                </div>

                <div className={styles['dhveinte-CrdPro-formGroup']}>
                  <label className={styles['dhveinte-CrdPro-formLabel']}>
                    Categoría
                  </label>
                  <select 
                    name="categoria" 
                    value={form.categoria} 
                    onChange={handleChange} 
                    className={styles['dhveinte-CrdPro-formSelect']}
                  >
                    <option value="">-- Seleccionar categoría --</option>
                    <option value="Electrónica">Electrónica</option>
                    <option value="Ropa">Ropa</option>
                    <option value="Hogar">Hogar</option>
                    <option value="Alimentos">Alimentos</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Deportes">Deportes</option>
                    <option value="Juguetes">Juguetes</option>
                    <option value="Libros">Libros</option>
                    <option value="Oficina">Oficina</option>
                    <option value="Salud">Salud & Belleza</option>
                    <option value="Automotriz">Automotriz</option>
                    <option value="Herramientas">Herramientas</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>

                <div className={styles['dhveinte-CrdPro-formGroup']}>
                  <label className={styles['dhveinte-CrdPro-formLabel']}>
                    Marca
                  </label>
                  <input 
                    name="marca" 
                    value={form.marca} 
                    onChange={handleChange} 
                    className={styles['dhveinte-CrdPro-formInput']}
                    placeholder="Ej: Sony, Nike, etc."
                  />
                </div>

                <div className={styles['dhveinte-CrdPro-formGroup']}>
                  <label className={styles['dhveinte-CrdPro-formLabel']}>
                    Valor ($)
                  </label>
                  <div className={styles['dhveinte-CrdPro-priceInputWrapper']}>
                    <span className={styles['dhveinte-CrdPro-currencySymbol']}>$</span>
                    <input 
                      name="valor_producto" 
                      type="number" 
                      step="0.01"
                      min="0"
                      value={form.valor_producto} 
                      onChange={handleChange} 
                      className={styles['dhveinte-CrdPro-formInputPrice']}
                      placeholder="0.00"
                    />
                  </div>
                  <p className={styles['dhveinte-CrdPro-inputHelper']}>
                    Dejar vacío si el producto no tiene precio definido
                  </p>
                </div>
              </div>

              <div className={styles['dhveinte-CrdPro-modalActions']}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className={styles['dhveinte-CrdPro-btnCancel']}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className={styles['dhveinte-CrdPro-btnSubmit']}
                >
                  {loading ? (
                    <span className={styles['dhveinte-CrdPro-btnLoading']}>
                      <span className={styles['dhveinte-CrdPro-btnSpinner']}></span>
                      Procesando...
                    </span>
                  ) : (
                    isEditing ? 'Guardar cambios' : 'Crear producto'
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

export default DashboardVentaseInventariosCrudProductos;