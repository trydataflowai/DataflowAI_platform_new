import React, { useEffect, useState } from 'react';
import styles from '../../../styles/Dashboards/dashboard-ventas-e-inventarios/AnalisisInventarios.module.css';
import {
  actualizarConetcomFactura,
  crearConetcomFactura,
  eliminarConetcomFactura,
  obtenerConetcomFacturacion,
} from '../../../api/DashboardsApis/dashboards-conetcom/Dashboardconetcom_facturacion';

const DashboardConectmosFacturacion = () => {
  const initialForm = {
    id_factura: '',
    id_producto: '',
    id_cliente: '',
    fecha_emision: '',
    fecha_vencimiento: '',
    valor_total_facturado: '',
    estado_factura: 'pendiente',
    valor_pagado: '',
    fecha_pago: '',
    metodo_pago: '',
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
      const data = await obtenerConetcomFacturacion();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'No se pudo cargar facturacion.');
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
        valor_total_facturado: Number(form.valor_total_facturado),
        valor_pagado: form.valor_pagado === '' ? null : Number(form.valor_pagado),
      };
      if (editingId) {
        await actualizarConetcomFactura(editingId, payload);
        setSuccess('Factura actualizada correctamente.');
      } else {
        await crearConetcomFactura(payload);
        setSuccess('Factura creada correctamente.');
      }
      resetForm();
      await cargar();
    } catch (err) {
      setError(err.message || 'No se pudo guardar la factura.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id_factura);
    setForm({
      id_factura: row.id_factura || '',
      id_producto: row.id_producto || '',
      id_cliente: row.id_cliente || '',
      fecha_emision: row.fecha_emision || '',
      fecha_vencimiento: row.fecha_vencimiento || '',
      valor_total_facturado: row.valor_total_facturado ?? '',
      estado_factura: row.estado_factura || 'pendiente',
      valor_pagado: row.valor_pagado ?? '',
      fecha_pago: row.fecha_pago || '',
      metodo_pago: row.metodo_pago || '',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Seguro que deseas eliminar esta factura?')) return;
    try {
      await eliminarConetcomFactura(id);
      setSuccess('Factura eliminada correctamente.');
      if (editingId === id) resetForm();
      await cargar();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la factura.');
    }
  };

  return (
    <div className={styles.container}>
      <h1>CRUD Conetcom Facturacion</h1>
      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
      {success ? <p style={{ color: '#0a7f35' }}>{success}</p> : null}
      <form onSubmit={handleSubmit} style={{ marginBottom: '1rem', display: 'grid', gap: '0.5rem' }}>
        <input name="id_factura" placeholder="id_factura" value={form.id_factura} onChange={handleChange} disabled={Boolean(editingId)} required />
        <input name="id_producto" placeholder="id_producto" value={form.id_producto} onChange={handleChange} required />
        <input name="id_cliente" placeholder="id_cliente" value={form.id_cliente} onChange={handleChange} required />
        <input name="fecha_emision" type="date" value={form.fecha_emision} onChange={handleChange} required />
        <input name="fecha_vencimiento" type="date" value={form.fecha_vencimiento} onChange={handleChange} required />
        <input name="valor_total_facturado" placeholder="valor_total_facturado" value={form.valor_total_facturado} onChange={handleChange} required />
        <select name="estado_factura" value={form.estado_factura} onChange={handleChange}>
          <option value="pagada">pagada</option>
          <option value="pendiente">pendiente</option>
          <option value="parcial">parcial</option>
          <option value="vencida">vencida</option>
        </select>
        <input name="valor_pagado" placeholder="valor_pagado" value={form.valor_pagado} onChange={handleChange} />
        <input name="fecha_pago" type="date" value={form.fecha_pago} onChange={handleChange} />
        <input name="metodo_pago" placeholder="metodo_pago" value={form.metodo_pago} onChange={handleChange} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" disabled={saving}>{editingId ? 'Actualizar' : 'Crear'}</button>
          <button type="button" onClick={resetForm}>Limpiar</button>
        </div>
      </form>
      {loading ? <p>Cargando facturacion...</p> : null}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th>Factura</th><th>Cliente</th><th>Emision</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id_factura}>
                <td>{row.id_factura}</td><td>{row.id_cliente}</td><td>{row.fecha_emision}</td><td>{row.valor_total_facturado}</td><td>{row.estado_factura}</td>
                <td style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={() => handleEdit(row)}>Editar</button>
                  <button type="button" onClick={() => handleDelete(row.id_factura)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardConectmosFacturacion;
