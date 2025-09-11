import React, { useEffect, useState } from 'react';
import styles from '../../styles/CreacionUsuario.module.css';
import { obtenerTickets, crearTicket, obtenerDetalleTicket } from '../../api/SoporteUsuario';

const SoporteUsuario = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    correo: '',
    asunto: '',
    descripcion: '',
  });
  const [error, setError] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await obtenerTickets();
      setTickets(data);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los tickets. Revisa tu sesión o la conexión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.correo || !form.asunto) {
      setError('Correo y asunto son obligatorios.');
      return;
    }

    try {
      const payload = {
        correo: form.correo,
        asunto: form.asunto,
        descripcion: form.descripcion,
      };
      await crearTicket(payload);
      setForm({ correo: '', asunto: '', descripcion: '' });
      await fetchTickets(); // refresca la lista
    } catch (err) {
      console.error(err);
      setError('Error al crear el ticket. Revisa los datos o tu sesión.');
    }
  };

  const openDetail = async (id) => {
    setError(null);
    try {
      const detail = await obtenerDetalleTicket(id);
      setSelectedTicket(detail);
      setShowDetail(true);
    } catch (err) {
      console.error(err);
      setError('No se pudo obtener el detalle del ticket.');
    }
  };

  const closeDetail = () => {
    setSelectedTicket(null);
    setShowDetail(false);
  };

  return (
    <div className={styles.container}>
      <h1>Soporte / Crear Ticket</h1>

      <section className={styles.formSection}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label>
            Correo
            <input
              name="correo"
              type="email"
              value={form.correo}
              onChange={handleChange}
              placeholder="tu@correo.com"
              required
            />
          </label>

          <label>
            Asunto
            <input
              name="asunto"
              type="text"
              value={form.asunto}
              onChange={handleChange}
              placeholder="Asunto del ticket"
              required
            />
          </label>

          <label>
            Descripción
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              placeholder="Describe el problema..."
            />
          </label>

          <button type="submit">Crear Ticket</button>
        </form>

        {error && <div className={styles.error}>{error}</div>}
      </section>

      <hr />

      <section className={styles.tableSection}>
        <h2>Mis Tickets</h2>
        {loading ? (
          <div>Cargando tickets...</div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Asunto</th>
                  <th>Correo</th>
                  <th>Estado</th>
                  <th>Fecha creación</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 && (
                  <tr><td colSpan="5">No hay tickets aún.</td></tr>
                )}
                {tickets.map(ticket => (
                  <tr key={ticket.id_ticket} onClick={() => openDetail(ticket.id_ticket)} style={{ cursor: 'pointer' }}>
                    <td>{ticket.id_ticket}</td>
                    <td>{ticket.asunto}</td>
                    <td>{ticket.correo}</td>
                    <td>{ticket.estado}</td>
                    <td>{ticket.fecha_creacion ? new Date(ticket.fecha_creacion).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showDetail && selectedTicket && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <button className={styles.modalClose} onClick={closeDetail}>Cerrar ✕</button>
            <h3>Detalle Ticket #{selectedTicket.id_ticket}</h3>
            <p><strong>Asunto:</strong> {selectedTicket.asunto}</p>
            <p><strong>Correo:</strong> {selectedTicket.correo}</p>
            <p><strong>Descripción:</strong> {selectedTicket.descripcion || '-'}</p>
            <p><strong>Comentario:</strong> {selectedTicket.comentario || '-'}</p>
            <p><strong>Estado:</strong> {selectedTicket.estado}</p>
            <p><strong>Fecha creación:</strong> {selectedTicket.fecha_creacion ? new Date(selectedTicket.fecha_creacion).toLocaleString() : '-'}</p>
            <p><strong>Fecha cierre:</strong> {selectedTicket.fecha_cierre ? new Date(selectedTicket.fecha_cierre).toLocaleString() : '-'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoporteUsuario;
