import React, { useEffect, useState } from 'react';
import styles from '../../../styles/Dashboards/dashboard-ventas-e-inventarios/AnalisisInventarios.module.css';
import {
  actualizarConetcomPago,
  crearConetcomPago,
  eliminarConetcomPago,
  obtenerConetcomPagos,
} from '../../../api/DashboardsApis/dashboards-conetcom/Dashboardconetcom_pagos';

const DashboardConectmosPagos = () => {
  const initialForm = {
    id_pago: '',
    id_producto: '',
    id_cliente: '',
    id_factura_asociada: '',
    fecha_pago: '',
    valor_pagado: '',
    medio_de_pago: '',
    estado_pago: '',
    metodo_de_pago: '',
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
      const data = await obtenerConetcomPagos();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar pagos.');
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
        valor_pagado: Number(form.valor_pagado),
        id_factura_asociada: form.id_factura_asociada || null,
      };
      if (editingId) {
        await actualizarConetcomPago(editingId, payload);
        setSuccess('Pago actualizado correctamente.');
      } else {
        await crearConetcomPago(payload);
        setSuccess('Pago creado correctamente.');
      }
      resetForm();
      await cargar();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el pago.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id_pago);
    setForm({
      id_pago: row.id_pago || '',
      id_producto: row.id_producto || '',
      id_cliente: row.id_cliente || '',
      id_factura_asociada: row.id_factura_asociada || '',
      fecha_pago: row.fecha_pago || '',
      valor_pagado: row.valor_pagado ?? '',
      medio_de_pago: row.medio_de_pago || '',
      estado_pago: row.estado_pago || '',
      metodo_de_pago: row.metodo_de_pago || '',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Seguro que deseas eliminar este pago?')) return;
    try {
      await eliminarConetcomPago(id);
      setSuccess('Pago eliminado correctamente.');
      if (editingId === id) resetForm();
      await cargar();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el pago.');
    }
  };

  return (
    <div className={styles.container}>
      <h1>CRUD Conetcom Pagos</h1>
      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
      {success ? <p style={{ color: '#0a7f35' }}>{success}</p> : null}
      <form onSubmit={handleSubmit} style={{ marginBottom: '1rem', display: 'grid', gap: '0.5rem' }}>
        <input name="id_pago" placeholder="id_pago" value={form.id_pago} onChange={handleChange} disabled={Boolean(editingId)} required />
        <input name="id_producto" placeholder="id_producto" value={form.id_producto} onChange={handleChange} required />
        <input name="id_cliente" placeholder="id_cliente" value={form.id_cliente} onChange={handleChange} required />
        <input name="id_factura_asociada" placeholder="id_factura_asociada" value={form.id_factura_asociada} onChange={handleChange} />
        <input name="fecha_pago" type="date" value={form.fecha_pago} onChange={handleChange} />
        <input name="valor_pagado" placeholder="valor_pagado" value={form.valor_pagado} onChange={handleChange} required />
        <input name="medio_de_pago" placeholder="medio_de_pago" value={form.medio_de_pago} onChange={handleChange} />
        <select name="estado_pago" value={form.estado_pago} onChange={handleChange}>
          <option value="">estado_pago</option>
          <option value="pagado">pagado</option>
          <option value="pendiente">pendiente</option>
          <option value="parcial">parcial</option>
          <option value="fallido">fallido</option>
        </select>
        <input name="metodo_de_pago" placeholder="metodo_de_pago" value={form.metodo_de_pago} onChange={handleChange} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" disabled={saving}>{editingId ? 'Actualizar' : 'Crear'}</button>
          <button type="button" onClick={resetForm}>Limpiar</button>
        </div>
      </form>
      {loading ? <p>Cargando pagos...</p> : null}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th>ID</th><th>Cliente</th><th>Factura</th><th>Valor</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id_pago}>
                <td>{row.id_pago}</td><td>{row.id_cliente}</td><td>{row.id_factura_asociada || '-'}</td><td>{row.valor_pagado}</td><td>{row.estado_pago || '-'}</td>
                <td style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={() => handleEdit(row)}>Editar</button>
                  <button type="button" onClick={() => handleDelete(row.id_pago)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardConectmosPagos;
