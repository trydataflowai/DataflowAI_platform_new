// CrudDashboardSalesReview.jsx
import React, { useEffect, useState } from 'react';
import styles from '../../../styles/CreacionUsuario.module.css';
import {
  fetchDashSales,
  createDashSale,
  updateDashSale,
  deleteDashSale,
  bulkDeleteDashSales,
} from '../../../api/DashboardsCrudApis/CrudDashboardSalesreview';

const emptyForm = {
  mes: '',
  mes_numero: '',
  semana: '',
  dia_compra: '',
  fecha_compra: '',
  fecha_envio: '',
  numero_pedido: '',
  numero_oc: '',
  estado: '',
  linea: '',
  fuente: '',
  sku_enviado: '',
  categoria: '',
  producto: '',
  precio_unidad_antes_iva: '',
  unidades: '',
  ingresos_antes_iva: '',
};

const todayISO = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
};

const CrudDashboardSalesReview = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // filters: solo fechas
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  const buildFilters = () => {
    const f = {};
    if (filterFrom) f.fecha_from = filterFrom;
    if (filterTo) f.fecha_to = filterTo;
    return f;
  };

  const loadItems = async (params = {}) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchDashSales(params);
      console.log('items from API:', data);
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
      if (!window.confirm('No hay filtros aplicados. ¿Eliminar TODOS los registros de la empresa?')) return;
    } else {
      if (!window.confirm('¿Eliminar todos los registros filtrados? Esta acción no se puede deshacer.')) return;
    }
    setError('');
    try {
      const res = await bulkDeleteDashSales(filters);
      alert(`Registros eliminados: ${res.deleted}`);
      // refrescar con los mismos filtros (si quedaron)
      await loadItems(buildFilters());
    } catch (err) {
      setError(err.message || 'Error al eliminar registros filtrados');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      fecha_compra: todayISO(),
      fecha_envio: todayISO(),
    });
    setShowForm(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...form,
        mes_numero: form.mes_numero ? parseInt(form.mes_numero, 10) : null,
        precio_unidad_antes_iva: form.precio_unidad_antes_iva ? parseFloat(form.precio_unidad_antes_iva) : null,
        unidades: form.unidades ? parseInt(form.unidades, 10) : null,
        ingresos_antes_iva: form.ingresos_antes_iva ? parseFloat(form.ingresos_antes_iva) : null,
      };
      await createDashSale(payload);
      setForm(emptyForm);
      setShowForm(false);
      await loadItems(buildFilters());
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (item) => {
    // Load form with server-provided values (dates must be YYYY-MM-DD)
    setForm({
      mes: item.mes ?? '',
      mes_numero: item.mes_numero ?? '',
      semana: item.semana ?? '',
      dia_compra: item.dia_compra ?? '',
      fecha_compra: item.fecha_compra ?? '',
      fecha_envio: item.fecha_envio ?? '',
      numero_pedido: item.numero_pedido ?? '',
      numero_oc: item.numero_oc ?? '',
      estado: item.estado ?? '',
      linea: item.linea ?? '',
      fuente: item.fuente ?? '',
      sku_enviado: item.sku_enviado ?? '',
      categoria: item.categoria ?? '',
      producto: item.producto ?? '',
      precio_unidad_antes_iva: item.precio_unidad_antes_iva ?? '',
      unidades: item.unidades ?? '',
      ingresos_antes_iva: item.ingresos_antes_iva ?? '',
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
        mes_numero: form.mes_numero ? parseInt(form.mes_numero, 10) : null,
        precio_unidad_antes_iva: form.precio_unidad_antes_iva ? parseFloat(form.precio_unidad_antes_iva) : null,
        unidades: form.unidades ? parseInt(form.unidades, 10) : null,
        ingresos_antes_iva: form.ingresos_antes_iva ? parseFloat(form.ingresos_antes_iva) : null,
      };
      // Note: backend forces id_producto al DEFAULT_PRODUCT_ID
      await updateDashSale(editingId, payload);
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
    if (!window.confirm('¿Eliminar registro?')) return;
    setError('');
    try {
      await deleteDashSale(id);
      await loadItems(buildFilters());
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Dashboard Sales Review — CRUD</h1>

      {error && <div style={{ color: 'red' }}>{error}</div>}

      <div style={{ marginBottom: 12 }}>
        <button onClick={openCreateForm}>{showForm ? 'Cerrar formulario' : 'Nuevo registro'}</button>
        <button onClick={() => loadItems(buildFilters())} style={{ marginLeft: 8 }}>Refrescar</button>
      </div>

      {/* FILTROS: SOLO FECHAS */}
      <div style={{ marginBottom: 12, border: '1px solid #ddd', padding: 10, borderRadius: 6 }}>
        <strong>Filtrar por fecha (fecha_compra):</strong>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
          <label>
            Desde:
            <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
          </label>

          <label>
            Hasta:
            <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
          </label>

          <button onClick={applyFilter}>Aplicar filtro</button>
          <button onClick={() => { setFilterFrom(''); setFilterTo(''); loadItems(); }} style={{ marginLeft: 8 }}>
            Limpiar filtros
          </button>

          <button onClick={handleDeleteFiltered} style={{ marginLeft: 12, background: '#ef5350', color: 'white' }}>
            Eliminar registros filtrados
          </button>
        </div>
      </div>

      {/* FORM */}
      {showForm && (
        <form onSubmit={editingId ? handleUpdate : handleCreate} style={{ marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <input name="mes" placeholder="mes" value={form.mes} onChange={handleChange} />
            <input name="mes_numero" placeholder="mes_numero" value={form.mes_numero} onChange={handleChange} />
            <input name="semana" placeholder="semana" value={form.semana} onChange={handleChange} />

            <input name="dia_compra" placeholder="dia_compra" value={form.dia_compra} onChange={handleChange} />
            <input type="date" name="fecha_compra" placeholder="fecha_compra" value={form.fecha_compra || ''} onChange={handleChange} />
            <input type="date" name="fecha_envio" placeholder="fecha_envio" value={form.fecha_envio || ''} onChange={handleChange} />

            <input name="numero_pedido" placeholder="numero_pedido" value={form.numero_pedido} onChange={handleChange} />
            <input name="numero_oc" placeholder="numero_oc" value={form.numero_oc} onChange={handleChange} />
            <input name="estado" placeholder="estado" value={form.estado} onChange={handleChange} />

            <input name="linea" placeholder="linea" value={form.linea} onChange={handleChange} />
            <input name="fuente" placeholder="fuente" value={form.fuente} onChange={handleChange} />
            <input name="sku_enviado" placeholder="sku_enviado" value={form.sku_enviado} onChange={handleChange} />

            <input name="categoria" placeholder="categoria" value={form.categoria} onChange={handleChange} />
            <input name="producto" placeholder="producto" value={form.producto} onChange={handleChange} />
            <input name="precio_unidad_antes_iva" placeholder="precio_unidad_antes_iva" value={form.precio_unidad_antes_iva} onChange={handleChange} />

            <input name="unidades" placeholder="unidades" value={form.unidades} onChange={handleChange} />
            <input name="ingresos_antes_iva" placeholder="ingresos_antes_iva" value={form.ingresos_antes_iva} onChange={handleChange} />
          </div>

          <div style={{ marginTop: 10 }}>
            <button type="submit">{editingId ? 'Actualizar' : 'Crear'}</button>
            <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); setEditingId(null); }} style={{ marginLeft: 8 }}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* TABLE */}
      <div>
        {loading ? (
          <div>Cargando...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>#</th>
                <th>mes</th>
                <th>mes_numero</th>
                <th>semana</th>
                <th>dia_compra</th>
                <th>fecha_compra</th>
                <th>fecha_envio</th>
                <th>producto</th>
                <th>precio</th>
                <th>unidades</th>
                <th>ingresos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items && items.length ? items.map((it, idx) => {
                const id = it.id || it.pk || it.id_registro || it._id;
                return (
                  <tr key={idx} style={{ borderTop: '1px solid #ddd' }}>
                    <td>{idx + 1}</td>
                    <td>{it.mes}</td>
                    <td>{it.mes_numero}</td>
                    <td>{it.semana}</td>
                    <td>{it.dia_compra}</td>
                    <td>{it.fecha_compra}</td>
                    <td>{it.fecha_envio}</td>
                    <td>{it.producto}</td>
                    <td>{it.precio_unidad_antes_iva}</td>
                    <td>{it.unidades}</td>
                    <td>{it.ingresos_antes_iva}</td>
                    <td>
                      <button onClick={() => handleEdit(it)} disabled={!id}>Editar</button>
                      <button onClick={() => handleDelete(id)} disabled={!id} style={{ marginLeft: 8 }}>Eliminar</button>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={12}>No hay registros</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CrudDashboardSalesReview;
