const API_BASE_URL = 'http://127.0.0.1:8000/api/';

export const obtenerTodosLosDashboards = async () => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}productos/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('No se pudieron obtener los productos');
  }

  return await response.json();
};


export const adquirirDashboard = async (id_producto) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}productos/adquirir/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ id_producto })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Error al adquirir dashboard');
  }
  return await response.json();
};