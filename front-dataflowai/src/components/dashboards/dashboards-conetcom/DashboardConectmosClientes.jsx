import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../../styles/Dashboards/dashboards-conetcom/DashboardCrudConetcom.module.css';
import {
  actualizarConetcomCliente,
  buscarConetcomClientesPorNombre,
  crearConetcomCliente,
  eliminarConetcomCliente,
  importarConetcomClientes,
  obtenerConetcomClientes,
} from '../../../api/DashboardsApis/dashboards-conetcom/Dashboardconetcomclientes';

const DashboardConectmosClientes = () => {
  const navigate = useNavigate();
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
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const initialFilters = {
    id_cliente: '',
    nombre_cliente: '',
    id_producto: '',
    fecha_alta_cliente: '',
    estado_cliente: '',
    tipo_cliente: '',
    ciudad: '',
    canal_adquisicion: '',
    indicador_vip: '',
  };
  const [filters, setFilters] = useState(initialFilters);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const cargarClientes = async () => {
    try {
      setLoading(true);
      setError('');
      const token =
        localStorage.getItem('token') ||
        localStorage.getItem('access_token') ||
        localStorage.getItem('access');
      if (!token) {
        setError('No hay sesiÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n activa. Inicia sesiÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n para consultar clientes.');
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

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    setPage(1);
  }, [filters, pageSize]);

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
    if (!window.confirm('ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿Seguro que deseas eliminar este cliente?')) return;
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

  const handleImport = async () => {
    if (!importFile) {
      setError('Selecciona un archivo para importar.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      setImporting(true);
      const result = await importarConetcomClientes(importFile);
      setSuccess(`Importacion completada. ${result.importados || 0} nuevos, ${result.actualizados || 0} actualizados.`);
      setImportFile(null);
      await cargarClientes();
    } catch (err) {
      setError(err.message || 'No se pudo importar el archivo.');
    } finally {
      setImporting(false);
    }
  };

  const filteredClientes = useMemo(() => {
    const entries = Object.entries(filters);
    if (entries.every(([, value]) => !value)) return clientes;
    return clientes.filter((cliente) =>
      entries.every(([key, value]) => {
        if (!value) return true;
        const raw = cliente?.[key];
        return String(raw ?? '')
          .toLowerCase()
          .includes(String(value).toLowerCase());
      }),
    );
  }, [clientes, filters]);

  const totalRows = filteredClientes.length;
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = pageSize === 'all' ? 0 : (safePage - 1) * pageSize;
  const end = pageSize === 'all' ? totalRows : start + pageSize;
  const visibleClientes = filteredClientes.slice(start, end);

  return (
    <div className={styles.container}>
              <div className={styles.headerRow}>
      <h1 className={styles.title}>CRUD Conetcom Clientes</h1>
      <button type="button" className={styles.secondaryButton} onClick={() => navigate('/DashboardGeneralConectcom')}>Ir a dashboard general</button>
    </div>

      {error ? <p className={`${styles.alert} ${styles.alertError}`}>{error}</p> : null}
      {success ? <p className={`${styles.alert} ${styles.alertSuccess}`}>{success}</p> : null}

      <div className={styles.section}>
        <strong className={styles.sectionTitle}>Importar desde Excel</strong>
        <div className={styles.sectionRow}>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
          />
          <button type="button" className={styles.primaryButton} onClick={handleImport} disabled={importing}>
            {importing ? 'Importando...' : 'Importar'}
          </button>
        </div>
      </div>

      <form onSubmit={handleBuscar} className={styles.searchForm}>
        <input
          placeholder="Buscar por nombre, ID o ciudad"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className={styles.primaryButton}>Buscar</button>
        <button type="button" className={styles.secondaryButton} onClick={cargarClientes}>Reset</button>
      </form>

      <form onSubmit={handleSubmit} className={styles.form}>
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

        <label className={styles.checkboxLabel}>
          <input name="indicador_vip" type="checkbox" checked={form.indicador_vip} onChange={handleChange} />
          Cliente VIP
        </label>

        <div className={styles.formActions}>
          <button type="submit" className={styles.primaryButton} disabled={saving}>{editingId ? 'Actualizar' : 'Crear'}</button>
          <button type="button" className={styles.secondaryButton} onClick={resetForm}>Limpiar</button>
        </div>
      </form>

      <div className={styles.searchForm}>
        <input
          name="id_cliente"
          placeholder="Filtrar id_cliente"
          value={filters.id_cliente}
          onChange={handleFilterChange}
        />
        <input
          name="nombre_cliente"
          placeholder="Filtrar nombre_cliente"
          value={filters.nombre_cliente}
          onChange={handleFilterChange}
        />
        <input
          name="id_producto"
          placeholder="Filtrar id_producto"
          value={filters.id_producto}
          onChange={handleFilterChange}
        />
        <input
          name="fecha_alta_cliente"
          placeholder="Filtrar fecha_alta"
          value={filters.fecha_alta_cliente}
          onChange={handleFilterChange}
        />
        <input
          name="estado_cliente"
          placeholder="Filtrar estado"
          value={filters.estado_cliente}
          onChange={handleFilterChange}
        />
        <input
          name="tipo_cliente"
          placeholder="Filtrar tipo"
          value={filters.tipo_cliente}
          onChange={handleFilterChange}
        />
        <input name="ciudad" placeholder="Filtrar ciudad" value={filters.ciudad} onChange={handleFilterChange} />
        <input
          name="canal_adquisicion"
          placeholder="Filtrar canal"
          value={filters.canal_adquisicion}
          onChange={handleFilterChange}
        />
        <input
          name="indicador_vip"
          placeholder="Filtrar vip"
          value={filters.indicador_vip}
          onChange={handleFilterChange}
        />
        <button type="button" className={styles.ghostButton} onClick={() => setFilters(initialFilters)}>
          Limpiar filtros
        </button>
      </div>
      <div className={styles.paginationRow}>
        <div className={styles.pageSizeGroup}>
          <span className={styles.pageLabel}>Mostrar</span>
          {[10, 50, 100, 'all'].map((size) => (
            <button
              key={size}
              type="button"
              className={`${styles.pageSizeButton} ${pageSize === size ? styles.pageSizeActive : ''}`}
              onClick={() => setPageSize(size)}
            >
              {size === 'all' ? 'Todos' : size}
            </button>
          ))}
        </div>
        <div className={styles.pageControls}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={safePage === 1 || totalPages === 1}
          >
            Anterior
          </button>
          <span className={styles.pageStatus}>
            Pagina {safePage} de {totalPages}
          </span>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={safePage === totalPages || totalPages === 1}
          >
            Siguiente
          </button>
        </div>
      </div>
      <p className={styles.sectionNote}>
        Mostrando {visibleClientes.length} de {filteredClientes.length} registros
      </p>

      {loading ? <p className={styles.loading}>Cargando clientes...</p> : null}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
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
            {visibleClientes.map((cliente) => (
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
                <td className={styles.actionsCell}>
                  <button type="button" className={styles.secondaryButton} onClick={() => handleEdit(cliente)}>Editar</button>
                  <button type="button" className={styles.dangerButton} onClick={() => handleDelete(cliente.id_cliente)}>Eliminar</button>
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
