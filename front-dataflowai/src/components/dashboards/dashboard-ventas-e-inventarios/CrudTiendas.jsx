import React, { useEffect, useState } from 'react';
import styles from '../../../styles/Dashboards/dashboard-ventas-e-inventarios/crudTiendas.module.css';
import {
  fetchTiendas,
  createTienda,
  fetchTienda,
  updateTienda,
  deleteTienda,
} from '../../../api/DashboardsApis/dashboard-ventas-e-inventarios/DashboardApiCrudTiendas';

const emptyForm = {
  nombre_tienda: '',
  direccion_tienda: '',
  horario_tienda: '',
  ciudad: '',
  telefono: '',
  email: '',
  canal: '',
  estado: true,
};

const DashboardVentaseInventariosCrudTiendas = () => {
  const [tiendas, setTiendas] = useState([]);
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
        const data = await fetchTiendas(params);
        setTiendas(Array.isArray(data) ? data : (data.results || []));
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
      const data = await fetchTienda(id);
      setForm({
        nombre_tienda: data.nombre_tienda || '',
        direccion_tienda: data.direccion_tienda || '',
        horario_tienda: data.horario_tienda || '',
        ciudad: data.ciudad || '',
        telefono: data.telefono || '',
        email: data.email || '',
        canal: data.canal || '',
        estado: data.estado !== undefined ? data.estado : true,
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
    if (!window.confirm('¿Eliminar tienda? Esta acción no se puede deshacer.')) return;
    setLoading(true);
    setError(null);
    try {
      await deleteTienda(id);
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

    if (!form.nombre_tienda || form.nombre_tienda.trim().length < 2) {
      setError('Nombre de tienda requerido');
      setLoading(false);
      return;
    }

    const payload = {
      nombre_tienda: form.nombre_tienda,
      direccion_tienda: form.direccion_tienda,
      horario_tienda: form.horario_tienda,
      ciudad: form.ciudad,
      telefono: form.telefono,
      email: form.email,
      canal: form.canal,
      estado: !!form.estado,
    };

    try {
      if (isEditing && editingId) {
        await updateTienda(editingId, payload);
        alert('Tienda actualizada');
      } else {
        await createTienda(payload);
        alert('Tienda creada');
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
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  return (
    <main className={`${styles.container} ${styles.CrudTiendasLight}`}>
      {/* Header Section */}
      <section className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>CRUD Tiendas</h1>
          <p className={styles.subtitle}>Gestión de tiendas de la empresa</p>
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
                placeholder="Buscar por nombre, ciudad o canal..."
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
              Nueva Tienda
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
              <p className={styles.loadingText}>Cargando tiendas...</p>
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
            {tiendas.length === 0 && !loading ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M3 10H21M7 15H8M12 15H13M6 21H18C19.6569 21 21 19.6569 21 18V6C21 4.34315 19.6569 3 18 3H6C4.34315 3 3 4.34315 3 6V18C3 19.6569 4.34315 21 6 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className={styles.emptyTitle}>No hay tiendas registradas</h3>
                <p className={styles.emptyDescription}>
                  {search 
                    ? "Intenta cambiar el término de búsqueda" 
                    : "Comienza creando una nueva tienda"}
                </p>
                {!search && (
                  <button onClick={openCreate} className={styles.btnPrimary}>
                    Crear primera tienda
                  </button>
                )}
              </div>
            ) : (
              <table className={styles.table}>
                <thead className={styles.tableHeader}>
                  <tr>
                    <th className={styles.tableHeaderCell}>ID</th>
                    <th className={styles.tableHeaderCell}>Nombre</th>
                    <th className={styles.tableHeaderCell}>Ciudad</th>
                    <th className={styles.tableHeaderCell}>Dirección</th>
                    <th className={styles.tableHeaderCell}>Teléfono</th>
                    <th className={styles.tableHeaderCell}>Canal</th>
                    <th className={styles.tableHeaderCell}>Horario</th>
                    <th className={styles.tableHeaderCell}>Email</th>
                    <th className={styles.tableHeaderCell}>Estado</th>
                    <th className={styles.tableHeaderCell}>Acciones</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {tiendas.map(t => (
                    <tr key={t.id_tienda || t.id || t.pk} className={styles.tableRow}>
                      <td className={styles.tableCell}>
                        <span className={styles.idBadge}>{t.id_tienda ?? t.id ?? t.pk}</span>
                      </td>
                      <td className={styles.tableCell}>
                        <div className={styles.storeInfo}>
                          <span className={styles.storeName}>{t.nombre_tienda}</span>
                        </div>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={styles.cityBadge}>{t.ciudad}</span>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={styles.addressText}>{t.direccion_tienda || '—'}</span>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={styles.phoneText}>{t.telefono || '—'}</span>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={styles.channelBadge}>{t.canal || '—'}</span>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={styles.scheduleText}>{t.horario_tienda || '—'}</span>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={styles.emailText}>{t.email || '—'}</span>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={`${styles.statusBadge} ${t.estado ? styles.statusActive : styles.statusInactive}`}>
                          {t.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className={styles.tableCell}>
                        <div className={styles.actionButtons}>
                          <button 
                            onClick={() => openEdit(t.id_tienda ?? t.id ?? t.pk)} 
                            className={styles.actionBtnEdit}
                            title="Editar"
                          >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                              <path d="M11.3333 2.00001C11.5084 1.82491 11.7163 1.686 11.945 1.59076C12.1737 1.49552 12.4189 1.4458 12.6667 1.44445C12.9145 1.4458 13.1597 1.49552 13.3884 1.59076C13.6171 1.686 13.825 1.82491 14 2.00001C14.1751 2.17511 14.314 2.383 14.4092 2.61171C14.5045 2.84043 14.5542 3.08564 14.5556 3.33334C14.5542 3.58105 14.5045 3.82626 14.4092 4.05497C14.314 4.28369 14.1751 4.49157 14 4.66668L5.00001 13.6667L1.33334 14.6667L2.33334 11L11.3333 2.00001Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDelete(t.id_tienda ?? t.id ?? t.pk)} 
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
          {tiendas.length > 0 && (
            <div className={styles.pagination}>
              <div className={styles.paginationInfo}>
                Mostrando {tiendas.length} tiendas
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
                {isEditing ? 'Editar Tienda' : 'Crear Tienda'}
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
                    Nombre de la tienda
                    <span className={styles.required}>*</span>
                  </label>
                  <input 
                    name="nombre_tienda" 
                    value={form.nombre_tienda} 
                    onChange={handleChange} 
                    required 
                    className={styles.formInput}
                    placeholder="Ej: Tienda Centro"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Ciudad
                  </label>
                  <input 
                    name="ciudad" 
                    value={form.ciudad} 
                    onChange={handleChange} 
                    className={styles.formInput}
                    placeholder="Ej: Ciudad de México"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Dirección
                  </label>
                  <textarea 
                    name="direccion_tienda" 
                    value={form.direccion_tienda} 
                    onChange={handleChange} 
                    className={styles.formTextarea}
                    placeholder="Dirección completa"
                    rows="2"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Teléfono
                  </label>
                  <input 
                    name="telefono" 
                    value={form.telefono} 
                    onChange={handleChange} 
                    className={styles.formInput}
                    placeholder="Ej: 555-123-4567"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Horario
                  </label>
                  <input 
                    name="horario_tienda" 
                    value={form.horario_tienda} 
                    onChange={handleChange} 
                    className={styles.formInput}
                    placeholder="Ej: L-V 9:00-18:00"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Email
                  </label>
                  <input 
                    name="email" 
                    type="email"
                    value={form.email} 
                    onChange={handleChange} 
                    className={styles.formInput}
                    placeholder="Ej: contacto@tienda.com"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Canal
                  </label>
                  <select 
                    name="canal" 
                    value={form.canal} 
                    onChange={handleChange} 
                    className={styles.formSelect}
                  >
                    <option value="">-- Seleccionar canal --</option>
                    <option value="Físico">Físico</option>
                    <option value="Online">Online</option>
                    <option value="Mixto">Mixto</option>
                    <option value="Mayorista">Mayorista</option>
                    <option value="Minorista">Minorista</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={`${styles.formLabel} ${styles.checkboxLabel}`}>
                    <input 
                      name="estado" 
                      type="checkbox" 
                      checked={!!form.estado} 
                      onChange={handleChange} 
                      className={styles.formCheckbox}
                    />
                    <span className={styles.checkboxCustom}></span>
                    <span className={styles.checkboxText}>Tienda activa</span>
                  </label>
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
                    isEditing ? 'Guardar cambios' : 'Crear tienda'
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

export default DashboardVentaseInventariosCrudTiendas;