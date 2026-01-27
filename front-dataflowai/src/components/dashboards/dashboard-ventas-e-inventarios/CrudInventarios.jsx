import React, { useEffect, useState } from 'react';
import styles from '../../../styles/CreacionUsuario.module.css';
import {
  fetchDashVeinteInventarios,
  fetchDashVeinteInventario,
  createDashVeinteInventario,
  updateDashVeinteInventario,
  deleteDashVeinteInventario,
  fetchTiendasForSelect,
  fetchProductosForSelect,
} from '../../../api/DashboardsApis/dashboard-ventas-e-inventarios/DashboardApiCrudInventarios';

const emptyForm = {
  id_tienda: '',
  id_producto: '',
  inventario_cantidad: '',
};

const DashboardVentaseInventariosCrudInventarios = () => {
  const [inventarios, setInventarios] = useState([]);
  const [tiendas, setTiendas] = useState([]);
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
        const data = await fetchDashVeinteInventarios(params);
        setInventarios(Array.isArray(data) ? data : (data.results || []));
      } catch (err) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search, refreshFlag]);

  useEffect(() => {
    // cargar tiendas y productos para selects (silencioso)
    const loadSelects = async () => {
      try {
        const [t, p] = await Promise.all([fetchTiendasForSelect(), fetchProductosForSelect()]);
        setTiendas(Array.isArray(t) ? t : (t.results || []));
        setProductos(Array.isArray(p) ? p : (p.results || []));
      } catch (err) {
        // no bloquear la UI principal; mostrar en consola
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
      const data = await fetchDashVeinteInventario(id);
      setForm({
        id_tienda: data.id_tienda ?? '',
        id_producto: data.id_producto ?? '',
        inventario_cantidad: data.inventario_cantidad ?? '',
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
    if (!window.confirm('¿Eliminar registro de inventario?')) return;
    setLoading(true);
    setError(null);
    try {
      await deleteDashVeinteInventario(id);
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

    if (!form.id_tienda || !form.id_producto) {
      setError('Seleccione tienda y producto');
      setLoading(false);
      return;
    }
    if (form.inventario_cantidad === '' || isNaN(Number(form.inventario_cantidad))) {
      setError('Cantidad de inventario inválida');
      setLoading(false);
      return;
    }

    const payload = {
      id_tienda: Number(form.id_tienda),
      id_producto: Number(form.id_producto),
      inventario_cantidad: Number(form.inventario_cantidad),
    };

    try {
      if (isEditing && editingId) {
        await updateDashVeinteInventario(editingId, payload);
        alert('Inventario actualizado');
      } else {
        await createDashVeinteInventario(payload);
        alert('Inventario creado');
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
      <h1>CRUD Inventarios (DashVeinte)</h1>

      <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: 8, minWidth: 260 }}
        />
        <button onClick={() => setRefreshFlag(f => f + 1)} className={styles.button}>Buscar / Refrescar</button>
        <div style={{ flex: 1 }} />
        <button onClick={openCreate} className={styles.button}>Nuevo Registro</button>
      </div>

      {loading && <div>cargando...</div>}
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}

      <div style={{ overflowX: 'auto' }}>
        <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tienda</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {inventarios.length === 0 && !loading && (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: 12 }}>No hay registros</td></tr>
            )}
            {inventarios.map(inv => (
              <tr key={inv.id_registro ?? inv.id ?? inv.pk}>
                <td style={{ padding: 8 }}>{inv.id_registro ?? inv.id ?? inv.pk}</td>
                <td style={{ padding: 8 }}>{inv.tienda_nombre ?? inv.id_tienda}</td>
                <td style={{ padding: 8 }}>{inv.producto_nombre ?? inv.id_producto}</td>
                <td style={{ padding: 8 }}>{inv.inventario_cantidad}</td>
                <td style={{ padding: 8 }}>
                  <button onClick={() => openEdit(inv.id_registro ?? inv.id ?? inv.pk)} className={styles.smallButton}>Editar</button>
                  <button onClick={() => handleDelete(inv.id_registro ?? inv.id ?? inv.pk)} className={styles.smallButtonDanger} style={{ marginLeft: 6 }}>Eliminar</button>
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
              width: 660,
              maxWidth: '95%',
              background: '#fff',
              padding: 20,
              borderRadius: 8,
              boxShadow: '0 6px 24px rgba(0,0,0,0.2)',
            }}
          >
            <h2>{isEditing ? 'Editar Inventario' : 'Crear Inventario'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
                  Cantidad
                  <input name="inventario_cantidad" value={form.inventario_cantidad} onChange={handleChange} type="number" />
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

export default DashboardVentaseInventariosCrudInventarios;
