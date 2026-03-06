import React, { useEffect, useState } from 'react';
import styles from '../../../styles/Dashboards/dashboard-ventas-e-inventarios/AnalisisInventarios.module.css';
import {
  actualizarConetcomCampana,
  crearConetcomCampana,
  eliminarConetcomCampana,
  obtenerConetcomCampanas,
} from '../../../api/DashboardsApis/dashboards-conetcom/Dashboardconetcom_campanas';

const DashboardConectmosCampana = () => {
  const initialForm = {
    id_campana: '',
    id_producto: '',
    nombre_campana: '',
    fecha_inicio: '',
    fecha_fin: '',
    canal: '',
    segmento_objetivo: '',
  };

  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const cargar = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await obtenerConetcomCampanas();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar campanas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.id_producto) return setError('id_producto es obligatorio.');
    if (!form.nombre_campana) return setError('nombre_campana es obligatorio.');

    try {
      setSaving(true);
      const payload = { ...form, id_producto: Number(form.id_producto) };
      if (editingId) {
        await actualizarConetcomCampana(editingId, payload);
        setSuccess('Campana actualizada correctamente.');
      } else {
        await crearConetcomCampana(payload);
        setSuccess('Campana creada correctamente.');
      }
      resetForm();
      await cargar();
    } catch (err) {
      setError(err.message || 'No se pudo guardar la campana.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id_campana);
    setForm({
      id_campana: row.id_campana || '',
      id_producto: row.id_producto || '',
      nombre_campana: row.nombre_campana || '',
      fecha_inicio: row.fecha_inicio || '',
      fecha_fin: row.fecha_fin || '',
      canal: row.canal || '',
      segmento_objetivo: row.segmento_objetivo || '',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Seguro que deseas eliminar esta campana?')) return;
    try {
      await eliminarConetcomCampana(id);
      setSuccess('Campana eliminada correctamente.');
      if (editingId === id) resetForm();
      await cargar();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la campana.');
    }
  };

  return (
    <div className={styles.container}>
      <h1>CRUD Conetcom Campanas</h1>
      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
      {success ? <p style={{ color: '#0a7f35' }}>{success}</p> : null}

      <form onSubmit={handleSubmit} style={{ marginBottom: '1rem', display: 'grid', gap: '0.5rem' }}>
        <input name="id_campana" placeholder="id_campana" value={form.id_campana} onChange={handleChange} disabled={Boolean(editingId)} required />
        <input name="id_producto" placeholder="id_producto" value={form.id_producto} onChange={handleChange} required />
        <input name="nombre_campana" placeholder="nombre_campana" value={form.nombre_campana} onChange={handleChange} required />
        <input name="fecha_inicio" type="date" value={form.fecha_inicio} onChange={handleChange} />
        <input name="fecha_fin" type="date" value={form.fecha_fin} onChange={handleChange} />
        <input name="canal" placeholder="canal (retail, ecommerce, etc)" value={form.canal} onChange={handleChange} />
        <input name="segmento_objetivo" placeholder="segmento_objetivo" value={form.segmento_objetivo} onChange={handleChange} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" disabled={saving}>{editingId ? 'Actualizar' : 'Crear'}</button>
          <button type="button" onClick={resetForm}>Limpiar</button>
        </div>
      </form>

      {loading ? <p>Cargando campanas...</p> : null}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Producto</th>
              <th>Nombre</th>
              <th>Canal</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id_campana}>
                <td>{row.id_campana}</td>
                <td>{row.id_producto}</td>
                <td>{row.nombre_campana}</td>
                <td>{row.canal || '-'}</td>
                <td>{row.fecha_inicio || '-'}</td>
                <td>{row.fecha_fin || '-'}</td>
                <td style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={() => handleEdit(row)}>Editar</button>
                  <button type="button" onClick={() => handleDelete(row.id_campana)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardConectmosCampana;
