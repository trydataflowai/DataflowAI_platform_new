import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../../styles/Dashboards/dashboards-conetcom/DashboardCrudConetcom.module.css';
import {
  actualizarConetcomFactura,
  crearConetcomFactura,
  eliminarConetcomFactura,
  importarConetcomFacturacion,
  obtenerConetcomFacturacion,
} from '../../../api/DashboardsApis/dashboards-conetcom/Dashboardconetcom_facturacion';

const DashboardConectmosFacturacion = () => {
  const navigate = useNavigate();
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
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const initialFilters = {
    id_factura: '',
    id_cliente: '',
    id_producto: '',
    fecha_emision: '',
    estado_factura: '',
    valor_total_facturado: '',
  };
  const [filters, setFilters] = useState(initialFilters);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

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

  const handleImport = async () => {
    if (!importFile) {
      setError('Selecciona un archivo para importar.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      setImporting(true);
      const result = await importarConetcomFacturacion(importFile);
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
      <h1 className={styles.title}>CRUD Conetcom Facturacion</h1>
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
        <div className={styles.formActions}>
          <button type="submit" className={styles.primaryButton} disabled={saving}>{editingId ? 'Actualizar' : 'Crear'}</button>
          <button type="button" className={styles.secondaryButton} onClick={resetForm}>Limpiar</button>
        </div>
      </form>
      <div className={styles.searchForm}>
        <input
          name="id_factura"
          placeholder="Filtrar factura"
          value={filters.id_factura}
          onChange={handleFilterChange}
        />
        <input
          name="id_cliente"
          placeholder="Filtrar cliente"
          value={filters.id_cliente}
          onChange={handleFilterChange}
        />
        <input
          name="id_producto"
          placeholder="Filtrar producto"
          value={filters.id_producto}
          onChange={handleFilterChange}
        />
        <input
          name="fecha_emision"
          placeholder="Filtrar emision"
          value={filters.fecha_emision}
          onChange={handleFilterChange}
        />
        <input
          name="estado_factura"
          placeholder="Filtrar estado"
          value={filters.estado_factura}
          onChange={handleFilterChange}
        />
        <input
          name="valor_total_facturado"
          placeholder="Filtrar total"
          value={filters.valor_total_facturado}
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
      {loading ? <p className={styles.loading}>Cargando facturacion...</p> : null}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead><tr><th>Factura</th><th>Cliente</th><th>Emision</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.id_factura}>
                <td>{row.id_factura}</td><td>{row.id_cliente}</td><td>{row.fecha_emision}</td><td>{row.valor_total_facturado}</td><td>{row.estado_factura}</td>
                <td className={styles.actionsCell}>
                  <button type="button" className={styles.secondaryButton} onClick={() => handleEdit(row)}>Editar</button>
                  <button type="button" className={styles.dangerButton} onClick={() => handleDelete(row.id_factura)}>Eliminar</button>
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
