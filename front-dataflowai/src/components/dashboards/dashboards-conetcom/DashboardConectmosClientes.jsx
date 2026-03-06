import React, { useEffect, useState } from 'react';
import styles from '../../../styles/Dashboards/dashboard-ventas-e-inventarios/AnalisisInventarios.module.css';
import {
  actualizarConetcomCliente,
  buscarConetcomClientesPorNombre,
  crearConetcomCliente,
  eliminarConetcomCliente,
  obtenerConetcomClientes,
} from '../../../api/DashboardsApis/dashboards-conetcom/Dashboardconetcomclientes';

const DashboardConectmosClientes = () => {
  const initialForm = {
    id_cliente: '',
    nombre_cliente: '',
    id_producto: '',
    fecha_alta_cliente: '',
    estado_cliente: 'activo',
    tipo_cliente: 'residencial',
    ciudad: '',
    region_departamento: '',
    canal_adquisicion: 'venta_directa',
    id_plan_contratado: '',
    nombre_plan_contratado: '',
    fecha_inicio_contrato: '',
    fecha_finalizacion_contrato: '',
    indicador_vip: false,
  };

  const [clientes, setClientes] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const cargarClientes = async () => {
    try {
      setLoading(true);
      setError('');
      const token =
        localStorage.getItem('token') ||
        localStorage.getItem('access_token') ||
        localStorage.getItem('access');
      if (!token) {
        setError('No hay sesión activa. Inicia sesión para consultar clientes.');
        setClientes([]);
        return;
      }
      const data = await obtenerConetcomClientes();
      setClientes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.id_producto) {
      setError('El campo id_producto es obligatorio.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...form,
        id_producto: Number(form.id_producto),
      };

      if (editingId) {
        await actualizarConetcomCliente(editingId, payload);
        setSuccess('Cliente actualizado correctamente.');
      } else {
        await crearConetcomCliente(payload);
        setSuccess('Cliente creado correctamente.');
      }

      resetForm();
      await cargarClientes();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el cliente');
    } finally {
      setSaving(false);
    }
  };

  const handleBuscar = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const data = await buscarConetcomClientesPorNombre(search);
      setClientes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'No se pudo buscar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cliente) => {
    setEditingId(cliente.id_cliente);
    setForm({
      id_cliente: cliente.id_cliente || '',
      nombre_cliente: cliente.nombre_cliente || '',
      id_producto: cliente.id_producto || '',
      fecha_alta_cliente: cliente.fecha_alta_cliente || '',
      estado_cliente: cliente.estado_cliente || 'activo',
      tipo_cliente: cliente.tipo_cliente || 'residencial',
      ciudad: cliente.ciudad || '',
      region_departamento: cliente.region_departamento || '',
      canal_adquisicion: cliente.canal_adquisicion || 'venta_directa',
      id_plan_contratado: cliente.id_plan_contratado || '',
      nombre_plan_contratado: cliente.nombre_plan_contratado || '',
      fecha_inicio_contrato: cliente.fecha_inicio_contrato || '',
      fecha_finalizacion_contrato: cliente.fecha_finalizacion_contrato || '',
      indicador_vip: Boolean(cliente.indicador_vip),
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este cliente?')) return;
    try {
      setError('');
      setSuccess('');
      await eliminarConetcomCliente(id);
      setSuccess('Cliente eliminado correctamente.');
      if (editingId === id) resetForm();
      await cargarClientes();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el cliente');
    }
  };

  return (
    <div className={styles.container}>
      <h1>CRUD Conetcom Clientes</h1>

      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
      {success ? <p style={{ color: '#0a7f35' }}>{success}</p> : null}

      <form onSubmit={handleBuscar} style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <input
          placeholder="Buscar por nombre, ID o ciudad"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit">Buscar</button>
        <button type="button" onClick={cargarClientes}>Reset</button>
      </form>

      <form onSubmit={handleSubmit} style={{ marginBottom: '1rem', display: 'grid', gap: '0.5rem' }}>
        <input name="id_cliente" placeholder="id_cliente" value={form.id_cliente} onChange={handleChange} disabled={Boolean(editingId)} required />
        <input name="nombre_cliente" placeholder="nombre_cliente" value={form.nombre_cliente} onChange={handleChange} />
        <input name="id_producto" placeholder="id_producto (numerico)" value={form.id_producto} onChange={handleChange} required />
        <input name="fecha_alta_cliente" type="date" value={form.fecha_alta_cliente} onChange={handleChange} required />

        <select name="estado_cliente" value={form.estado_cliente} onChange={handleChange}>
          <option value="activo">Activo</option>
          <option value="suspendido">Suspendido</option>
          <option value="cancelado">Cancelado</option>
        </select>

        <select name="tipo_cliente" value={form.tipo_cliente} onChange={handleChange}>
          <option value="residencial">Residencial</option>
          <option value="empresarial">Empresarial</option>
          <option value="mayorista">Mayorista</option>
        </select>

        <input name="ciudad" placeholder="ciudad" value={form.ciudad} onChange={handleChange} required />
        <input name="region_departamento" placeholder="region_departamento" value={form.region_departamento} onChange={handleChange} required />

        <select name="canal_adquisicion" value={form.canal_adquisicion} onChange={handleChange}>
          <option value="venta_directa">Venta directa</option>
          <option value="web">Web</option>
          <option value="aliado">Aliado</option>
          <option value="call_center">Call center</option>
        </select>

        <input name="id_plan_contratado" placeholder="id_plan_contratado" value={form.id_plan_contratado} onChange={handleChange} />
        <input name="nombre_plan_contratado" placeholder="nombre_plan_contratado" value={form.nombre_plan_contratado} onChange={handleChange} />
        <input name="fecha_inicio_contrato" type="date" value={form.fecha_inicio_contrato} onChange={handleChange} />
        <input name="fecha_finalizacion_contrato" type="date" value={form.fecha_finalizacion_contrato} onChange={handleChange} />

        <label>
          <input name="indicador_vip" type="checkbox" checked={form.indicador_vip} onChange={handleChange} />
          Cliente VIP
        </label>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" disabled={saving}>{editingId ? 'Actualizar' : 'Crear'}</button>
          <button type="button" onClick={resetForm}>Limpiar</button>
        </div>
      </form>

      {loading ? <p>Cargando clientes...</p> : null}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre cliente</th>
              <th>Producto</th>
              <th>Fecha alta</th>
              <th>Estado</th>
              <th>Tipo</th>
              <th>Ciudad</th>
              <th>Canal</th>
              <th>VIP</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente.id_cliente}>
                <td>{cliente.id_cliente}</td>
                <td>{cliente.nombre_cliente || '-'}</td>
                <td>{cliente.id_producto}</td>
                <td>{cliente.fecha_alta_cliente}</td>
                <td>{cliente.estado_cliente}</td>
                <td>{cliente.tipo_cliente}</td>
                <td>{cliente.ciudad}</td>
                <td>{cliente.canal_adquisicion}</td>
                <td>{cliente.indicador_vip ? 'Si' : 'No'}</td>
                <td style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={() => handleEdit(cliente)}>Editar</button>
                  <button type="button" onClick={() => handleDelete(cliente.id_cliente)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardConectmosClientes;
