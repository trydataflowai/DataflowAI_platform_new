import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../../styles/Dashboards/dashboards-conetcom/DashboardCrudConetcom.module.css';
import {
  actualizarConetcomTicketSoporte,
  crearConetcomTicketSoporte,
  eliminarConetcomTicketSoporte,
  importarConetcomTicketsSoporte,
  obtenerConetcomTicketsSoporte,
} from '../../../api/DashboardsApis/dashboards-conetcom/Dashboardconetcom_tickets_soporte';

const DashboardConectmosTicketsSoporte = () => {
  const navigate = useNavigate();
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
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const initialFilters = {
    id_ticket: '',
    id_cliente: '',
    categoria_ticket: '',
    prioridad: '',
    indicador_incumplimiento_sla: '',
    fecha_creacion: '',
  };
  const [filters, setFilters] = useState(initialFilters);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

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
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };
  const resetForm = () => { setForm(initialForm); setEditingId(null); };
  const toDateTimeLocal = (val) => (val ? String(val).slice(0, 16) : '');

  useEffect(() => {
    setPage(1);
  }, [filters, pageSize]);

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

  const handleImport = async () => {
    if (!importFile) {
      setError('Selecciona un archivo para importar.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      setImporting(true);
      const result = await importarConetcomTicketsSoporte(importFile);
      setSuccess(`Importacion completada. ${result.importados || 0} nuevos, ${result.actualizados || 0} actualizados.`);
      setImportFile(null);
      await cargar();
    } catch (err) {
      setError(err.message || 'No se pudo importar el archivo.');
    } finally {
      setImporting(false);
    }
  };

  const filteredRows = useMemo(() => {
    const entries = Object.entries(filters);
    if (entries.every(([, value]) => !value)) return rows;
    return rows.filter((row) =>
      entries.every(([key, value]) => {
        if (!value) return true;
        const raw = row?.[key];
        return String(raw ?? '')
          .toLowerCase()
          .includes(String(value).toLowerCase());
      }),
    );
  }, [rows, filters]);

  const totalRows = filteredRows.length;
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = pageSize === 'all' ? 0 : (safePage - 1) * pageSize;
  const end = pageSize === 'all' ? totalRows : start + pageSize;
  const visibleRows = filteredRows.slice(start, end);

  return (
    <div className={styles.container}>
              <div className={styles.headerRow}>
      <h1 className={styles.title}>CRUD Conetcom Tickets Soporte</h1>
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
      <form onSubmit={handleSubmit} className={styles.form}>
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
        <label className={styles.checkboxLabel}><input type="checkbox" name="indicador_incumplimiento_sla" checked={form.indicador_incumplimiento_sla} onChange={handleChange} /> incumplimiento_sla</label>
        <input name="tiempo_resolucion" placeholder="tiempo_resolucion (HH:MM:SS)" value={form.tiempo_resolucion} onChange={handleChange} />
        <div className={styles.formActions}>
          <button type="submit" className={styles.primaryButton} disabled={saving}>{editingId ? 'Actualizar' : 'Crear'}</button>
          <button type="button" className={styles.secondaryButton} onClick={resetForm}>Limpiar</button>
        </div>
      </form>
      <div className={styles.searchForm}>
        <input
          name="id_ticket"
          placeholder="Filtrar id_ticket"
          value={filters.id_ticket}
          onChange={handleFilterChange}
        />
        <input
          name="id_cliente"
          placeholder="Filtrar id_cliente"
          value={filters.id_cliente}
          onChange={handleFilterChange}
        />
        <input
          name="categoria_ticket"
          placeholder="Filtrar categoria"
          value={filters.categoria_ticket}
          onChange={handleFilterChange}
        />
        <input
          name="prioridad"
          placeholder="Filtrar prioridad"
          value={filters.prioridad}
          onChange={handleFilterChange}
        />
        <input
          name="indicador_incumplimiento_sla"
          placeholder="Filtrar sla"
          value={filters.indicador_incumplimiento_sla}
          onChange={handleFilterChange}
        />
        <input
          name="fecha_creacion"
          placeholder="Filtrar fecha_creacion"
          value={filters.fecha_creacion}
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
        Mostrando {visibleRows.length} de {filteredRows.length} registros
      </p>
      {loading ? <p className={styles.loading}>Cargando tickets...</p> : null}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead><tr><th>ID</th><th>Cliente</th><th>Categoria</th><th>Prioridad</th><th>SLA</th><th>Acciones</th></tr></thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.id_ticket}>
                <td>{row.id_ticket}</td><td>{row.id_cliente}</td><td>{row.categoria_ticket}</td><td>{row.prioridad || '-'}</td><td>{row.indicador_incumplimiento_sla ? 'Si' : 'No'}</td>
                <td className={styles.actionsCell}>
                  <button type="button" className={styles.secondaryButton} onClick={() => handleEdit(row)}>Editar</button>
                  <button type="button" className={styles.dangerButton} onClick={() => handleDelete(row.id_ticket)}>Eliminar</button>
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
