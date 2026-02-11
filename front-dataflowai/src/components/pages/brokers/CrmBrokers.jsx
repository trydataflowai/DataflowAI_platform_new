import React, { useEffect, useState } from 'react';
import styles from '../../../styles/CreacionUsuario.module.css';
import {
  obtenerLeadsBroker,
  crearLead,
  editarLead,
  importarLeads,
} from '../../../api/Brokers/ListadoLeads';

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
  const [view, setView] = useState('table'); // 'table' | 'kanban'
  const [dragOverCol, setDragOverCol] = useState(null);

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

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // utils
  const getBrokerName = (r) => {
    // r.id_broker?.usuario may be shaped differently; guard defensively
    const u = r?.id_broker?.usuario || r?.id_broker;
    if (!u) return '—';
    const nombres = u.nombres || u.nombre || '';
    const apellidos = u.apellidos || u.apellido || '';
    const full = `${nombres} ${apellidos}`.trim();
    return full || '—';
  };

  // Drag & Drop handlers
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

    // optimistic update
    const prevLeads = [...leads];
    setLeads((prev) => prev.map(l => l.id_lead === id ? { ...l, etapa: newEtapa } : l));

    try {
      await editarLead(id, { etapa: newEtapa });
    } catch (err) {
      console.error('Error actualizando etapa:', err);
      setError('No se pudo actualizar la etapa (revirtiendo)...');
      setLeads(prevLeads); // revert
    }
  };

  // group leads by etapa
  const leadsByEtapa = ETAPAS.reduce((acc, e) => {
    acc[e.key] = leads.filter(l => l.etapa === e.key);
    return acc;
  }, {});

  return (
    <div className={styles.container}>
      <h1>CRM - Leads</h1>

      <div className={styles.toolbar}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            placeholder="Buscar por nombre, contacto o correo..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ padding: '6px 8px', width: 320 }}
          />
          <button type="submit">Buscar</button>
          <button type="button" onClick={() => { setQ(''); loadLeads(''); }}>Limpiar</button>
        </form>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={openCreate}>Crear lead</button>

          <input id="csv-file-input" type="file" accept=".csv,text/csv" onChange={handleImportFile} />
          <button onClick={submitImport} disabled={importing}>{importing ? 'Importando...' : 'Importar CSV'}</button>
          <button onClick={() => setRefreshToggle(s => !s)}>Refrescar</button>

          <div className={styles.viewToggle}>
            <button
              className={view === 'table' ? styles.active : ''}
              onClick={() => setView('table')}
            >
              TABLA
            </button>
            <button
              className={view === 'kanban' ? styles.active : ''}
              onClick={() => setView('kanban')}
            >
              KANBAN
            </button>
          </div>
        </div>
      </div>

      {importResult && (
        <div style={{ marginBottom: 12 }}>
          <strong>Import result:</strong> {JSON.stringify(importResult)}
        </div>
      )}

      {loading && <div>Cargando leads...</div>}
      {error && <div style={{ color: 'crimson' }}>{error}</div>}

      {/* TABLE VIEW */}
      {view === 'table' && !loading && !error && (
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.table || ''} style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre lead</th>
                <th>Broker</th>
                <th>Campo de Etiqueta</th>
                <th>%Probabilidad de Cierre</th>
                <th>Ticket Estimado</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th>Persona de Contacto</th>
                <th>Etapa</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: 12 }}>No hay leads</td>
                </tr>
              )}
              {leads.map((r) => (
                <tr key={r.id_lead}>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{r.id_lead}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{r.nombre_lead}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{getBrokerName(r)}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{r.campo_etiqueta}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{r.probabilidad_cierre ?? '-'}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{r.ticket_estimado ? `${r.moneda_ticket || ''} ${r.ticket_estimado}` : '-'}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{r.telefono}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{r.correo}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{r.persona_de_contacto}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{r.etapa}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                    <button onClick={() => openEdit(r)}>Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* KANBAN VIEW */}
      {view === 'kanban' && !loading && !error && (
        <div className={styles.kanbanWrapper}>
          <div className={styles.kanbanBoard} /* row-reverse to show columns right-to-left visually */>
            {ETAPAS.map((et) => (
              <div
                key={et.key}
                className={`${styles.kanbanColumn} ${dragOverCol === et.key ? styles.dragOver : ''}`}
                onDragOver={(e) => onDragOver(e, et.key)}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e, et.key)}
                role="list"
              >
                <div className={styles.columnHeader}>{et.label}</div>
                <div className={styles.columnBody}>
                  {leadsByEtapa[et.key] && leadsByEtapa[et.key].length === 0 && (
                    <div className={styles.emptyColumn}>—</div>
                  )}
                  {leadsByEtapa[et.key] && leadsByEtapa[et.key].map((l) => (
                    <div
                      key={l.id_lead}
                      className={styles.card}
                      draggable
                      onDragStart={(e) => onDragStart(e, l.id_lead)}
                      onDoubleClick={() => openEdit(l)}
                    >
                      <div className={styles.cardTitle}>{l.nombre_lead}</div>
                      <div className={styles.cardMeta}>
                        <small>{getBrokerName(l)}</small>
                      </div>
                      <div className={styles.cardMeta}>
                        <small>{l.campo_etiqueta || '-'}</small>
                      </div>
                      <div className={styles.cardMeta}>
                        <small>% {l.probabilidad_cierre ?? '-'}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: '#666' }}>
            * Arrastra una tarjeta a otra columna para cambiar su etapa. Doble-click en una tarjeta para editar.
          </div>
        </div>
      )}

      {/* Modal Create */}
      {showCreate && (
        <div className={styles.modal || ''} style={{ padding: 12 }}>
          <h3>Crear lead</h3>
          <form onSubmit={submitCreate}>
            {Object.keys(emptyLead).map((k) => (
              <div key={k} style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', fontSize: 13 }}>{k.replace('_', ' ')}</label>
                <input name={k} value={form[k] ?? ''} onChange={(e) => handleFormChange(e)} />
              </div>
            ))}
            <div style={{ marginTop: 10 }}>
              <button type="submit" disabled={saving}>{saving ? 'Creando...' : 'Crear'}</button>
              <button type="button" onClick={() => setShowCreate(false)} style={{ marginLeft: 8 }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Edit */}
      {showEdit && editingLead && (
        <div className={styles.modal || ''} style={{ padding: 12 }}>
          <h3>Editar lead #{editingLead.id_lead}</h3>
          <form onSubmit={submitEdit}>
            {Object.keys(emptyLead).map((k) => (
              <div key={k} style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', fontSize: 13 }}>{k.replace('_', ' ')}</label>
                <input name={k} value={form[k] ?? ''} onChange={(e) => handleFormChange(e)} />
              </div>
            ))}
            <div style={{ marginTop: 10 }}>
              <button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
              <button type="button" onClick={() => { setShowEdit(false); setEditingLead(null); }} style={{ marginLeft: 8 }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default CrmBrokers;
