import React, { useEffect, useState } from 'react';
import styles from '../../../styles/CreacionUsuario.module.css';
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
      // enviar como string o number según prefieras; backend acepta decimal en formato string/number
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
    <div className={styles.container} style={{ fontFamily: 'Arial, sans-serif' }}>
      <h1>CRUD Productos (DashVeinte)</h1>

      <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Buscar por nombre, categoría o marca..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: 8, minWidth: 260 }}
        />
        <button onClick={() => setRefreshFlag(f => f + 1)} className={styles.button}>Buscar / Refrescar</button>
        <div style={{ flex: 1 }} />
        <button onClick={openCreate} className={styles.button}>Nuevo Producto</button>
      </div>

      {loading && <div>cargando...</div>}
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}

      <div style={{ overflowX: 'auto' }}>
        <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Marca</th>
              <th>Valor</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.length === 0 && !loading && (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: 12 }}>No hay productos</td></tr>
            )}
            {productos.map(p => (
              <tr key={p.id_producto ?? p.id ?? p.pk}>
                <td style={{ padding: 8 }}>{p.id_producto ?? p.id ?? p.pk}</td>
                <td style={{ padding: 8 }}>{p.nombre_producto}</td>
                <td style={{ padding: 8 }}>{p.categoria}</td>
                <td style={{ padding: 8 }}>{p.marca}</td>
                <td style={{ padding: 8 }}>{p.valor_producto}</td>
                <td style={{ padding: 8 }}>
                  <button onClick={() => openEdit(p.id_producto ?? p.id ?? p.pk)} className={styles.smallButton}>Editar</button>
                  <button onClick={() => handleDelete(p.id_producto ?? p.id ?? p.pk)} className={styles.smallButtonDanger} style={{ marginLeft: 6 }}>Eliminar</button>
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
              width: 700,
              maxWidth: '95%',
              background: '#fff',
              padding: 20,
              borderRadius: 8,
              boxShadow: '0 6px 24px rgba(0,0,0,0.2)',
            }}
          >
            <h2>{isEditing ? 'Editar Producto' : 'Crear Producto'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label>
                  Nombre
                  <input name="nombre_producto" value={form.nombre_producto} onChange={handleChange} required />
                </label>
                <label>
                  Categoría
                  <input name="categoria" value={form.categoria} onChange={handleChange} />
                </label>
                <label>
                  Marca
                  <input name="marca" value={form.marca} onChange={handleChange} />
                </label>
                <label>
                  Valor
                  <input name="valor_producto" value={form.valor_producto} onChange={handleChange} type="number" step="0.01" />
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

export default DashboardVentaseInventariosCrudProductos;
