// ChatDashboardChurnKpi.js (robusto - normaliza base url y headers)
const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const API_BASE = RAW_API_BASE.replace(/\/+$/, ""); // quita "/" final

function getAuthHeader() {
  const token = localStorage.getItem('token') || localStorage.getItem('access') || '';
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function buildUrl(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  // asegurar que no queden "//" salvo en scheme
  const baseAndPath = `${API_BASE}/${path}`.replace(/\/{2,}/g, '/');
  const fixed = baseAndPath.replace('http:/', 'http://').replace('https:/', 'https://');
  return `${fixed}${qs ? `?${qs}` : ''}`;
}

export async function enviarMensajeChatDashboardChurn(message, params = {}) {
  const url = buildUrl('/dashboard/churn/chat/', params);
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader()
  };
  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message })
  });

  if (!resp.ok) {
    const err = await resp.json().catch(()=>({detail:'error desconocido'}));
    throw new Error(err.detail || err.error || `Error al enviar mensaje al chat (${resp.status})`);
  }
  return resp.json();
}
