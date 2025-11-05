// CrudDashboardSalesCorporativoMetas.jsx
import React, { useEffect, useState } from 'react';
import styles from '../../../styles/CrudDashboard/CrudSalesCorporativoMetas.module.css';
import { useNavigate } from 'react-router-dom';
import {
  fetchDashMetas,
  createDashMeta,
  updateDashMeta,
  deleteDashMeta,
  bulkDeleteDashMetas,
  exportDashMetas,
} from '../../../api/DashboardsCrudApis/CrudDashboardSalesCorporativoMetas';

const emptyForm = {
  ano: '',
  mes: '',
  categoria_cliente: '',
  nombre_cliente: '',
  categoria_producto: '',
  meta: '',
};

const CrudDashboardSalesCorporativoMetas = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // filtros simples
  const [filterAno, setFilterAno] = useState('');
  const [filterMes, setFilterMes] = useState('');
  const [filterCategoriaCliente, setFilterCategoriaCliente] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  const buildFilters = () => {
    const f = {};
    if (filterAno) f.ano = filterAno;
    if (filterMes) f.mes = filterMes;
    if (filterCategoriaCliente) f.categoria_cliente = filterCategoriaCliente;
    return f;
  };

  const loadItems = async (params = {}) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchDashMetas(params);
      setItems(data);
    } catch (err) {
      setError(err.message || 'Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = async () => {
    await loadItems(buildFilters());
  };

  const handleDeleteFiltered = async () => {
    const filters = buildFilters();
    if (!filters || Object.keys(filters).length === 0) {
      if (!window.confirm('No hay filtros aplicados. ¿Eliminar TODOS los registros de la empresa?')) return;
    } else {
      if (!window.confirm('¿Eliminar todos los registros filtrados? Esta accion no se puede deshacer.')) return;
    }
    setError('');
    try {
      const res = await bulkDeleteDashMetas(filters);
      alert(`Registros eliminados: ${res.deleted}`);
      await loadItems(buildFilters());
    } catch (err) {
      setError(err.message || 'Error al eliminar registros filtrados');
    }
  };

  const handleExport = async () => {
    setError('');
    const filters = buildFilters();
    try {
      const { blob, filename } = await exportDashMetas(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'dashboard_salescorporativometas.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Error al exportar datos');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(s => ({ ...s, [name]: value }));
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm, ano: new Date().getFullYear() });
    setShowForm(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...form,
        ano: form.ano ? parseInt(form.ano, 10) : null,
        meta: form.meta ? parseFloat(form.meta) : null,
      };
      await createDashMeta(payload);
      setForm(emptyForm);
      setShowForm(false);
      await loadItems(buildFilters());
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (item) => {
    setForm({
      ano: item.ano ?? '',
      mes: item.mes ?? '',
      categoria_cliente: item.categoria_cliente ?? '',
      nombre_cliente: item.nombre_cliente ?? '',
      categoria_producto: item.categoria_producto ?? '',
      meta: item.meta ?? '',
    });
    const id = item.id || item.pk || item.id_registro || item._id;
    setEditingId(id || null);
    setShowForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingId) {
      setError('No hay registro seleccionado para editar.');
      return;
    }
    setError('');
    try {
      const payload = {
        ...form,
        ano: form.ano ? parseInt(form.ano, 10) : null,
        meta: form.meta ? parseFloat(form.meta) : null,
      };
      await updateDashMeta(editingId, payload);
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      await loadItems(buildFilters());
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!id) {
      setError('No hay id para eliminar este registro.');
      return;
    }
    if (!window.confirm('Eliminar registro?')) return;
    setError('');
    try {
      await deleteDashMeta(id);
      await loadItems(buildFilters());
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.metaCorpoColxd}>
      <h1>Metas Corporativas</h1>

      <div className={styles.metaCorpoColxdDashboardButtonsContainer}>
        <button
          onClick={() => navigate("/DashboardSalescorporativo")}
          className={`${styles.metaCorpoColxdDashboardBtn} ${styles.metaCorpoColxdInicio}`}
          type="button"
        >
          INICIO
        </button>

        <button
          onClick={() => navigate("/dashboardSalescorporativo/Metas")}
          className={`${styles.metaCorpoColxdDashboardBtn} ${styles.metaCorpoColxdMetas}`}
          type="button"
        >
          METAS
        </button>

        <button
          onClick={() => navigate("/dashboardSalescorporativo/Cotizaciones")}
          className={`${styles.metaCorpoColxdDashboardBtn} ${styles.metaCorpoColxdCotizaciones}`}
          type="button"
        >
          COTIZACIONES
        </button>
      </div>

      {error && <div className={styles.metaCorpoColxdError}>{error}</div>}

      <div className={styles.metaCorpoColxdActions}>
        <button onClick={openCreateForm}>{showForm ? 'Cerrar formulario' : 'Nuevo registro'}</button>
        <button onClick={() => loadItems(buildFilters())}>Refrescar</button>
      </div>

      {/* filtros */}
      <div className={styles.metaCorpoColxdFiltrosContainer}>
        <div className={styles.metaCorpoColxdFiltrosHeader}>
          <h3>Filtros</h3>
        </div>
        <div className={styles.metaCorpoColxdFiltrosGrid}>
          <div className={styles.metaCorpoColxdFiltroItem}>
            <label>Año:</label>
            <input 
              placeholder="ano" 
              value={filterAno} 
              onChange={(e) => setFilterAno(e.target.value)}
              className={styles.metaCorpoColxdFiltroInput}
            />
          </div>

          <div className={styles.metaCorpoColxdFiltroItem}>
            <label>Mes:</label>
            <input 
              placeholder="mes" 
              value={filterMes} 
              onChange={(e) => setFilterMes(e.target.value)}
              className={styles.metaCorpoColxdFiltroInput}
            />
          </div>

          <div className={styles.metaCorpoColxdFiltroItem}>
            <label>Categoria Cliente:</label>
            <input 
              placeholder="categoria cliente" 
              value={filterCategoriaCliente} 
              onChange={(e) => setFilterCategoriaCliente(e.target.value)}
              className={styles.metaCorpoColxdFiltroInput}
            />
          </div>

          <div className={styles.metaCorpoColxdFiltroItem}>
            <button onClick={applyFilter}>Aplicar filtro</button>
            <button onClick={() => { setFilterAno(''); setFilterMes(''); setFilterCategoriaCliente(''); loadItems(); }}>
              Limpiar filtros
            </button>
          </div>

          <div className={styles.metaCorpoColxdFiltroItem}>
            <button onClick={handleDeleteFiltered} className={styles.metaCorpoColxdBtnDanger}>
              Eliminar registros filtrados
            </button>
            <button onClick={handleExport} className={styles.metaCorpoColxdBtnPrimary}>
              Exportar Excel
            </button>
          </div>
        </div>
      </div>

      {/* form */}
      {showForm && (
        <form onSubmit={editingId ? handleUpdate : handleCreate} className={styles.metaCorpoColxdForm}>
          <div className={styles.metaCorpoColxdFormGrid}>
            <input name="ano" type="number" placeholder="ano" value={form.ano} onChange={handleChange} />
            <input name="mes" placeholder="mes" value={form.mes} onChange={handleChange} />
            <input name="categoria_cliente" placeholder="categoria_cliente" value={form.categoria_cliente} onChange={handleChange} />

            <input name="nombre_cliente" placeholder="nombre_cliente" value={form.nombre_cliente} onChange={handleChange} />
            <input name="categoria_producto" placeholder="categoria_producto" value={form.categoria_producto} onChange={handleChange} />
            <input name="meta" type="number" step="0.01" placeholder="meta" value={form.meta} onChange={handleChange} />
          </div>

          <div className={styles.metaCorpoColxdFormActions}>
            <button type="submit">{editingId ? 'Actualizar' : 'Crear'}</button>
            <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); setEditingId(null); }}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* table */}
      <div className={styles.metaCorpoColxdTableContainer}>
        {loading ? (
          <div className={styles.metaCorpoColxdLoading}>Cargando...</div>
        ) : (
          <table className={styles.metaCorpoColxdTable}>
            <thead>
              <tr>
                <th>#</th>
                <th>ano</th>
                <th>mes</th>
                <th>categoria_cliente</th>
                <th>nombre_cliente</th>
                <th>categoria_producto</th>
                <th>meta</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items && items.length ? items.map((it, idx) => {
                const id = it.id || it.pk || it.id_registro || it._id;
                return (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{it.ano}</td>
                    <td>{it.mes}</td>
                    <td>{it.categoria_cliente}</td>
                    <td>{it.nombre_cliente}</td>
                    <td>{it.categoria_producto}</td>
                    <td className={styles.metaCorpoColxdValorMeta}>{it.meta}</td>
                    <td>
                      <div className={styles.metaCorpoColxdAcciones}>
                        <button onClick={() => handleEdit(it)} disabled={!id} className={styles.metaCorpoColxdBtnEdit}>Editar</button>
                        <button onClick={() => handleDelete(id)} disabled={!id} className={styles.metaCorpoColxdBtnDelete}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={8} className={styles.metaCorpoColxdEmptyRow}>No hay registros</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CrudDashboardSalesCorporativoMetas;