const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const obtenerVentasEspacioApi = async () => {
  const token = localStorage.getItem('token');

  const response = await fetch(
    `${API_BASE_URL}dashboard/forms/ventas-punto-venta/`,
    {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Error al obtener ventas: ${response.status} ${text}`);
  }

  return await response.json(); // ✅ SOLO datos crudos
};
