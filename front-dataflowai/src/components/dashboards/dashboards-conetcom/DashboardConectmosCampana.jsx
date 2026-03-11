import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../../styles/Dashboards/dashboards-conetcom/DashboardCrudConetcom.module.css';
import {
  actualizarConetcomCampana,
  crearConetcomCampana,
  eliminarConetcomCampana,
  importarConetcomCampanas,
  obtenerConetcomCampanas,
} from '../../../api/DashboardsApis/dashboards-conetcom/Dashboardconetcom_campanas';

const DashboardConectmosCampana = () => {
  const navigate = useNavigate();
  const initialForm = {
    id_campana: '',
    id_producto: '',
    nombre_campana: '',
    fecha_inicio: '',
    fecha_fin: '',
    canal: '',
    segmento_objetivo: '',
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
    id_campana: '',
    id_producto: '',
    nombre_campana: '',
    canal: '',
    fecha_inicio: '',
    fecha_fin: '',
    segmento_objetivo: '',
  };
  const [filters, setFilters] = useState(initialFilters);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const cargar = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await obtenerConetcomCampanas();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar campanas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
    if (!form.id_producto) return setError('id_producto es obligatorio.');
    if (!form.nombre_campana) return setError('nombre_campana es obligatorio.');

    try {
      setSaving(true);
      const payload = { ...form, id_producto: Number(form.id_producto) };
      if (editingId) {
        await actualizarConetcomCampana(editingId, payload);
        setSuccess('Campana actualizada correctamente.');
      } else {
        await crearConetcomCampana(payload);
        setSuccess('Campana creada correctamente.');
      }
      resetForm();
      await cargar();
    } catch (err) {
      setError(err.message || 'No se pudo guardar la campana.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id_campana);
    setForm({
      id_campana: row.id_campana || '',
      id_producto: row.id_producto || '',
      nombre_campana: row.nombre_campana || '',
      fecha_inicio: row.fecha_inicio || '',
      fecha_fin: row.fecha_fin || '',
      canal: row.canal || '',
      segmento_objetivo: row.segmento_objetivo || '',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Seguro que deseas eliminar esta campana?')) return;
    try {
      await eliminarConetcomCampana(id);
      setSuccess('Campana eliminada correctamente.');
      if (editingId === id) resetForm();
      await cargar();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la campana.');
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
      const result = await importarConetcomCampanas(importFile);
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
      <h1 className={styles.title}>CRUD Conetcom Campanas</h1>
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
        <input name="id_campana" placeholder="id_campana" value={form.id_campana} onChange={handleChange} disabled={Boolean(editingId)} required />
        <input name="id_producto" placeholder="id_producto" value={form.id_producto} onChange={handleChange} required />
        <input name="nombre_campana" placeholder="nombre_campana" value={form.nombre_campana} onChange={handleChange} required />
        <input name="fecha_inicio" type="date" value={form.fecha_inicio} onChange={handleChange} />
        <input name="fecha_fin" type="date" value={form.fecha_fin} onChange={handleChange} />
        <input name="canal" placeholder="canal (retail, ecommerce, etc)" value={form.canal} onChange={handleChange} />
        <input name="segmento_objetivo" placeholder="segmento_objetivo" value={form.segmento_objetivo} onChange={handleChange} />
        <div className={styles.formActions}>
          <button type="submit" className={styles.primaryButton} disabled={saving}>{editingId ? 'Actualizar' : 'Crear'}</button>
          <button type="button" className={styles.secondaryButton} onClick={resetForm}>Limpiar</button>
        </div>
      </form>

      <div className={styles.searchForm}>
        <input
          name="id_campana"
          placeholder="Filtrar id_campana"
          value={filters.id_campana}
          onChange={handleFilterChange}
        />
        <input
          name="id_producto"
          placeholder="Filtrar id_producto"
          value={filters.id_producto}
          onChange={handleFilterChange}
        />
        <input
          name="nombre_campana"
          placeholder="Filtrar nombre_campana"
          value={filters.nombre_campana}
          onChange={handleFilterChange}
        />
        <input name="canal" placeholder="Filtrar canal" value={filters.canal} onChange={handleFilterChange} />
        <input
          name="fecha_inicio"
          placeholder="Filtrar fecha_inicio"
          value={filters.fecha_inicio}
          onChange={handleFilterChange}
        />
        <input
          name="fecha_fin"
          placeholder="Filtrar fecha_fin"
          value={filters.fecha_fin}
          onChange={handleFilterChange}
        />
        <input
          name="segmento_objetivo"
          placeholder="Filtrar segmento_objetivo"
          value={filters.segmento_objetivo}
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

      {loading ? <p className={styles.loading}>Cargando campanas...</p> : null}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Producto</th>
              <th>Nombre</th>
              <th>Canal</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.id_campana}>
                <td>{row.id_campana}</td>
                <td>{row.id_producto}</td>
                <td>{row.nombre_campana}</td>
                <td>{row.canal || '-'}</td>
                <td>{row.fecha_inicio || '-'}</td>
                <td>{row.fecha_fin || '-'}</td>
                <td className={styles.actionsCell}>
                  <button type="button" className={styles.secondaryButton} onClick={() => handleEdit(row)}>Editar</button>
                  <button type="button" className={styles.dangerButton} onClick={() => handleDelete(row.id_campana)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardConectmosCampana;
