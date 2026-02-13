// C:\...\front-dataflowai\src\api\Brokers\LiqPagosBrokers.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Asegúrate que tenga la / final o úsala al concatenar

export const obtenerLiqPagosBroker = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Usuario no autenticado');
  }

  const res = await fetch(`${API_BASE_URL}usuario/broker/liquidacion/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (res.status === 401) {
    throw new Error('No autorizado — token inválido o expirado');
  }

  if (!res.ok) {
    const txt = await res.text();
    throw new Error('Error al obtener liquidación: ' + txt);
  }

  return await res.json();
};
