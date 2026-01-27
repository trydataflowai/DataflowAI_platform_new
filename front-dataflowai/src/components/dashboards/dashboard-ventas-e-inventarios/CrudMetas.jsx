import React, { useEffect, useState } from 'react';
import styles from '../../../styles/CreacionUsuario.module.css';
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
      fecha_meta: form.fecha_meta, // YYYY-MM-DD
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
    <div className={styles.container} style={{ fontFamily: 'Arial, sans-serif' }}>
      <h1>CRUD Metas (DashVeinte)</h1>

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
        <button onClick={openCreate} className={styles.button}>Nueva Meta</button>
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
              <th>Meta Cantidad</th>
              <th>Meta Dinero</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {metas.length === 0 && !loading && (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: 12 }}>No hay registros</td></tr>
            )}
            {metas.map(m => (
              <tr key={m.id_registro ?? m.id ?? m.pk}>
                <td style={{ padding: 8 }}>{m.id_registro ?? m.id ?? m.pk}</td>
                <td style={{ padding: 8 }}>{m.fecha_meta}</td>
                <td style={{ padding: 8 }}>{m.tienda_nombre ?? m.id_tienda}</td>
                <td style={{ padding: 8 }}>{m.producto_nombre ?? m.id_producto}</td>
                <td style={{ padding: 8 }}>{m.meta_cantidad}</td>
                <td style={{ padding: 8 }}>{m.meta_dinero}</td>
                <td style={{ padding: 8 }}>
                  <button onClick={() => openEdit(m.id_registro ?? m.id ?? m.pk)} className={styles.smallButton}>Editar</button>
                  <button onClick={() => handleDelete(m.id_registro ?? m.id ?? m.pk)} className={styles.smallButtonDanger} style={{ marginLeft: 6 }}>Eliminar</button>
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
            <h2>{isEditing ? 'Editar Meta' : 'Crear Meta'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label>
                  Fecha meta
                  <input name="fecha_meta" type="date" value={form.fecha_meta} onChange={handleChange} required />
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
                  Meta cantidad
                  <input name="meta_cantidad" type="number" value={form.meta_cantidad} onChange={handleChange} required />
                </label>

                <label>
                  Meta dinero
                  <input name="meta_dinero" type="number" step="0.01" value={form.meta_dinero} onChange={handleChange} required />
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

export default DashboardVentaseInventariosCrudMetas;
