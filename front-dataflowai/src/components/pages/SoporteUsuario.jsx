// src/components/pages/SoporteUsuario.jsx
import React, { useEffect, useState } from 'react';
import defaultStyles from '../../styles/SoporteUsuario.module.css';

import { obtenerTickets, crearTicket, obtenerDetalleTicket } from '../../api/SoporteUsuario';
import { obtenerInfoUsuario } from '../../api/Usuario';
import { useTheme } from '../componentes/ThemeContext';
import { useCompanyStyles } from '../componentes/ThemeContextEmpresa';

const SoporteUsuario = () => {
  const { theme } = useTheme(); // 'dark' | 'light'
  // obtener estilos (provider debe estar envuelto en App para evitar parpadeos)
  const companyStyles = useCompanyStyles('SoporteUsuario', defaultStyles);
  const styles = companyStyles || defaultStyles;

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

  // Plan & permissions (puedes seguir usándolos en UI si los necesitas)
  const [planId, setPlanId] = useState(null);
  const [planName, setPlanName] = useState('');
  const [companyId, setCompanyId] = useState(null);

  // Fetch user info (para obtener planId y companyId) - opcional si ya lo hace el provider
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

  // Elegir la variante según el theme (fallback defensivo)
  const variantClass = theme === "dark"
    ? (styles?.dark || defaultStyles.dark)
    : (styles?.light || defaultStyles.light);

  return (
    <div className={`${styles.container} ${variantClass}`}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Soporte</h1>
          <p className={styles.subtitle}>Crea y consulta tus tickets</p>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.filterBar}>
            <label className={styles.filterLabel}>
              Desde
              <input
                type="date"
                className={styles.dateInput}
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
              />
            </label>

            <label className={styles.filterLabel}>
              Hasta
              <input
                type="date"
                className={styles.dateInput}
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
              />
            </label>

            <button className={styles.filterBtn} onClick={applyDateFilter}>Aplicar</button>
            <button className={styles.clearBtn} onClick={clearFilter}>Limpiar</button>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className={styles.primaryButton} onClick={openCreateModal}>
              + Crear ticket
            </button>
          </div>
        </div>
      </header>

      {fetchError && <div className={styles.fetchError}>{fetchError}</div>}
      {filterError && <div className={styles.filterError}>{filterError}</div>}

      <section className={styles.tableContainer}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
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
                <tr><td colSpan="6" className={styles.noData}>Cargando tickets...</td></tr>
              ) : tickets?.length === 0 ? (
                <tr><td colSpan="6" className={styles.noData}>No hay tickets para las fechas seleccionadas.</td></tr>
              ) : (
                tickets.map(t => (
                  <tr key={t.id_ticket} className={styles.row}>
                    <td>{t.id_ticket}</td>
                    <td className={styles.cellAsunto}>{t.asunto}</td>
                    <td className={styles.muted}>{t.correo}</td>
                    <td>{t.estado}</td>
                    <td className={styles.muted}>{t.fecha_creacion ? fmt(t.fecha_creacion) : '-'}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          className={styles.primarySmall}
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
        <div className={styles.modalBackdrop} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Crear ticket</h3>
                <div className={styles.modalSubtitle}>Envía tu consulta o problema y lo revisaremos.</div>
              </div>
              <button className={styles.closeBtn} onClick={closeModal}>Cerrar</button>
            </div>

            <form className={styles.modalBody} onSubmit={handleCreate}>
              {error && <div className={styles.formError}>{error}</div>}

              <label className={styles.label}>
                <span className={styles.labelText}>Correo</span>
                <input className={styles.input} name="correo" type="email" value={form.correo} onChange={handleChange} placeholder="tu@correo.com" required />
              </label>

              <label className={styles.label}>
                <span className={styles.labelText}>Asunto</span>
                <input className={styles.input} name="asunto" value={form.asunto} onChange={handleChange} placeholder="Asunto del ticket" required />
              </label>

              <label className={styles.label}>
                <span className={styles.labelText}>Descripción</span>
                <textarea className={styles.textarea} name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Describe el problema..." rows={6} />
              </label>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.secondaryBtn} onClick={closeModal}>Cancelar</button>
                <button type="submit" className={styles.primaryButton} disabled={submitting}>{submitting ? 'Creando...' : 'Crear ticket'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: detail */}
      {modal && modal.mode === 'detail' && (
        <div className={styles.modalBackdrop} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Detalle Ticket {modal.ticketId ? `#${modal.ticketId}` : ''}</h3>
                <div className={styles.modalSubtitle}>{modal.data?.asunto || ''}</div>
              </div>
              <button className={styles.closeBtn} onClick={closeModal}>Cerrar</button>
            </div>

            <div className={styles.modalBody}>
              {!modal.loading && modal.data ? (
                <>
                  <div className={styles.detailRow}><strong>Asunto:</strong> <div className={styles.detailBlock}>{modal.data.asunto}</div></div>
                  <div className={styles.detailRow}><strong>Correo:</strong> <div className={styles.detailBlock}>{modal.data.correo}</div></div>
                  <div className={styles.detailRow}><strong>Descripción:</strong> <div className={styles.detailBlock}>{modal.data.descripcion || '-'}</div></div>
                  <div className={styles.detailRow}><strong>Comentario:</strong> <div className={styles.detailBlock}>{modal.data.comentario || '-'}</div></div>
                  <div className={styles.detailRow}><strong>Estado:</strong> <div className={styles.detailBlock}>{modal.data.estado}</div></div>
                  <div className={styles.detailRow}><strong>Fecha creación:</strong> <div className={styles.detailBlock}>{modal.data.fecha_creacion ? fmt(modal.data.fecha_creacion) : '-'}</div></div>
                  <div className={styles.detailRow}><strong>Fecha cierre:</strong> <div className={styles.detailBlock}>{modal.data.fecha_cierre ? fmt(modal.data.fecha_cierre) : '-'}</div></div>
                </>
              ) : modal.loading ? (
                <div className={styles.noData}>Cargando detalle...</div>
              ) : (
                <div className={styles.noData}>No hay detalle disponible.</div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.secondaryBtn} onClick={closeModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoporteUsuario;
