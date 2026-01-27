import React, { useEffect, useState } from 'react';
import styles from '../../../styles/CreacionUsuario.module.css';
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
      fecha_venta: form.fecha_venta, // YYYY-MM-DD
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
    <div className={styles.container} style={{ fontFamily: 'Arial, sans-serif' }}>
      <h1>CRUD Ventas (DashVeinte)</h1>

      <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Buscar por tienda o producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: 8, minWidth: 220 }}
        />
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <button onClick={() => setRefreshFlag(f => f + 1)} className={styles.button}>Buscar / Refrescar</button>
        <div style={{ flex: 1 }} />
        <button onClick={openCreate} className={styles.button}>Nueva Venta</button>
      </div>

      {loading && <div>cargando...</div>}
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}

      <div style={{ overflowX: 'auto' }}>
        <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Tienda</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Dinero</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ventas.length === 0 && !loading && (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: 12 }}>No hay registros</td></tr>
            )}
            {ventas.map(v => (
              <tr key={v.id_registro ?? v.id ?? v.pk}>
                <td style={{ padding: 8 }}>{v.id_registro ?? v.id ?? v.pk}</td>
                <td style={{ padding: 8 }}>{v.fecha_venta}</td>
                <td style={{ padding: 8 }}>{v.tienda_nombre ?? v.id_tienda}</td>
                <td style={{ padding: 8 }}>{v.producto_nombre ?? v.id_producto}</td>
                <td style={{ padding: 8 }}>{v.cantidad_vendida}</td>
                <td style={{ padding: 8 }}>{v.dinero_vendido}</td>
                <td style={{ padding: 8 }}>
                  <button onClick={() => openEdit(v.id_registro ?? v.id ?? v.pk)} className={styles.smallButton}>Editar</button>
                  <button onClick={() => handleDelete(v.id_registro ?? v.id ?? v.pk)} className={styles.smallButtonDanger} style={{ marginLeft: 6 }}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div
          style={{
            position: 'fixed',
            left: 0, top: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999,
          }}
          onMouseDown={() => setShowModal(false)}
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: 720,
              maxWidth: '95%',
              background: '#fff',
              padding: 20,
              borderRadius: 8,
              boxShadow: '0 6px 24px rgba(0,0,0,0.2)',
            }}
          >
            <h2>{isEditing ? 'Editar Venta' : 'Crear Venta'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label>
                  Fecha venta
                  <input name="fecha_venta" type="date" value={form.fecha_venta} onChange={handleChange} required />
                </label>

                <label>
                  Tienda
                  <select name="id_tienda" value={form.id_tienda} onChange={handleChange} required>
                    <option value="">-- seleccionar --</option>
                    {tiendas.map(t => (
                      <option key={t.id_tienda ?? t.id ?? t.pk} value={t.id_tienda ?? t.id ?? t.pk}>
                        {t.nombre_tienda ?? t.nombre}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Producto
                  <select name="id_producto" value={form.id_producto} onChange={handleChange} required>
                    <option value="">-- seleccionar --</option>
                    {productos.map(p => (
                      <option key={p.id_producto ?? p.id ?? p.pk} value={p.id_producto ?? p.id ?? p.pk}>
                        {p.nombre_producto ?? p.nombre}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Cantidad vendida
                  <input name="cantidad_vendida" type="number" value={form.cantidad_vendida} onChange={handleChange} required />
                </label>

                <label>
                  Dinero vendido
                  <input name="dinero_vendido" type="number" step="0.01" value={form.dinero_vendido} onChange={handleChange} required />
                </label>
              </div>

              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.button}>Cancelar</button>
                <button type="submit" disabled={loading} className={styles.buttonPrimary}>
                  {isEditing ? 'Guardar cambios' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardVentaseInventariosCrudVentas;
