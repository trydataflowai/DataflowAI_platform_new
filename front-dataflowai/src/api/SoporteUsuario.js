const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // ej: "http://localhost:8000/api/"

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
};

export const obtenerTickets = async () => {
  const res = await fetch(`${API_BASE_URL}tickets/`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Error al obtener tickets');
  return res.json();
};

export const crearTicket = async (payload) => {
  const res = await fetch(`${API_BASE_URL}tickets/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    let err;
    try { err = JSON.parse(text); } catch { err = text; }
    throw err;
  }
  return res.json();
};

export const obtenerDetalleTicket = async (id) => {
  const res = await fetch(`${API_BASE_URL}tickets/${id}/`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Error al obtener detalle del ticket');
  return res.json();
};
