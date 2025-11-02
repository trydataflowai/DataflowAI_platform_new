// ChatBot.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/";

/**
 * Envía mensaje al backend y retorna { reply, raw }
 * El token JWT del usuario debe estar en localStorage bajo 'token'
 */
export const sendMessageToBackend = async (message, opts = {}) => {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No token disponible en localStorage');
  }

  const payload = {
    message,
    ...(opts.model ? { model: opts.model } : {}),
    ...(opts.temperature ? { temperature: opts.temperature } : {}),
    ...(opts.max_tokens ? { max_tokens: opts.max_tokens } : {}),
  };

  const response = await fetch(`${API_BASE_URL}chatbot/message/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    let detail;
    try { detail = JSON.parse(text); } catch { detail = text; }
    throw new Error(`Error desde backend: ${response.status} - ${JSON.stringify(detail)}`);
  }

  const data = await response.json();
  return data; // { reply: "...", raw: {...} }
};