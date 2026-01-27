import React, { useEffect, useState } from 'react';
import styles from '../../../styles/CreacionUsuario.module.css';
import {
  fetchTiendas,
  createTienda,
  fetchTienda,
  updateTienda,
  deleteTienda,
} from '../../../api/DashboardsApis/dashboard-ventas-e-inventarios/DashboardApiCrudTiendas';

/**
 * Componente CRUD para Tiendas
 * - Lista tiendas pertenecientes a la empresa (según token)
 * - Crear / Editar (modal simple)
 * - Eliminar
 *
 * Dependencias: styles en CreacionUsuario.module.css (ya lo tienes).
 */

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

  // cargar lista
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {};
        if (search && search.trim()) params.search = search.trim();
        const data = await fetchTiendas(params);
        // Si tu API devuelve paginación, ajusta aquí (data.results o data)
        setTiendas(Array.isArray(data) ? data : (data.results || []));
      } catch (err) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search, refreshFlag]);

  // abrir modal para crear
  const openCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  // abrir modal para editar
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
      // refrescar lista
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

    // validación simple
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
    <div className={styles.container} style={{ fontFamily: 'Arial, sans-serif' }}>
      <h1>CRUD Tiendas</h1>

      <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Buscar por nombre, ciudad o canal..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: 8, minWidth: 260 }}
        />
        <button onClick={() => setRefreshFlag(f => f + 1)} className={styles.button}>Buscar / Refrescar</button>
        <div style={{ flex: 1 }} />
        <button onClick={openCreate} className={styles.button}>Nueva Tienda</button>
      </div>

      {loading && <div>cargando...</div>}
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}

      <div style={{ overflowX: 'auto' }}>
        <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Ciudad</th>
              <th>Dirección</th>
              <th>Teléfono</th>
              <th>Canal</th>
              <th>Horario</th>
              <th>Email</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tiendas.length === 0 && !loading && (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: 12 }}>No hay tiendas</td></tr>
            )}
            {tiendas.map(t => (
              <tr key={t.id_tienda || t.id || t.pk}>
                <td style={{ padding: 8 }}>{t.id_tienda ?? t.id ?? t.pk}</td>
                <td style={{ padding: 8 }}>{t.nombre_tienda}</td>
                <td style={{ padding: 8 }}>{t.ciudad}</td>
                <td style={{ padding: 8 }}>{t.direccion_tienda}</td>
                <td style={{ padding: 8 }}>{t.telefono}</td>
                <td style={{ padding: 8 }}>{t.canal}</td>
                <td style={{ padding: 8 }}>{t.horario_tienda}</td>
                <td style={{ padding: 8 }}>{t.email}</td>
                <td style={{ padding: 8 }}>{t.estado ? 'Activo' : 'Inactivo'}</td>
                <td style={{ padding: 8 }}>
                  <button onClick={() => openEdit(t.id_tienda ?? t.id ?? t.pk)} className={styles.smallButton}>Editar</button>
                  <button onClick={() => handleDelete(t.id_tienda ?? t.id ?? t.pk)} className={styles.smallButtonDanger} style={{ marginLeft: 6 }}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal simple */}
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
              width: 760,
              maxWidth: '95%',
              background: '#fff',
              padding: 20,
              borderRadius: 8,
              boxShadow: '0 6px 24px rgba(0,0,0,0.2)',
            }}
          >
            <h2>{isEditing ? 'Editar Tienda' : 'Crear Tienda'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label>
                  Nombre
                  <input name="nombre_tienda" value={form.nombre_tienda} onChange={handleChange} required />
                </label>
                <label>
                  Ciudad
                  <input name="ciudad" value={form.ciudad} onChange={handleChange} />
                </label>
                <label>
                  Dirección
                  <input name="direccion_tienda" value={form.direccion_tienda} onChange={handleChange} />
                </label>
                <label>
                  Teléfono
                  <input name="telefono" value={form.telefono} onChange={handleChange} />
                </label>
                <label>
                  Horario
                  <input name="horario_tienda" value={form.horario_tienda} onChange={handleChange} />
                </label>
                <label>
                  Email
                  <input name="email" value={form.email} onChange={handleChange} type="email" />
                </label>
                <label>
                  Canal
                  <input name="canal" value={form.canal} onChange={handleChange} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input name="estado" type="checkbox" checked={!!form.estado} onChange={handleChange} />
                  Activo
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

export default DashboardVentaseInventariosCrudTiendas;
