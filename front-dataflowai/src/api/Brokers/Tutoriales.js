// src/api/Brokers/Tutoriales.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function baseUrlNoSlash() {
  return API_BASE_URL.replace(/\/+$/, '');
}

/**
 * Obtiene la lista de tutoriales.
 * Lanza un error si la respuesta no es ok.
 */
export async function fetchTutoriales() {
  const token = localStorage.getItem('token');
  const url = `${baseUrlNoSlash()}/tutoriales/`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    },
  });

  if (!response.ok) {
    // intento parsear JSON con detalle de error, si no es JSON devuelvo texto
    let payload;
    try {
      payload = await response.json();
    } catch (err) {
      payload = { error: await response.text() };
    }
    const err = new Error(payload.error || 'Error al obtener tutoriales');
    err.status = response.status;
    err.payload = payload;
    throw err;
  }

  return await response.json();
}