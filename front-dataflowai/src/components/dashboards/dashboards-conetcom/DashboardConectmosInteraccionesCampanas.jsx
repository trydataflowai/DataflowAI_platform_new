import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../../styles/Dashboards/dashboards-conetcom/DashboardCrudConetcom.module.css';
import {
  actualizarConetcomInteraccionCampana,
  crearConetcomInteraccionCampana,
  eliminarConetcomInteraccionCampana,
  importarConetcomInteraccionesCampanas,
  obtenerConetcomInteraccionesCampanas,
} from '../../../api/DashboardsApis/dashboards-conetcom/Dashboardconetcom_interacciones_campanas';

const DashboardConectmosInteraccionesCampanas = () => {
  const navigate = useNavigate();
  const initialForm = {
    id_interaccion: '',
    id_producto: '',
    id_campana: '',
    id_cliente: '',
    fecha_envio: '',
    abrio_mensaje: false,
    hizo_clic: false,
    genero_conversion: false,
    ingresos_generados: '',
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
    id_interaccion: '',
    id_campana: '',
    id_cliente: '',
    fecha_envio: '',
    abrio_mensaje: '',
    hizo_clic: '',
    genero_conversion: '',
  };
  const [filters, setFilters] = useState(initialFilters);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const cargar = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await obtenerConetcomInteraccionesCampanas();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar interacciones.');
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
        ingresos_generados: form.ingresos_generados === '' ? null : Number(form.ingresos_generados),
      };
      if (editingId) {
        await actualizarConetcomInteraccionCampana(editingId, payload);
        setSuccess('Interaccion actualizada correctamente.');
      } else {
        await crearConetcomInteraccionCampana(payload);
        setSuccess('Interaccion creada correctamente.');
      }
      resetForm();
      await cargar();
    } catch (err) {
      setError(err.message || 'No se pudo guardar la interaccion.');
    } finally {
      setSaving(false);
    }
  };

  const toDateTimeLocal = (val) => (val ? String(val).slice(0, 16) : '');

  const handleEdit = (row) => {
    setEditingId(row.id_interaccion);
    setForm({
      id_interaccion: row.id_interaccion || '',
      id_producto: row.id_producto || '',
      id_campana: row.id_campana || '',
      id_cliente: row.id_cliente || '',
      fecha_envio: toDateTimeLocal(row.fecha_envio),
      abrio_mensaje: Boolean(row.abrio_mensaje),
      hizo_clic: Boolean(row.hizo_clic),
      genero_conversion: Boolean(row.genero_conversion),
      ingresos_generados: row.ingresos_generados ?? '',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Seguro que deseas eliminar esta interaccion?')) return;
    try {
      await eliminarConetcomInteraccionCampana(id);
      setSuccess('Interaccion eliminada correctamente.');
      if (editingId === id) resetForm();
      await cargar();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la interaccion.');
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
      const result = await importarConetcomInteraccionesCampanas(importFile);
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
      <h1 className={styles.title}>CRUD Conetcom Interacciones Campanas</h1>
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
        <input name="id_interaccion" placeholder="id_interaccion" value={form.id_interaccion} onChange={handleChange} disabled={Boolean(editingId)} required />
        <input name="id_producto" placeholder="id_producto" value={form.id_producto} onChange={handleChange} required />
        <input name="id_campana" placeholder="id_campana" value={form.id_campana} onChange={handleChange} required />
        <input name="id_cliente" placeholder="id_cliente" value={form.id_cliente} onChange={handleChange} required />
        <input name="fecha_envio" type="datetime-local" value={form.fecha_envio} onChange={handleChange} />
        <label className={styles.checkboxLabel}><input type="checkbox" name="abrio_mensaje" checked={form.abrio_mensaje} onChange={handleChange} /> abrio_mensaje</label>
        <label className={styles.checkboxLabel}><input type="checkbox" name="hizo_clic" checked={form.hizo_clic} onChange={handleChange} /> hizo_clic</label>
        <label className={styles.checkboxLabel}><input type="checkbox" name="genero_conversion" checked={form.genero_conversion} onChange={handleChange} /> genero_conversion</label>
        <input name="ingresos_generados" placeholder="ingresos_generados" value={form.ingresos_generados} onChange={handleChange} />
        <div className={styles.formActions}>
          <button type="submit" className={styles.primaryButton} disabled={saving}>{editingId ? 'Actualizar' : 'Crear'}</button>
          <button type="button" className={styles.secondaryButton} onClick={resetForm}>Limpiar</button>
        </div>
      </form>
      <div className={styles.searchForm}>
        <input
          name="id_interaccion"
          placeholder="Filtrar id_interaccion"
          value={filters.id_interaccion}
          onChange={handleFilterChange}
        />
        <input
          name="id_campana"
          placeholder="Filtrar id_campana"
          value={filters.id_campana}
          onChange={handleFilterChange}
        />
        <input
          name="id_cliente"
          placeholder="Filtrar id_cliente"
          value={filters.id_cliente}
          onChange={handleFilterChange}
        />
        <input
          name="fecha_envio"
          placeholder="Filtrar fecha_envio"
          value={filters.fecha_envio}
          onChange={handleFilterChange}
        />
        <input
          name="abrio_mensaje"
          placeholder="Filtrar abrio"
          value={filters.abrio_mensaje}
          onChange={handleFilterChange}
        />
        <input
          name="hizo_clic"
          placeholder="Filtrar clic"
          value={filters.hizo_clic}
          onChange={handleFilterChange}
        />
        <input
          name="genero_conversion"
          placeholder="Filtrar conversion"
          value={filters.genero_conversion}
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
      {loading ? <p className={styles.loading}>Cargando interacciones...</p> : null}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead><tr><th>ID</th><th>Campana</th><th>Cliente</th><th>Abrio</th><th>Clic</th><th>Conv.</th><th>Acciones</th></tr></thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.id_interaccion}>
                <td>{row.id_interaccion}</td><td>{row.id_campana}</td><td>{row.id_cliente}</td><td>{row.abrio_mensaje ? 'Si' : 'No'}</td><td>{row.hizo_clic ? 'Si' : 'No'}</td><td>{row.genero_conversion ? 'Si' : 'No'}</td>
                <td className={styles.actionsCell}>
                  <button type="button" className={styles.secondaryButton} onClick={() => handleEdit(row)}>Editar</button>
                  <button type="button" className={styles.dangerButton} onClick={() => handleDelete(row.id_interaccion)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardConectmosInteraccionesCampanas;
