import React, { useEffect, useState } from 'react';
import styles from '../../../styles/Dashboards/dashboard-ventas-e-inventarios/AnalisisInventarios.module.css';
import {
  actualizarConetcomInteraccionCampana,
  crearConetcomInteraccionCampana,
  eliminarConetcomInteraccionCampana,
  obtenerConetcomInteraccionesCampanas,
} from '../../../api/DashboardsApis/dashboards-conetcom/Dashboardconetcom_interacciones_campanas';

const DashboardConectmosInteraccionesCampanas = () => {
  const initialForm = {
    id_interaccion: '',
    id_producto: '',
    id_campana: '',
    id_cliente: '',
    fecha_envio: '',
    abrio_mensaje: false,
    hizo_clic: false,
    genero_conversion: false,
    ingresos_generados: '',
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
      const data = await obtenerConetcomInteraccionesCampanas();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar interacciones.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { cargar(); }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };
  const resetForm = () => { setForm(initialForm); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      setSaving(true);
      const payload = {
        ...form,
        id_producto: Number(form.id_producto),
        ingresos_generados: form.ingresos_generados === '' ? null : Number(form.ingresos_generados),
      };
      if (editingId) {
        await actualizarConetcomInteraccionCampana(editingId, payload);
        setSuccess('Interaccion actualizada correctamente.');
      } else {
        await crearConetcomInteraccionCampana(payload);
        setSuccess('Interaccion creada correctamente.');
      }
      resetForm();
      await cargar();
    } catch (err) {
      setError(err.message || 'No se pudo guardar la interaccion.');
    } finally {
      setSaving(false);
    }
  };

  const toDateTimeLocal = (val) => (val ? String(val).slice(0, 16) : '');

  const handleEdit = (row) => {
    setEditingId(row.id_interaccion);
    setForm({
      id_interaccion: row.id_interaccion || '',
      id_producto: row.id_producto || '',
      id_campana: row.id_campana || '',
      id_cliente: row.id_cliente || '',
      fecha_envio: toDateTimeLocal(row.fecha_envio),
      abrio_mensaje: Boolean(row.abrio_mensaje),
      hizo_clic: Boolean(row.hizo_clic),
      genero_conversion: Boolean(row.genero_conversion),
      ingresos_generados: row.ingresos_generados ?? '',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Seguro que deseas eliminar esta interaccion?')) return;
    try {
      await eliminarConetcomInteraccionCampana(id);
      setSuccess('Interaccion eliminada correctamente.');
      if (editingId === id) resetForm();
      await cargar();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la interaccion.');
    }
  };

  return (
    <div className={styles.container}>
      <h1>CRUD Conetcom Interacciones Campanas</h1>
      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
      {success ? <p style={{ color: '#0a7f35' }}>{success}</p> : null}
      <form onSubmit={handleSubmit} style={{ marginBottom: '1rem', display: 'grid', gap: '0.5rem' }}>
        <input name="id_interaccion" placeholder="id_interaccion" value={form.id_interaccion} onChange={handleChange} disabled={Boolean(editingId)} required />
        <input name="id_producto" placeholder="id_producto" value={form.id_producto} onChange={handleChange} required />
        <input name="id_campana" placeholder="id_campana" value={form.id_campana} onChange={handleChange} required />
        <input name="id_cliente" placeholder="id_cliente" value={form.id_cliente} onChange={handleChange} required />
        <input name="fecha_envio" type="datetime-local" value={form.fecha_envio} onChange={handleChange} />
        <label><input type="checkbox" name="abrio_mensaje" checked={form.abrio_mensaje} onChange={handleChange} /> abrio_mensaje</label>
        <label><input type="checkbox" name="hizo_clic" checked={form.hizo_clic} onChange={handleChange} /> hizo_clic</label>
        <label><input type="checkbox" name="genero_conversion" checked={form.genero_conversion} onChange={handleChange} /> genero_conversion</label>
        <input name="ingresos_generados" placeholder="ingresos_generados" value={form.ingresos_generados} onChange={handleChange} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" disabled={saving}>{editingId ? 'Actualizar' : 'Crear'}</button>
          <button type="button" onClick={resetForm}>Limpiar</button>
        </div>
      </form>
      {loading ? <p>Cargando interacciones...</p> : null}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th>ID</th><th>Campana</th><th>Cliente</th><th>Abrio</th><th>Clic</th><th>Conv.</th><th>Acciones</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id_interaccion}>
                <td>{row.id_interaccion}</td><td>{row.id_campana}</td><td>{row.id_cliente}</td><td>{row.abrio_mensaje ? 'Si' : 'No'}</td><td>{row.hizo_clic ? 'Si' : 'No'}</td><td>{row.genero_conversion ? 'Si' : 'No'}</td>
                <td style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={() => handleEdit(row)}>Editar</button>
                  <button type="button" onClick={() => handleDelete(row.id_interaccion)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardConectmosInteraccionesCampanas;
