import React, { useEffect, useState } from 'react';
import styles from '../../../styles/Dashboards/dashboard-ventas-e-inventarios/AnalisisInventarios.module.css';
import {
  actualizarConetcomRegistroTraficoConsumo,
  crearConetcomRegistroTraficoConsumo,
  eliminarConetcomRegistroTraficoConsumo,
  obtenerConetcomTraficoConsumo,
} from '../../../api/DashboardsApis/dashboards-conetcom/Dashboardconetcom_trafico_consumo';

const DashboardConectmosTraficoConsumo = () => {
  const initialForm = {
    id_registro: '',
    id_producto: '',
    id_cliente: '',
    fecha: '',
    consumo_descarga_gb: '',
    consumo_subida_gb: '',
    velocidad_pico_mbps: '',
    velocidad_promedio_mbps: '',
    numero_sesiones: '',
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
      const data = await obtenerConetcomTraficoConsumo();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'No se pudo cargar trafico y consumo.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { cargar(); }, []);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const resetForm = () => { setForm(initialForm); setEditingId(null); };

  const toNumOrNull = (v) => (v === '' ? null : Number(v));
  const toIntOrNull = (v) => (v === '' ? null : parseInt(v, 10));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      setSaving(true);
      const payload = {
        ...form,
        id_producto: Number(form.id_producto),
        consumo_descarga_gb: toNumOrNull(form.consumo_descarga_gb),
        consumo_subida_gb: toNumOrNull(form.consumo_subida_gb),
        velocidad_pico_mbps: toNumOrNull(form.velocidad_pico_mbps),
        velocidad_promedio_mbps: toNumOrNull(form.velocidad_promedio_mbps),
        numero_sesiones: toIntOrNull(form.numero_sesiones),
      };
      if (editingId) {
        await actualizarConetcomRegistroTraficoConsumo(editingId, payload);
        setSuccess('Registro actualizado correctamente.');
      } else {
        await crearConetcomRegistroTraficoConsumo(payload);
        setSuccess('Registro creado correctamente.');
      }
      resetForm();
      await cargar();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el registro.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id_registro);
    setForm({
      id_registro: row.id_registro || '',
      id_producto: row.id_producto || '',
      id_cliente: row.id_cliente || '',
      fecha: row.fecha || '',
      consumo_descarga_gb: row.consumo_descarga_gb ?? '',
      consumo_subida_gb: row.consumo_subida_gb ?? '',
      velocidad_pico_mbps: row.velocidad_pico_mbps ?? '',
      velocidad_promedio_mbps: row.velocidad_promedio_mbps ?? '',
      numero_sesiones: row.numero_sesiones ?? '',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Seguro que deseas eliminar este registro?')) return;
    try {
      await eliminarConetcomRegistroTraficoConsumo(id);
      setSuccess('Registro eliminado correctamente.');
      if (editingId === id) resetForm();
      await cargar();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el registro.');
    }
  };

  return (
    <div className={styles.container}>
      <h1>CRUD Conetcom Trafico Consumo</h1>
      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
      {success ? <p style={{ color: '#0a7f35' }}>{success}</p> : null}
      <form onSubmit={handleSubmit} style={{ marginBottom: '1rem', display: 'grid', gap: '0.5rem' }}>
        <input name="id_registro" placeholder="id_registro" value={form.id_registro} onChange={handleChange} disabled={Boolean(editingId)} required />
        <input name="id_producto" placeholder="id_producto" value={form.id_producto} onChange={handleChange} required />
        <input name="id_cliente" placeholder="id_cliente" value={form.id_cliente} onChange={handleChange} required />
        <input name="fecha" type="date" value={form.fecha} onChange={handleChange} required />
        <input name="consumo_descarga_gb" placeholder="consumo_descarga_gb" value={form.consumo_descarga_gb} onChange={handleChange} />
        <input name="consumo_subida_gb" placeholder="consumo_subida_gb" value={form.consumo_subida_gb} onChange={handleChange} />
        <input name="velocidad_pico_mbps" placeholder="velocidad_pico_mbps" value={form.velocidad_pico_mbps} onChange={handleChange} />
        <input name="velocidad_promedio_mbps" placeholder="velocidad_promedio_mbps" value={form.velocidad_promedio_mbps} onChange={handleChange} />
        <input name="numero_sesiones" placeholder="numero_sesiones" value={form.numero_sesiones} onChange={handleChange} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" disabled={saving}>{editingId ? 'Actualizar' : 'Crear'}</button>
          <button type="button" onClick={resetForm}>Limpiar</button>
        </div>
      </form>
      {loading ? <p>Cargando registros...</p> : null}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th>ID</th><th>Cliente</th><th>Fecha</th><th>Descarga GB</th><th>Subida GB</th><th>Acciones</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id_registro}>
                <td>{row.id_registro}</td><td>{row.id_cliente}</td><td>{row.fecha}</td><td>{row.consumo_descarga_gb ?? '-'}</td><td>{row.consumo_subida_gb ?? '-'}</td>
                <td style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={() => handleEdit(row)}>Editar</button>
                  <button type="button" onClick={() => handleDelete(row.id_registro)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardConectmosTraficoConsumo;
