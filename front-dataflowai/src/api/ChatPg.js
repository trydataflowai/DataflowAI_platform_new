// src/api/ChatPg.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function sendChatMessage(chatInput) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No se encontró token. Haz login primero.');

  const url = `${API_BASE_URL}n8n/webhook-proxy/`;
  const body = { chatInput, sessionId: 'dataflowai' };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    // manejar 504 separado para UX
    if (res.status === 504) {
      // leer detalle si hay
      let detail = 'Timeout: la operación tardó demasiado. Intente nuevamente más tarde.';
      try {
        const j = await res.json();
        if (j && j.detail) detail = j.detail;
      } catch (e) { /* ignore */ }
      throw new Error(detail);
    }

    let text;
    try {
      text = await res.text();
    } catch (e) {
      text = res.statusText;
    }
    throw new Error(`Error ${res.status}: ${text}`);
  }

  const data = await res.json();
  if (!('response_from_webhook' in data)) return data;
  return data.response_from_webhook;
}
