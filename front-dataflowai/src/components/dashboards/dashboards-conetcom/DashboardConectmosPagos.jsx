import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../../styles/Dashboards/dashboards-conetcom/DashboardCrudConetcom.module.css';
import {
  actualizarConetcomPago,
  crearConetcomPago,
  eliminarConetcomPago,
  importarConetcomPagos,
  obtenerConetcomPagos,
} from '../../../api/DashboardsApis/dashboards-conetcom/Dashboardconetcom_pagos';

const DashboardConectmosPagos = () => {
  const navigate = useNavigate();
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
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const initialFilters = {
    id_pago: '',
    id_cliente: '',
    id_factura_asociada: '',
    fecha_pago: '',
    valor_pagado: '',
    estado_pago: '',
  };
  const [filters, setFilters] = useState(initialFilters);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

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

  const handleImport = async () => {
    if (!importFile) {
      setError('Selecciona un archivo para importar.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      setImporting(true);
      const result = await importarConetcomPagos(importFile);
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
      <h1 className={styles.title}>CRUD Conetcom Pagos</h1>
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
        <div className={styles.formActions}>
          <button type="submit" className={styles.primaryButton} disabled={saving}>{editingId ? 'Actualizar' : 'Crear'}</button>
          <button type="button" className={styles.secondaryButton} onClick={resetForm}>Limpiar</button>
        </div>
      </form>
      <div className={styles.searchForm}>
        <input name="id_pago" placeholder="Filtrar id_pago" value={filters.id_pago} onChange={handleFilterChange} />
        <input
          name="id_cliente"
          placeholder="Filtrar id_cliente"
          value={filters.id_cliente}
          onChange={handleFilterChange}
        />
        <input
          name="id_factura_asociada"
          placeholder="Filtrar factura"
          value={filters.id_factura_asociada}
          onChange={handleFilterChange}
        />
        <input
          name="fecha_pago"
          placeholder="Filtrar fecha_pago"
          value={filters.fecha_pago}
          onChange={handleFilterChange}
        />
        <input
          name="valor_pagado"
          placeholder="Filtrar valor"
          value={filters.valor_pagado}
          onChange={handleFilterChange}
        />
        <input
          name="estado_pago"
          placeholder="Filtrar estado"
          value={filters.estado_pago}
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
      {loading ? <p className={styles.loading}>Cargando pagos...</p> : null}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead><tr><th>ID</th><th>Cliente</th><th>Factura</th><th>Valor</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.id_pago}>
                <td>{row.id_pago}</td><td>{row.id_cliente}</td><td>{row.id_factura_asociada || '-'}</td><td>{row.valor_pagado}</td><td>{row.estado_pago || '-'}</td>
                <td className={styles.actionsCell}>
                  <button type="button" className={styles.secondaryButton} onClick={() => handleEdit(row)}>Editar</button>
                  <button type="button" className={styles.dangerButton} onClick={() => handleDelete(row.id_pago)}>Eliminar</button>
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
