// CrudDashboardSalesCorporativo.jsx
import React, { useEffect, useState } from 'react';
import styles from '../../../styles/CrudDashboard/CrudSalesCorporativoCoti.module.css';
import { useNavigate } from 'react-router-dom';
import {
  fetchDashCorp,
  createDashCorp,
  updateDashCorp,
  deleteDashCorp,
  bulkDeleteDashCorp,
  exportDashCorp,
} from '../../../api/DashboardsCrudApis/CrudDashboardSalesCorporativo';

const emptyForm = {
  orden_compra: '',
  fecha: '',
  mes_nombre: '',
  categoria_cliente: '',
  nombre_cliente: '',
  categoria_producto: '',
  marca: '',
  producto: '',
  estado_cotizacion: '',
  unidades: '',
  precio_unitario: '',
  observaciones: '',
};

const todayISO = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

const CrudDashboardSalesCorporativoCotizaciones = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // filtros
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterCliente, setFilterCliente] = useState('');
  const [filterMarca, setFilterMarca] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  const buildFilters = () => {
    const f = {};
    if (filterFrom) f.fecha_from = filterFrom;
    if (filterTo) f.fecha_to = filterTo;
    if (filterCliente) f.nombre_cliente = filterCliente;
    if (filterMarca) f.marca = filterMarca;
    return f;
  };

  const loadItems = async (params = {}) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchDashCorp(params);
      setItems(data);
    } catch (err) {
      setError(err.message || 'Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = async () => {
    const params = buildFilters();
    await loadItems(params);
  };

  const handleDeleteFiltered = async () => {
    const filters = buildFilters();
    if (!filters || Object.keys(filters).length === 0) {
      if (!window.confirm('No hay filtros aplicados. Borrar TODOS los registros de la empresa?')) return;
    } else {
      if (!window.confirm('Borrar todos los registros filtrados? Esta accion no se puede deshacer.')) return;
    }
    setError('');
    try {
      const res = await bulkDeleteDashCorp(filters);
      alert(`Registros borrados: ${res.deleted}`);
      await loadItems(buildFilters());
    } catch (err) {
      setError(err.message || 'Error al borrar registros filtrados');
    }
  };

  const handleExport = async () => {
    setError('');
    const filters = buildFilters();
    try {
      const { blob, filename } = await exportDashCorp(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'dashboard_salescorporativo.xlsx';
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
    setForm({
      ...emptyForm,
      fecha: todayISO(),
    });
    setShowForm(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...form,
        estado_cotizacion: form.estado_cotizacion ? parseFloat(form.estado_cotizacion) : null,
        unidades: form.unidades ? parseInt(form.unidades, 10) : null,
        precio_unitario: form.precio_unitario ? parseFloat(form.precio_unitario) : null,
      };
      await createDashCorp(payload);
      setForm(emptyForm);
      setShowForm(false);
      await loadItems(buildFilters());
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (item) => {
    setForm({
      orden_compra: item.orden_compra ?? '',
      fecha: item.fecha ?? '',
      mes_nombre: item.mes_nombre ?? '',
      categoria_cliente: item.categoria_cliente ?? '',
      nombre_cliente: item.nombre_cliente ?? '',
      categoria_producto: item.categoria_producto ?? '',
      marca: item.marca ?? '',
      producto: item.producto ?? '',
      estado_cotizacion: item.estado_cotizacion ?? '',
      unidades: item.unidades ?? '',
      precio_unitario: item.precio_unitario ?? '',
      observaciones: item.observaciones ?? '',
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
        estado_cotizacion: form.estado_cotizacion ? parseFloat(form.estado_cotizacion) : null,
        unidades: form.unidades ? parseInt(form.unidades, 10) : null,
        precio_unitario: form.precio_unitario ? parseFloat(form.precio_unitario) : null,
      };
      await updateDashCorp(editingId, payload);
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
      setError('No hay id para borrar este registro.');
      return;
    }
    if (!window.confirm('Borrar registro?')) return;
    setError('');
    try {
      await deleteDashCorp(id);
      await loadItems(buildFilters());
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.cotiCorpoColxd}>
      <h1>Cotizaciones Corporativas</h1>

      <div className={styles.cotiCorpoColxdDashboardButtonsContainer}>
        <button
          onClick={() => navigate("/DashboardSalescorporativo")}
          className={`${styles.cotiCorpoColxdDashboardBtn} ${styles.cotiCorpoColxdInicio}`}
          type="button"
        >
          INICIO
        </button>

        <button
          onClick={() => navigate("/dashboardSalescorporativo/Metas")}
          className={`${styles.cotiCorpoColxdDashboardBtn} ${styles.cotiCorpoColxdMetas}`}
          type="button"
        >
          METAS
        </button>

        <button
          onClick={() => navigate("/dashboardSalescorporativo/Cotizaciones")}
          className={`${styles.cotiCorpoColxdDashboardBtn} ${styles.cotiCorpoColxdCotizaciones}`}
          type="button"
        >
          COTIZACIONES
        </button>
      </div>      

      {error && <div style={{ color: 'red' }}>{error}</div>}

      <div className={styles.cotiCorpoColxdActions}>
        <button onClick={openCreateForm}>{showForm ? 'Cerrar formulario' : 'Nuevo registro'}</button>
        <button onClick={() => loadItems(buildFilters())}>Refrescar</button>
      </div>

      {/* FILTROS */}
      <div className={styles.cotiCorpoColxdFiltrosContainer}>
        <div className={styles.cotiCorpoColxdFiltrosHeader}>
          <h3>Filtros</h3>
        </div>
        <div className={styles.cotiCorpoColxdFiltrosGrid}>
          <div className={styles.cotiCorpoColxdFiltroItem}>
            <label>Desde:</label>
            <input 
              type="date" 
              value={filterFrom} 
              onChange={(e) => setFilterFrom(e.target.value)}
              className={styles.cotiCorpoColxdFiltroInput}
            />
          </div>

          <div className={styles.cotiCorpoColxdFiltroItem}>
            <label>Hasta:</label>
            <input 
              type="date" 
              value={filterTo} 
              onChange={(e) => setFilterTo(e.target.value)}
              className={styles.cotiCorpoColxdFiltroInput}
            />
          </div>

          <div className={styles.cotiCorpoColxdFiltroItem}>
            <label>Cliente:</label>
            <input 
              placeholder="nombre cliente" 
              value={filterCliente} 
              onChange={(e) => setFilterCliente(e.target.value)}
              className={styles.cotiCorpoColxdFiltroInput}
            />
          </div>

          <div className={styles.cotiCorpoColxdFiltroItem}>
            <label>Marca:</label>
            <input 
              placeholder="marca" 
              value={filterMarca} 
              onChange={(e) => setFilterMarca(e.target.value)}
              className={styles.cotiCorpoColxdFiltroInput}
            />
          </div>

          <div className={styles.cotiCorpoColxdFiltroItem}>
            <button onClick={applyFilter}>Aplicar filtro</button>
            <button onClick={() => { setFilterFrom(''); setFilterTo(''); setFilterCliente(''); setFilterMarca(''); loadItems(); }}>
              Limpiar filtros
            </button>
          </div>

          <div className={styles.cotiCorpoColxdFiltroItem}>
            <button onClick={handleDeleteFiltered} className={styles.cotiCorpoColxdBtnDanger}>
              Borrar registros filtrados
            </button>
            <button onClick={handleExport} className={styles.cotiCorpoColxdBtnPrimary}>
              Exportar Excel
            </button>
          </div>
        </div>
      </div>

      {/* FORM */}
      {showForm && (
        <form onSubmit={editingId ? handleUpdate : handleCreate} className={styles.cotiCorpoColxdForm}>
          <div className={styles.cotiCorpoColxdFormGrid}>
            <input name="orden_compra" placeholder="orden_compra" value={form.orden_compra} onChange={handleChange} />
            <input type="date" name="fecha" placeholder="fecha" value={form.fecha || ''} onChange={handleChange} />
            <input name="mes_nombre" placeholder="mes_nombre" value={form.mes_nombre} onChange={handleChange} />

            <input name="categoria_cliente" placeholder="categoria_cliente" value={form.categoria_cliente} onChange={handleChange} />
            <input name="nombre_cliente" placeholder="nombre_cliente" value={form.nombre_cliente} onChange={handleChange} />
            <input name="categoria_producto" placeholder="categoria_producto" value={form.categoria_producto} onChange={handleChange} />

            <input name="marca" placeholder="marca" value={form.marca} onChange={handleChange} />
            <input name="producto" placeholder="producto" value={form.producto} onChange={handleChange} />
            <input name="estado_cotizacion" placeholder="estado_cotizacion" value={form.estado_cotizacion} onChange={handleChange} />

            <input name="unidades" placeholder="unidades" value={form.unidades} onChange={handleChange} />
            <input name="precio_unitario" placeholder="precio_unitario" value={form.precio_unitario} onChange={handleChange} />
            <input name="observaciones" placeholder="observaciones" value={form.observaciones} onChange={handleChange} />
          </div>

          <div className={styles.cotiCorpoColxdFormActions}>
            <button type="submit">{editingId ? 'Actualizar' : 'Crear'}</button>
            <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); setEditingId(null); }}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* TABLE */}
      <div className={styles.cotiCorpoColxdTableContainer}>
        {loading ? (
          <div className={styles.cotiCorpoColxdLoading}>Cargando...</div>
        ) : (
          <table className={styles.cotiCorpoColxdTable}>
            <thead>
              <tr>
                <th>#</th>
                <th>orden_compra</th>
                <th>fecha</th>
                <th>mes_nombre</th>
                <th>cliente</th>
                <th>marca</th>
                <th>producto</th>
                <th>estado_cot</th>
                <th>unidades</th>
                <th>precio_unit</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items && items.length ? items.map((it, idx) => {
                const id = it.id || it.pk || it.id_registro || it._id;
                return (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{it.orden_compra}</td>
                    <td>{it.fecha}</td>
                    <td>{it.mes_nombre}</td>
                    <td>{it.nombre_cliente}</td>
                    <td>{it.marca}</td>
                    <td>{it.producto}</td>
                    <td>{it.estado_cotizacion}</td>
                    <td>{it.unidades}</td>
                    <td className={styles.cotiCorpoColxdValorMonetario}>{it.precio_unitario}</td>
                    <td>
                      <div className={styles.cotiCorpoColxdAcciones}>
                        <button onClick={() => handleEdit(it)} disabled={!id} className={styles.cotiCorpoColxdBtnEdit}>Editar</button>
                        <button onClick={() => handleDelete(id)} disabled={!id} className={styles.cotiCorpoColxdBtnDelete}>Borrar</button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={11} className={styles.cotiCorpoColxdEmptyRow}>No hay registros</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CrudDashboardSalesCorporativoCotizaciones;