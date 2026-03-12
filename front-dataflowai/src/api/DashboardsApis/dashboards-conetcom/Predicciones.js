const API_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const RESOURCE = 'prediccion/conetcom_churnrate/';

const getAuthToken = () => {
  const raw =
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('access') ||
    '';
  const token = String(raw).replace(/^Bearer\s*/i, '').trim();
  if (!token || token === 'undefined' || token === 'null') return '';
  return token;
};

const defaultOptions = () => {
  const token = getAuthToken();
  return {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
};

const buildQuery = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.append(k, v);
  });
  return qs.toString();
};

export const obtenerPrediccionChurnRate = async (params = {}) => {
  if (!getAuthToken()) {
    throw new Error('No hay sesion activa. Inicia sesion nuevamente.');
  }
  const query = buildQuery(params);
  const res = await fetch(`${API_URL}/${RESOURCE}${query ? `?${query}` : ''}`, {
    ...defaultOptions(),
    method: 'GET',
  });
  if (res.status === 401) throw new Error('Sesion invalida o expirada. Vuelve a iniciar sesion.');
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body?.error || 'Error al obtener prediccion de churn rate';
    throw new Error(msg);
  }
  return body;
};
