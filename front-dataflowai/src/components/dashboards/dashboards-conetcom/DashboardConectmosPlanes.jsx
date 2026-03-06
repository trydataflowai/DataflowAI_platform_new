import React, { useEffect, useState } from 'react';
import styles from '../../../styles/Dashboards/dashboard-ventas-e-inventarios/AnalisisInventarios.module.css';
import {
  actualizarConetcomPlan,
  crearConetcomPlan,
  eliminarConetcomPlan,
  obtenerConetcomPlanes,
} from '../../../api/DashboardsApis/dashboards-conetcom/Dashboardconetcom_planes';

const DashboardConectmosPlanes = () => {
  const initialForm = {
    id_plan: '',
    id_producto: '',
    nombre_plan: '',
    velocidad_descarga_mbps: '',
    velocidad_subida_mbps: '',
    precio_mensual: '',
    duracion_minima_contrato_meses: '',
    tipo_tecnologia: '',
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
      const data = await obtenerConetcomPlanes();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar planes.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { cargar(); }, []);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
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
        velocidad_descarga_mbps: Number(form.velocidad_descarga_mbps),
        velocidad_subida_mbps: Number(form.velocidad_subida_mbps),
        precio_mensual: Number(form.precio_mensual),
        duracion_minima_contrato_meses: Number(form.duracion_minima_contrato_meses),
      };
      if (editingId) {
        await actualizarConetcomPlan(editingId, payload);
        setSuccess('Plan actualizado correctamente.');
      } else {
        await crearConetcomPlan(payload);
        setSuccess('Plan creado correctamente.');
      }
      resetForm();
      await cargar();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el plan.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id_plan);
    setForm({
      id_plan: row.id_plan || '',
      id_producto: row.id_producto || '',
      nombre_plan: row.nombre_plan || '',
      velocidad_descarga_mbps: row.velocidad_descarga_mbps ?? '',
      velocidad_subida_mbps: row.velocidad_subida_mbps ?? '',
      precio_mensual: row.precio_mensual ?? '',
      duracion_minima_contrato_meses: row.duracion_minima_contrato_meses ?? '',
      tipo_tecnologia: row.tipo_tecnologia || '',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Seguro que deseas eliminar este plan?')) return;
    try {
      await eliminarConetcomPlan(id);
      setSuccess('Plan eliminado correctamente.');
      if (editingId === id) resetForm();
      await cargar();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el plan.');
    }
  };

  return (
    <div className={styles.container}>
      <h1>CRUD Conetcom Planes</h1>
      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
      {success ? <p style={{ color: '#0a7f35' }}>{success}</p> : null}

      <form onSubmit={handleSubmit} style={{ marginBottom: '1rem', display: 'grid', gap: '0.5rem' }}>
        <input name="id_plan" placeholder="id_plan" value={form.id_plan} onChange={handleChange} disabled={Boolean(editingId)} required />
        <input name="id_producto" placeholder="id_producto" value={form.id_producto} onChange={handleChange} required />
        <input name="nombre_plan" placeholder="nombre_plan" value={form.nombre_plan} onChange={handleChange} required />
        <input name="velocidad_descarga_mbps" placeholder="velocidad_descarga_mbps" value={form.velocidad_descarga_mbps} onChange={handleChange} required />
        <input name="velocidad_subida_mbps" placeholder="velocidad_subida_mbps" value={form.velocidad_subida_mbps} onChange={handleChange} required />
        <input name="precio_mensual" placeholder="precio_mensual" value={form.precio_mensual} onChange={handleChange} required />
        <input name="duracion_minima_contrato_meses" placeholder="duracion_minima_contrato_meses" value={form.duracion_minima_contrato_meses} onChange={handleChange} required />
        <input name="tipo_tecnologia" placeholder="tipo_tecnologia" value={form.tipo_tecnologia} onChange={handleChange} required />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" disabled={saving}>{editingId ? 'Actualizar' : 'Crear'}</button>
          <button type="button" onClick={resetForm}>Limpiar</button>
        </div>
      </form>

      {loading ? <p>Cargando planes...</p> : null}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th>ID</th><th>Producto</th><th>Nombre</th><th>Precio</th><th>Tecnologia</th><th>Acciones</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id_plan}>
                <td>{row.id_plan}</td><td>{row.id_producto}</td><td>{row.nombre_plan}</td><td>{row.precio_mensual}</td><td>{row.tipo_tecnologia}</td>
                <td style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={() => handleEdit(row)}>Editar</button>
                  <button type="button" onClick={() => handleDelete(row.id_plan)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardConectmosPlanes;
