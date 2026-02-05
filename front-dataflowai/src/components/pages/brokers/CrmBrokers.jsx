// src/components/pages/brokers/CrmBrokers.jsx
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
      // quitar campos vacíos que no queremos enviar
      const payload = { ...form };
      // enviar
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
    // preparar data para editar (no traer id_broker en el payload)
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
      // limpiar input file (si existe)
      const input = document.getElementById('csv-file-input');
      if (input) input.value = '';
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className={styles.container}>
      <h1>CRM - Leads</h1>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <form onSubmit={handleSearch}>
          <input
            placeholder="Buscar por nombre, contacto o correo..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ padding: '6px 8px', width: 320 }}
          />
          <button type="submit" style={{ marginLeft: 8 }}>Buscar</button>
        </form>

        <button onClick={() => { setQ(''); loadLeads(''); }} style={{ marginLeft: 8 }}>Limpiar</button>

        <button onClick={openCreate} style={{ marginLeft: 8 }}>Crear lead</button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <input id="csv-file-input" type="file" accept=".csv,text/csv" onChange={handleImportFile} />
          <button onClick={submitImport} disabled={importing}>{importing ? 'Importando...' : 'Importar CSV'}</button>
          <button onClick={() => setRefreshToggle(s => !s)}>Refrescar</button>
        </div>
      </div>

      {importResult && (
        <div style={{ marginBottom: 12 }}>
          <strong>Import result:</strong> {JSON.stringify(importResult)}
        </div>
      )}

      {loading && <div>Cargando leads...</div>}
      {error && <div style={{ color: 'crimson' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.table || ''} style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre lead</th>
                <th>Contacto</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th>País</th>
                <th>Industria</th>
                <th>Ticket</th>
                <th>Prob. cierre</th>
                <th>Etiqueta</th>
                <th>Fuente</th>
                <th>Etapa</th>
                <th>Broker (usuario)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr>
                  <td colSpan={14} style={{ textAlign: 'center', padding: 12 }}>No hay leads</td>
                </tr>
              )}
              {leads.map((r) => (
                <tr key={r.id_lead}>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{r.id_lead}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{r.nombre_lead}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{r.persona_de_contacto}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{r.telefono}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{r.correo}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{r.pais}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{r.industria}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{r.ticket_estimado ? `${r.moneda_ticket || ''} ${r.ticket_estimado}` : '-'}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{r.probabilidad_cierre ?? '-'}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{r.campo_etiqueta}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{r.fuente_lead}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{r.etapa}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                    {r.id_broker?.usuario ? `${r.id_broker.usuario.nombres || ''} ${r.id_broker.usuario.apellidos || ''} (${r.id_broker.usuario.correo})` : '—'}
                  </td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                    <button onClick={() => openEdit(r)}>Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
