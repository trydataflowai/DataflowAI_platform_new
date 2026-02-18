import React, { useEffect, useState } from 'react';
import { useTheme } from '../../componentes/ThemeContext';
import { useCompanyStyles } from '../../componentes/ThemeContextEmpresa';
import {
  obtenerLeadsBroker,
  crearLead,
  editarLead,
  importarLeads,
} from '../../../api/Brokers/ListadoLeads';
import { exportLeads } from '../../../api/Brokers/ExportLeads';

const emptyLead = {
  nombre_lead: '',
  correo: '',
  persona_de_contacto: '',
  telefono: '',
  pais: '',
  industria: '',
  tamano_empresa: '',
  ticket_estimado: '',
  moneda_ticket: 'USD',
  probabilidad_cierre: '',
  campo_etiqueta: '',
  fuente_lead: '',
  comentarios: '',
  etapa: 'lead_prospecto',
};

const ETAPAS = [
  { key: 'lead_prospecto', label: 'lead prospecto' },
  { key: 'lead_calificado', label: 'lead calificado' },
  { key: 'lead_demo', label: 'lead demo' },
  { key: 'propuesta_enviada', label: 'propuesta enviada' },
  { key: 'lead_ganado', label: 'lead ganado' },
  { key: 'lead_perdido', label: 'lead perdido' },
];

const CrmBrokers = () => {
  const { theme } = useTheme();
  const styles = useCompanyStyles('CrmBokers');

  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [form, setForm] = useState(emptyLead);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [file, setFile] = useState(null);
  const [refreshToggle, setRefreshToggle] = useState(false);
  const [view, setView] = useState('table');
  const [dragOverCol, setDragOverCol] = useState(null);

  const [exportFormat, setExportFormat] = useState('csv');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [exportSuccessMsg, setExportSuccessMsg] = useState(null);

  useEffect(() => {
    loadLeads();
    // eslint-disable-next-line
  }, [refreshToggle]);

  const loadLeads = async (search = '') => {
    setLoading(true);
    setError(null);
    try {
      const data = await obtenerLeadsBroker(search);
      setLeads(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error cargando leads');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadLeads(q);
  };

  const openCreate = () => {
    setForm(emptyLead);
    setShowCreate(true);
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { ...form };
      await crearLead(payload);
      setShowCreate(false);
      setRefreshToggle(s => !s);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error creando lead');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (lead) => {
    const payload = {
      nombre_lead: lead.nombre_lead || '',
      correo: lead.correo || '',
      persona_de_contacto: lead.persona_de_contacto || '',
      telefono: lead.telefono || '',
      pais: lead.pais || '',
      industria: lead.industria || '',
      tamano_empresa: lead.tamano_empresa || '',
      ticket_estimado: lead.ticket_estimado || '',
      moneda_ticket: lead.moneda_ticket || '',
      probabilidad_cierre: lead.probabilidad_cierre || '',
      campo_etiqueta: lead.campo_etiqueta || '',
      fuente_lead: lead.fuente_lead || '',
      comentarios: lead.comentarios || '',
      etapa: lead.etapa || '',
    };
    setEditingLead(lead);
    setForm(payload);
    setShowEdit(true);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editingLead) return;
    setSaving(true);
    setError(null);
    try {
      await editarLead(editingLead.id_lead, form);
      setShowEdit(false);
      setEditingLead(null);
      setRefreshToggle(s => !s);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error editando lead');
    } finally {
      setSaving(false);
    }
  };

  const handleImportFile = (e) => {
    setFile(e.target.files[0]);
    setImportResult(null);
  };

  const submitImport = async () => {
    if (!file) {
      setError('Selecciona un archivo CSV primero');
      return;
    }
    setImporting(true);
    setImportResult(null);
    setError(null);
    try {
      const res = await importarLeads(file);
      setImportResult(res);
      setRefreshToggle(s => !s);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error importando');
    } finally {
      setImporting(false);
      setFile(null);
      const input = document.getElementById('csv-file-input');
      if (input) input.value = '';
    }
  };

  const handleExport = async () => {
    setExportError(null);
    setExportSuccessMsg(null);
    setExporting(true);
    try {
      await exportLeads(exportFormat, q);
      setExportSuccessMsg(`Exportado correctamente (${exportFormat.toUpperCase()})`);
      setTimeout(() => setExportSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error exportando leads:', err);
      setExportError(err.message || 'Error exportando leads');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPlantilla = () => {
    const link = document.createElement('a');
    link.href = '/plantillas_brokers/leads_brokers_ejemplo.csv';
    link.download = 'leads_brokers_ejemplo.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const getBrokerName = (r) => {
    const broker = r?.id_broker;
    if (!broker) return '—';

    const usuario = broker?.usuario || broker?.id_usuario || broker?.user;
    if (usuario) {
      const nombres = usuario?.nombres || usuario?.nombre || '';
      const apellidos = usuario?.apellidos || usuario?.apellido || '';
      const full = `${nombres} ${apellidos}`.trim();
      if (full) return full;
    }

    return broker?.nombre || broker?.nombre_broker || broker?.numero_telefono || broker?.telefono || String(broker?.id_broker || broker?.pk || broker) || '—';
  };

  const onDragStart = (e, leadId) => {
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e, etapaKey) => {
    e.preventDefault();
    setDragOverCol(etapaKey);
    e.dataTransfer.dropEffect = 'move';
  };

  const onDragLeave = () => {
    setDragOverCol(null);
  };

  const onDrop = async (e, newEtapa) => {
    e.preventDefault();
    setDragOverCol(null);
    const idStr = e.dataTransfer.getData('text/plain');
    const id = parseInt(idStr, 10);
    if (!id) return;
    const lead = leads.find(l => l.id_lead === id);
    if (!lead) return;
    if (lead.etapa === newEtapa) return;

    const prevLeads = [...leads];
    setLeads((prev) => prev.map(l => l.id_lead === id ? { ...l, etapa: newEtapa } : l));

    try {
      await editarLead(id, { etapa: newEtapa });
    } catch (err) {
      console.error('Error actualizando etapa:', err);
      setError('No se pudo actualizar la etapa (revirtiendo)...');
      setLeads(prevLeads);
    }
  };

  const leadsByEtapa = ETAPAS.reduce((acc, e) => {
    acc[e.key] = leads.filter(l => l.etapa === e.key);
    return acc;
  }, {});

  // Determinar la clase de tema
  const themeClass = theme === 'dark' ? styles.BrokCrmPerfilgeneralDark : styles.BrokCrmPerfilgeneralLight;

  return (
    <div className={`${styles.BrokCrmContainer} ${themeClass}`}>
      <h1>CRM - Leads</h1>

      {/* Toolbar */}
      <div className={styles.BrokCrmToolbar}>
        <form onSubmit={handleSearch} className={styles.BrokCrmFlexRow}>
          <input
            placeholder="Buscar por nombre, contacto o correo..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ width: 320 }}
          />
          <button type="submit">Buscar</button>
          <button type="button" onClick={() => { setQ(''); loadLeads(''); }}>Limpiar</button>
        </form>

        <div className={styles.BrokCrmFlexRow}>
          <button onClick={openCreate}>Crear lead</button>
          <button onClick={handleExportPlantilla}>Exportar plantilla</button>

          <input id="csv-file-input" type="file" accept=".csv,text/csv" onChange={handleImportFile} />
          <button onClick={submitImport} disabled={importing}>
            {importing ? 'Importando...' : 'Importar CSV'}
          </button>
          <button onClick={() => setRefreshToggle(s => !s)}>Refrescar</button>

          <div className={styles.BrokCrmViewToggle}>
            <button
              className={view === 'table' ? styles.BrokCrmActive : ''}
              onClick={() => setView('table')}
            >
              TABLA
            </button>
            <button
              className={view === 'kanban' ? styles.BrokCrmActive : ''}
              onClick={() => setView('kanban')}
            >
              KANBAN
            </button>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className={styles.BrokCrmFlexRow} style={{ marginTop: 10 }}>
        <label style={{ fontSize: 13 }}>Exportar:</label>
        <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
          <option value="csv">CSV</option>
          <option value="xlsx">Excel (.xlsx)</option>
        </select>
        <button onClick={handleExport} disabled={exporting}>
          {exporting ? 'Exportando...' : `Exportar ${exportFormat === 'xlsx' ? 'Excel' : 'CSV'}`}
        </button>

        {exportSuccessMsg && (
          <div className={styles.BrokCrmSuccessMessage}>{exportSuccessMsg}</div>
        )}
        {exportError && (
          <div className={styles.BrokCrmErrorMessage}>{exportError}</div>
        )}
      </div>

      {/* Import Result */}
      {importResult && (
        <div className={styles.BrokCrmInfoMessage}>
          <strong>Import result:</strong> {JSON.stringify(importResult)}
        </div>
      )}

      {/* Loading & Error */}
      {loading && <div className={styles.BrokCrmInfoMessage}>Cargando leads...</div>}
      {error && <div className={styles.BrokCrmErrorMessage}>{error}</div>}

      {/* Table View */}
      {view === 'table' && !loading && !error && (
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.BrokCrmTable}>
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre lead</th>
                <th>Broker</th>
                <th>Campo de Etiqueta</th>
                <th>% Probabilidad</th>
                <th>Ticket Estimado</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th>Persona de Contacto</th>
                <th>Etapa</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: 24 }}>
                    No hay leads disponibles
                  </td>
                </tr>
              )}
              {leads.map((r) => (
                <tr key={r.id_lead}>
                  <td>{r.id_lead}</td>
                  <td>{r.nombre_lead}</td>
                  <td>{getBrokerName(r)}</td>
                  <td>{r.campo_etiqueta}</td>
                  <td>{r.probabilidad_cierre ?? '-'}</td>
                  <td>{r.ticket_estimado ? `${r.moneda_ticket || ''} ${r.ticket_estimado}` : '-'}</td>
                  <td>{r.telefono}</td>
                  <td>{r.correo}</td>
                  <td>{r.persona_de_contacto}</td>
                  <td>{r.etapa}</td>
                  <td>
                    <button onClick={() => openEdit(r)}>Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Kanban View */}
      {view === 'kanban' && !loading && !error && (
        <div className={styles.BrokCrmKanbanWrapper}>
          <div className={styles.BrokCrmKanbanBoard}>
            {ETAPAS.map((et) => (
              <div
                key={et.key}
                className={`${styles.BrokCrmKanbanColumn} ${dragOverCol === et.key ? styles.BrokCrmDragOver : ''}`}
                onDragOver={(e) => onDragOver(e, et.key)}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e, et.key)}
                role="list"
              >
                <div className={styles.BrokCrmColumnHeader}>{et.label}</div>
                <div className={styles.BrokCrmColumnBody}>
                  {leadsByEtapa[et.key] && leadsByEtapa[et.key].length === 0 && (
                    <div className={styles.BrokCrmEmptyColumn}>Sin leads</div>
                  )}
                  {leadsByEtapa[et.key] && leadsByEtapa[et.key].map((l) => (
                    <div
                      key={l.id_lead}
                      className={styles.BrokCrmCard}
                      draggable
                      onDragStart={(e) => onDragStart(e, l.id_lead)}
                      onDoubleClick={() => openEdit(l)}
                    >
                      <div className={styles.BrokCrmCardTitle}>{l.nombre_lead}</div>
                      <div className={styles.BrokCrmCardMeta}>
                        <small>{getBrokerName(l)}</small>
                      </div>
                      <div className={styles.BrokCrmCardMeta}>
                        <small>{l.campo_etiqueta || '-'}</small>
                      </div>
                      <div className={styles.BrokCrmCardMeta}>
                        <small>% {l.probabilidad_cierre ?? '-'}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className={styles.BrokCrmInfoMessage}>
            * Arrastra una tarjeta a otra columna para cambiar su etapa. Doble-click en una tarjeta para editar.
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className={styles.BrokCrmModal}>
          <h3>Crear lead</h3>
          <form onSubmit={submitCreate}>
            {Object.keys(emptyLead).map((k) => (
              <div key={k}>
                <label>{k.replace(/_/g, ' ')}</label>
                <input
                  name={k}
                  value={form[k] ?? ''}
                  onChange={handleFormChange}
                  placeholder={`Ingresa ${k.replace(/_/g, ' ')}`}
                />
              </div>
            ))}
            <div className={styles.BrokCrmFlexRow} style={{ marginTop: 20 }}>
              <button type="submit" disabled={saving}>
                {saving ? 'Creando...' : 'Crear'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && editingLead && (
        <div className={styles.BrokCrmModal}>
          <h3>Editar lead #{editingLead.id_lead}</h3>
          <form onSubmit={submitEdit}>
            {Object.keys(emptyLead).map((k) => (
              <div key={k}>
                <label>{k.replace(/_/g, ' ')}</label>
                <input
                  name={k}
                  value={form[k] ?? ''}
                  onChange={handleFormChange}
                  placeholder={`Ingresa ${k.replace(/_/g, ' ')}`}
                />
              </div>
            ))}
            <div className={styles.BrokCrmFlexRow} style={{ marginTop: 20 }}>
              <button type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button type="button" onClick={() => { setShowEdit(false); setEditingLead(null); }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CrmBrokers;