const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; 


// Funcion para obtener los datos del dashboard de ventas: http://127.0.0.1:8000/api/dashboard-ventas/
export async function fetchDashboardVentas(startDate, endDate) {
 
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token en localStorage');
  }

  const params = new URLSearchParams();
  if (startDate) params.append('start', startDate);
  if (endDate)   params.append('end', endDate);

  const res = await fetch(`${API_BASE_URL}dashboard-ventas/?${params}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
  
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error ${res.status}`);
  }

  return res.json();
}
