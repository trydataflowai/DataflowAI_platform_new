import React, { useEffect, useState } from 'react';
import styles from '../../../styles/Dashboards/dashboard-ventas-e-inventarios/AnalisisInventarios.module.css';
import {
  actualizarConetcomTicketSoporte,
  crearConetcomTicketSoporte,
  eliminarConetcomTicketSoporte,
  obtenerConetcomTicketsSoporte,
} from '../../../api/DashboardsApis/dashboards-conetcom/Dashboardconetcom_tickets_soporte';

const DashboardConectmosTicketsSoporte = () => {
  const initialForm = {
    id_ticket: '',
    id_producto: '',
    id_cliente: '',
    fecha_creacion: '',
    fecha_cierre: '',
    area_agente_asignado: '',
    categoria_ticket: 'otros',
    prioridad: '',
    indicador_incumplimiento_sla: false,
    tiempo_resolucion: '',
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
      const data = await obtenerConetcomTicketsSoporte();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar tickets.');
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
  const toDateTimeLocal = (val) => (val ? String(val).slice(0, 16) : '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      setSaving(true);
      const payload = {
        ...form,
        id_producto: Number(form.id_producto),
      };
      if (editingId) {
        await actualizarConetcomTicketSoporte(editingId, payload);
        setSuccess('Ticket actualizado correctamente.');
      } else {
        await crearConetcomTicketSoporte(payload);
        setSuccess('Ticket creado correctamente.');
      }
      resetForm();
      await cargar();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el ticket.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id_ticket);
    setForm({
      id_ticket: row.id_ticket || '',
      id_producto: row.id_producto || '',
      id_cliente: row.id_cliente || '',
      fecha_creacion: toDateTimeLocal(row.fecha_creacion),
      fecha_cierre: toDateTimeLocal(row.fecha_cierre),
      area_agente_asignado: row.area_agente_asignado || '',
      categoria_ticket: row.categoria_ticket || 'otros',
      prioridad: row.prioridad || '',
      indicador_incumplimiento_sla: Boolean(row.indicador_incumplimiento_sla),
      tiempo_resolucion: row.tiempo_resolucion || '',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Seguro que deseas eliminar este ticket?')) return;
    try {
      await eliminarConetcomTicketSoporte(id);
      setSuccess('Ticket eliminado correctamente.');
      if (editingId === id) resetForm();
      await cargar();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el ticket.');
    }
  };

  return (
    <div className={styles.container}>
      <h1>CRUD Conetcom Tickets Soporte</h1>
      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
      {success ? <p style={{ color: '#0a7f35' }}>{success}</p> : null}
      <form onSubmit={handleSubmit} style={{ marginBottom: '1rem', display: 'grid', gap: '0.5rem' }}>
        <input name="id_ticket" placeholder="id_ticket" value={form.id_ticket} onChange={handleChange} disabled={Boolean(editingId)} required />
        <input name="id_producto" placeholder="id_producto" value={form.id_producto} onChange={handleChange} required />
        <input name="id_cliente" placeholder="id_cliente" value={form.id_cliente} onChange={handleChange} required />
        <input name="fecha_creacion" type="datetime-local" value={form.fecha_creacion} onChange={handleChange} required />
        <input name="fecha_cierre" type="datetime-local" value={form.fecha_cierre} onChange={handleChange} />
        <input name="area_agente_asignado" placeholder="area_agente_asignado" value={form.area_agente_asignado} onChange={handleChange} />
        <select name="categoria_ticket" value={form.categoria_ticket} onChange={handleChange}>
          <option value="instalacion">instalacion</option>
          <option value="interrupcion">interrupcion</option>
          <option value="facturacion">facturacion</option>
          <option value="otros">otros</option>
        </select>
        <select name="prioridad" value={form.prioridad} onChange={handleChange}>
          <option value="">prioridad</option>
          <option value="alta">alta</option>
          <option value="media">media</option>
          <option value="baja">baja</option>
        </select>
        <label><input type="checkbox" name="indicador_incumplimiento_sla" checked={form.indicador_incumplimiento_sla} onChange={handleChange} /> incumplimiento_sla</label>
        <input name="tiempo_resolucion" placeholder="tiempo_resolucion (HH:MM:SS)" value={form.tiempo_resolucion} onChange={handleChange} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" disabled={saving}>{editingId ? 'Actualizar' : 'Crear'}</button>
          <button type="button" onClick={resetForm}>Limpiar</button>
        </div>
      </form>
      {loading ? <p>Cargando tickets...</p> : null}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th>ID</th><th>Cliente</th><th>Categoria</th><th>Prioridad</th><th>SLA</th><th>Acciones</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id_ticket}>
                <td>{row.id_ticket}</td><td>{row.id_cliente}</td><td>{row.categoria_ticket}</td><td>{row.prioridad || '-'}</td><td>{row.indicador_incumplimiento_sla ? 'Si' : 'No'}</td>
                <td style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={() => handleEdit(row)}>Editar</button>
                  <button type="button" onClick={() => handleDelete(row.id_ticket)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardConectmosTicketsSoporte;
