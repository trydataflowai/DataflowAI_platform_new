import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../../styles/Dashboards/dashboards-conetcom/DashboardCrudConetcom.module.css';
import {
  actualizarConetcomPlan,
  crearConetcomPlan,
  eliminarConetcomPlan,
  importarConetcomPlanes,
  obtenerConetcomPlanes,
} from '../../../api/DashboardsApis/dashboards-conetcom/Dashboardconetcom_planes';

const DashboardConectmosPlanes = () => {
  const navigate = useNavigate();
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
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const initialFilters = {
    id_plan: '',
    id_producto: '',
    nombre_plan: '',
    precio_mensual: '',
    tipo_tecnologia: '',
  };
  const [filters, setFilters] = useState(initialFilters);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

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

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

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

  const handleImport = async () => {
    if (!importFile) {
      setError('Selecciona un archivo para importar.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      setImporting(true);
      const result = await importarConetcomPlanes(importFile);
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
      <h1 className={styles.title}>CRUD Conetcom Planes</h1>
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
        <small className={styles.sectionNote}>El importador usa id_producto=24 por defecto.</small>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <input name="id_plan" placeholder="id_plan" value={form.id_plan} onChange={handleChange} disabled={Boolean(editingId)} required />
        <input name="id_producto" placeholder="id_producto" value={form.id_producto} onChange={handleChange} required />
        <input name="nombre_plan" placeholder="nombre_plan" value={form.nombre_plan} onChange={handleChange} required />
        <input name="velocidad_descarga_mbps" placeholder="velocidad_descarga_mbps" value={form.velocidad_descarga_mbps} onChange={handleChange} required />
        <input name="velocidad_subida_mbps" placeholder="velocidad_subida_mbps" value={form.velocidad_subida_mbps} onChange={handleChange} required />
        <input name="precio_mensual" placeholder="precio_mensual" value={form.precio_mensual} onChange={handleChange} required />
        <input name="duracion_minima_contrato_meses" placeholder="duracion_minima_contrato_meses" value={form.duracion_minima_contrato_meses} onChange={handleChange} required />
        <input name="tipo_tecnologia" placeholder="tipo_tecnologia" value={form.tipo_tecnologia} onChange={handleChange} required />
        <div className={styles.formActions}>
          <button type="submit" className={styles.primaryButton} disabled={saving}>{editingId ? 'Actualizar' : 'Crear'}</button>
          <button type="button" className={styles.secondaryButton} onClick={resetForm}>Limpiar</button>
        </div>
      </form>
      <div className={styles.searchForm}>
        <input name="id_plan" placeholder="Filtrar id_plan" value={filters.id_plan} onChange={handleFilterChange} />
        <input
          name="id_producto"
          placeholder="Filtrar id_producto"
          value={filters.id_producto}
          onChange={handleFilterChange}
        />
        <input
          name="nombre_plan"
          placeholder="Filtrar nombre_plan"
          value={filters.nombre_plan}
          onChange={handleFilterChange}
        />
        <input
          name="precio_mensual"
          placeholder="Filtrar precio"
          value={filters.precio_mensual}
          onChange={handleFilterChange}
        />
        <input
          name="tipo_tecnologia"
          placeholder="Filtrar tecnologia"
          value={filters.tipo_tecnologia}
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

      {loading ? <p className={styles.loading}>Cargando planes...</p> : null}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead><tr><th>ID</th><th>Producto</th><th>Nombre</th><th>Precio</th><th>Tecnologia</th><th>Acciones</th></tr></thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.id_plan}>
                <td>{row.id_plan}</td><td>{row.id_producto}</td><td>{row.nombre_plan}</td><td>{row.precio_mensual}</td><td>{row.tipo_tecnologia}</td>
                <td className={styles.actionsCell}>
                  <button type="button" className={styles.secondaryButton} onClick={() => handleEdit(row)}>Editar</button>
                  <button type="button" className={styles.dangerButton} onClick={() => handleDelete(row.id_plan)}>Eliminar</button>
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
