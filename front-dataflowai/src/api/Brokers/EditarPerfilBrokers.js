const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/';

async function _fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = options.headers || {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }
  const opts = { ...options, headers };
  const res = await fetch(url, opts);

  // Puedes incorporar manejo de 401/refresh aquí si lo implementas luego.
  return res;
}

export const obtenerPerfilBroker = async () => {
  const res = await _fetchWithAuth(`${API_BASE_URL}brokers/perfil/`, {
    method: 'GET',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error al obtener perfil: ${res.status} - ${text}`);
  }
  return await res.json();
};

export const actualizarPerfilBroker = async (payload) => {
  const res = await _fetchWithAuth(`${API_BASE_URL}brokers/perfil/`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail || JSON.stringify(body) || `Error al actualizar: ${res.status}`);
  }
  return await res.json();
};
