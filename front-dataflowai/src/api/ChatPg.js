// src/api/ChatPg.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // asegúrate de terminar con slash si tu backend lo necesita

async function fetchWithAuth(url, opts = {}) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No se encontró token. Haz login primero.');
  const headers = Object.assign({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, opts.headers || {});
  const res = await fetch(url, Object.assign({}, opts, { headers }));
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    const msg = `Error ${res.status}: ${text}`;
    const error = new Error(msg);
    error.status = res.status;
    throw error;
  }
  return res;
}

export async function sendChatMessage(id_registro, chatInput) {
  if (!id_registro) throw new Error('Debes seleccionar un dashboard (id_registro).');
  if (!chatInput || String(chatInput).trim() === "") throw new Error('chatInput vacío.');

  const url = `${API_BASE_URL}n8n/webhook-proxy/`;
  const body = { id_registro, chatInput };

  const res = await fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify(body)
  });

  const json = await res.json();
  // si el backend responde con { response_from_webhook: ... } devolvemos ese campo
  if ('response_from_webhook' in json) return json.response_from_webhook;
  return json;
}

export async function fetchDashboardContexts() {
  const url = `${API_BASE_URL}n8n/dashboard-contexts/`;
  const res = await fetchWithAuth(url, { method: 'GET' });
  const json = await res.json();
  return json; // lista de DashboardContext
}

export default { sendChatMessage, fetchDashboardContexts };
