import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../../styles/Dashboards/dashboards-conetcom/DashboardCrudConetcom.module.css';
import {
  actualizarConetcomRegistroTraficoConsumo,
  crearConetcomRegistroTraficoConsumo,
  eliminarConetcomRegistroTraficoConsumo,
  importarConetcomTraficoConsumo,
  obtenerConetcomTraficoConsumo,
} from '../../../api/DashboardsApis/dashboards-conetcom/Dashboardconetcom_trafico_consumo';

const DashboardConectmosTraficoConsumo = () => {
  const navigate = useNavigate();
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
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const initialFilters = {
    id_registro: '',
    id_cliente: '',
    id_producto: '',
    fecha: '',
    consumo_descarga_gb: '',
    consumo_subida_gb: '',
  };
  const [filters, setFilters] = useState(initialFilters);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

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

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    setPage(1);
  }, [filters, pageSize]);

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

  const handleImport = async () => {
    if (!importFile) {
      setError('Selecciona un archivo para importar.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      setImporting(true);
      const result = await importarConetcomTraficoConsumo(importFile);
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
      <h1 className={styles.title}>CRUD Conetcom Trafico Consumo</h1>
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
        <input name="id_registro" placeholder="id_registro" value={form.id_registro} onChange={handleChange} disabled={Boolean(editingId)} required />
        <input name="id_producto" placeholder="id_producto" value={form.id_producto} onChange={handleChange} required />
        <input name="id_cliente" placeholder="id_cliente" value={form.id_cliente} onChange={handleChange} required />
        <input name="fecha" type="date" value={form.fecha} onChange={handleChange} required />
        <input name="consumo_descarga_gb" placeholder="consumo_descarga_gb" value={form.consumo_descarga_gb} onChange={handleChange} />
        <input name="consumo_subida_gb" placeholder="consumo_subida_gb" value={form.consumo_subida_gb} onChange={handleChange} />
        <input name="velocidad_pico_mbps" placeholder="velocidad_pico_mbps" value={form.velocidad_pico_mbps} onChange={handleChange} />
        <input name="velocidad_promedio_mbps" placeholder="velocidad_promedio_mbps" value={form.velocidad_promedio_mbps} onChange={handleChange} />
        <input name="numero_sesiones" placeholder="numero_sesiones" value={form.numero_sesiones} onChange={handleChange} />
        <div className={styles.formActions}>
          <button type="submit" className={styles.primaryButton} disabled={saving}>{editingId ? 'Actualizar' : 'Crear'}</button>
          <button type="button" className={styles.secondaryButton} onClick={resetForm}>Limpiar</button>
        </div>
      </form>
      <div className={styles.searchForm}>
        <input
          name="id_registro"
          placeholder="Filtrar id_registro"
          value={filters.id_registro}
          onChange={handleFilterChange}
        />
        <input
          name="id_cliente"
          placeholder="Filtrar id_cliente"
          value={filters.id_cliente}
          onChange={handleFilterChange}
        />
        <input
          name="id_producto"
          placeholder="Filtrar id_producto"
          value={filters.id_producto}
          onChange={handleFilterChange}
        />
        <input name="fecha" placeholder="Filtrar fecha" value={filters.fecha} onChange={handleFilterChange} />
        <input
          name="consumo_descarga_gb"
          placeholder="Filtrar descarga"
          value={filters.consumo_descarga_gb}
          onChange={handleFilterChange}
        />
        <input
          name="consumo_subida_gb"
          placeholder="Filtrar subida"
          value={filters.consumo_subida_gb}
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
      {loading ? <p className={styles.loading}>Cargando registros...</p> : null}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead><tr><th>ID</th><th>Cliente</th><th>Fecha</th><th>Descarga GB</th><th>Subida GB</th><th>Acciones</th></tr></thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.id_registro}>
                <td>{row.id_registro}</td><td>{row.id_cliente}</td><td>{row.fecha}</td><td>{row.consumo_descarga_gb ?? '-'}</td><td>{row.consumo_subida_gb ?? '-'}</td>
                <td className={styles.actionsCell}>
                  <button type="button" className={styles.secondaryButton} onClick={() => handleEdit(row)}>Editar</button>
                  <button type="button" className={styles.dangerButton} onClick={() => handleDelete(row.id_registro)}>Eliminar</button>
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
