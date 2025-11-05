// src/components/pages/SoporteUsuario.jsx
import React, { useEffect, useState } from 'react';
import defaultDarkStyles from '../../styles/SoporteUsuario.module.css';
import defaultLightStyles from '../../styles/SoporteUsuarioLight.module.css';

import { obtenerTickets, crearTicket, obtenerDetalleTicket } from '../../api/SoporteUsuario';
import { obtenerInfoUsuario } from '../../api/Usuario';
import { useTheme } from '../componentes/ThemeContext';

/*
  Lógica de estilos por empresa:
  - Buscamos módulos:
      src/styles/empresas/{companyId}/SoporteUsuario.module.css      (dark)
      src/styles/empresas/{companyId}/SoporteUsuarioLight.module.css (light)
  - Si el plan es 3 o 6 y los archivos por empresa existen, usamos los estilos por empresa.
  - Si no, fallback a los estilos por defecto importados arriba.
  - Utilizamos import.meta.glob(..., { eager: true }) para que Vite incluya los módulos en el bundle.
*/
const empresaLightModules = import.meta.glob(
  '../../styles/empresas/*/SoporteUsuarioLight.module.css',
  { eager: true }
);
const empresaDarkModules = import.meta.glob(
  '../../styles/empresas/*/SoporteUsuario.module.css',
  { eager: true }
);

const SoporteUsuario = () => {
  const { theme } = useTheme(); // 'dark' | 'light'
  const [activeStyles, setActiveStyles] = useState(defaultDarkStyles);

  const [allTickets, setAllTickets] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ correo: '', asunto: '', descripcion: '' });
  const [submitting, setSubmitting] = useState(false);

  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterError, setFilterError] = useState(null);

  const [error, setError] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  // Plan & permissions
  const [planId, setPlanId] = useState(null);
  const [planName, setPlanName] = useState('');
  const [companyId, setCompanyId] = useState(null);

  // Fetch user info (para obtener planId y companyId)
  const fetchUsuario = async () => {
    try {
      const user = await obtenerInfoUsuario();
      const pid = user?.empresa?.plan?.id ?? null;
      setPlanId(pid);
      setPlanName(user?.empresa?.plan?.tipo ?? '');
      setCompanyId(user?.empresa?.id ?? null);
    } catch (err) {
      console.warn('No se pudo obtener info usuario:', err);
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await obtenerTickets();
      const list = data || [];
      setAllTickets(list);
      setTickets(list);
    } catch (err) {
      console.error(err);
      setFetchError('No se pudieron cargar los tickets. Revisa tu sesión o la conexión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuario();
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Determinar estilos activos según plan, company y theme
  useEffect(() => {
    // Planes 3 y 6 permiten toggle y/o estilos por empresa.
    const useCompanyStyles = (planId === 3 || planId === 6) && companyId;

    const lightKey = `../../styles/empresas/${companyId}/SoporteUsuarioLight.module.css`;
    const darkKey = `../../styles/empresas/${companyId}/SoporteUsuario.module.css`;

    const foundCompanyLight = empresaLightModules[lightKey];
    const foundCompanyDark = empresaDarkModules[darkKey];

    const extract = (mod) => {
      if (!mod) return null;
      return mod.default ?? mod;
    };

    const companyLight = extract(foundCompanyLight);
    const companyDark = extract(foundCompanyDark);

    let chosenStyles = defaultDarkStyles;
    if (theme === 'dark') {
      if (useCompanyStyles && companyDark) {
        chosenStyles = companyDark;
      } else {
        chosenStyles = defaultDarkStyles;
      }
    } else {
      if (useCompanyStyles && companyLight) {
        chosenStyles = companyLight;
      } else {
        chosenStyles = defaultLightStyles;
      }
    }

    setActiveStyles(chosenStyles);
  }, [theme, planId, companyId]);

  // bloquear scroll cuando hay modal
  useEffect(() => {
    const original = document.body.style.overflow;
    if (modal) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = original;
    return () => { document.body.style.overflow = original; };
  }, [modal]);

  const openCreateModal = () => {
    setError(null);
    setForm({ correo: '', asunto: '', descripcion: '' });
    setModal({ mode: 'create' });
  };

  const openDetailModal = async (id) => {
    setError(null);
    try {
      setModal({ mode: 'detail', loading: true, ticketId: id, data: null });
      const detail = await obtenerDetalleTicket(id);
      setModal({ mode: 'detail', loading: false, ticketId: id, data: detail || null });
    } catch (err) {
      console.error(err);
      setModal(null);
      setError('No se pudo obtener el detalle del ticket.');
    }
  };

  const closeModal = () => setModal(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.correo || !form.asunto) {
      setError('Correo y asunto son obligatorios.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { correo: form.correo, asunto: form.asunto, descripcion: form.descripcion };
      await crearTicket(payload);
      await fetchTickets();
      closeModal();
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Error al crear el ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (val) => val ? new Date(val).toLocaleString() : '-';

  // FILTER FUNCTIONS
  const applyDateFilter = () => {
    setFilterError(null);

    if (!filterFrom && !filterTo) {
      setTickets(allTickets);
      return;
    }

    if (filterFrom && filterTo && filterFrom > filterTo) {
      setFilterError('La fecha "desde" no puede ser posterior a la fecha "hasta".');
      return;
    }

    const start = filterFrom ? (() => { const d = new Date(filterFrom); d.setHours(0,0,0,0); return d; })() : null;
    const end = filterTo ? (() => { const d = new Date(filterTo); d.setHours(23,59,59,999); return d; })() : null;

    const filtered = allTickets.filter(t => {
      if (!t.fecha_creacion) return false;
      const td = new Date(t.fecha_creacion);
      if (start && td < start) return false;
      if (end && td > end) return false;
      return true;
    });
    setTickets(filtered);
  };

  const clearFilter = () => {
    setFilterFrom('');
    setFilterTo('');
    setFilterError(null);
    setTickets(allTickets);
  };

  return (
    <div className={activeStyles.container}>
      <header className={activeStyles.header}>
        <div className={activeStyles.headerLeft}>
          <h1 className={activeStyles.title}>Soporte</h1>
          <p className={activeStyles.subtitle}>Crea y consulta tus tickets</p>
        </div>

        <div className={activeStyles.headerRight}>
          <div className={activeStyles.filterBar}>
            <label className={activeStyles.filterLabel}>
              Desde
              <input
                type="date"
                className={activeStyles.dateInput}
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
              />
            </label>

            <label className={activeStyles.filterLabel}>
              Hasta
              <input
                type="date"
                className={activeStyles.dateInput}
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
              />
            </label>

            <button className={activeStyles.filterBtn} onClick={applyDateFilter}>Aplicar</button>
            <button className={activeStyles.clearBtn} onClick={clearFilter}>Limpiar</button>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className={activeStyles.primaryButton} onClick={openCreateModal}>
              + Crear ticket
            </button>
          </div>
        </div>
      </header>

      {fetchError && <div className={activeStyles.fetchError}>{fetchError}</div>}
      {filterError && <div className={activeStyles.filterError}>{filterError}</div>}

      <section className={activeStyles.tableContainer}>
        <div className={activeStyles.tableWrapper}>
          <table className={activeStyles.table}>
            <thead>
              <tr>
                <th style={{width: '6%'}}>ID</th>
                <th style={{width: '34%'}}>Asunto</th>
                <th style={{width: '20%'}}>Correo</th>
                <th style={{width: '12%'}}>Estado</th>
                <th style={{width: '16%'}}>Fecha creación</th>
                <th style={{width: '12%'}}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className={activeStyles.noData}>Cargando tickets...</td></tr>
              ) : tickets?.length === 0 ? (
                <tr><td colSpan="6" className={activeStyles.noData}>No hay tickets para las fechas seleccionadas.</td></tr>
              ) : (
                tickets.map(t => (
                  <tr key={t.id_ticket} className={activeStyles.row}>
                    <td>{t.id_ticket}</td>
                    <td className={activeStyles.cellAsunto}>{t.asunto}</td>
                    <td className={activeStyles.muted}>{t.correo}</td>
                    <td>{t.estado}</td>
                    <td className={activeStyles.muted}>{t.fecha_creacion ? fmt(t.fecha_creacion) : '-'}</td>
                    <td>
                      <div className={activeStyles.rowActions}>
                        <button
                          className={activeStyles.primarySmall}
                          onClick={() => openDetailModal(t.id_ticket)}
                        >
                          Ver detalle
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal: create */}
      {modal && modal.mode === 'create' && (
        <div className={activeStyles.modalBackdrop} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className={activeStyles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={activeStyles.modalHeader}>
              <div>
                <h3 className={activeStyles.modalTitle}>Crear ticket</h3>
                <div className={activeStyles.modalSubtitle}>Envía tu consulta o problema y lo revisaremos.</div>
              </div>
              <button className={activeStyles.closeBtn} onClick={closeModal}>Cerrar</button>
            </div>

            <form className={activeStyles.modalBody} onSubmit={handleCreate}>
              {error && <div className={activeStyles.formError}>{error}</div>}

              <label className={activeStyles.label}>
                <span className={activeStyles.labelText}>Correo</span>
                <input className={activeStyles.input} name="correo" type="email" value={form.correo} onChange={handleChange} placeholder="tu@correo.com" required />
              </label>

              <label className={activeStyles.label}>
                <span className={activeStyles.labelText}>Asunto</span>
                <input className={activeStyles.input} name="asunto" value={form.asunto} onChange={handleChange} placeholder="Asunto del ticket" required />
              </label>

              <label className={activeStyles.label}>
                <span className={activeStyles.labelText}>Descripción</span>
                <textarea className={activeStyles.textarea} name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Describe el problema..." rows={6} />
              </label>

              <div className={activeStyles.modalFooter}>
                <button type="button" className={activeStyles.secondaryBtn} onClick={closeModal}>Cancelar</button>
                <button type="submit" className={activeStyles.primaryButton} disabled={submitting}>{submitting ? 'Creando...' : 'Crear ticket'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: detail */}
      {modal && modal.mode === 'detail' && (
        <div className={activeStyles.modalBackdrop} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className={activeStyles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={activeStyles.modalHeader}>
              <div>
                <h3 className={activeStyles.modalTitle}>Detalle Ticket {modal.ticketId ? `#${modal.ticketId}` : ''}</h3>
                <div className={activeStyles.modalSubtitle}>{modal.data?.asunto || ''}</div>
              </div>
              <button className={activeStyles.closeBtn} onClick={closeModal}>Cerrar</button>
            </div>

            <div className={activeStyles.modalBody}>
              {!modal.loading && modal.data ? (
                <>
                  <div className={activeStyles.detailRow}><strong>Asunto:</strong> <div className={activeStyles.detailBlock}>{modal.data.asunto}</div></div>
                  <div className={activeStyles.detailRow}><strong>Correo:</strong> <div className={activeStyles.detailBlock}>{modal.data.correo}</div></div>
                  <div className={activeStyles.detailRow}><strong>Descripción:</strong> <div className={activeStyles.detailBlock}>{modal.data.descripcion || '-'}</div></div>
                  <div className={activeStyles.detailRow}><strong>Comentario:</strong> <div className={activeStyles.detailBlock}>{modal.data.comentario || '-'}</div></div>
                  <div className={activeStyles.detailRow}><strong>Estado:</strong> <div className={activeStyles.detailBlock}>{modal.data.estado}</div></div>
                  <div className={activeStyles.detailRow}><strong>Fecha creación:</strong> <div className={activeStyles.detailBlock}>{modal.data.fecha_creacion ? fmt(modal.data.fecha_creacion) : '-'}</div></div>
                  <div className={activeStyles.detailRow}><strong>Fecha cierre:</strong> <div className={activeStyles.detailBlock}>{modal.data.fecha_cierre ? fmt(modal.data.fecha_cierre) : '-'}</div></div>
                </>
              ) : modal.loading ? (
                <div className={activeStyles.noData}>Cargando detalle...</div>
              ) : (
                <div className={activeStyles.noData}>No hay detalle disponible.</div>
              )}
            </div>

            <div className={activeStyles.modalFooter}>
              <button className={activeStyles.secondaryBtn} onClick={closeModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoporteUsuario;
