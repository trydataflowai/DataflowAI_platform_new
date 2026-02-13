const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/';

function _authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * exportLeads
 * @param {string} format 'csv' or 'xlsx'
 * @param {string} q      optional search query
 * @returns Promise that resolves when download started
 */
export async function exportLeads(format = 'csv', q = '') {
  const params = new URLSearchParams();
  params.set('file', format);
  if (q) params.set('q', q);

  const url = `${API_BASE_URL}brokers/leads/export/?${params.toString()}`;

  const headers = {
    ..._authHeader(),
    Accept: 'text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, */*',
  };

  const res = await fetch(url, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    // intenta extraer json o texto para dar feedback claro
    let message = `${res.status} ${res.statusText}`;
    try {
      const txt = await res.text();
      if (txt) message = txt;
    } catch (e) { /* ignore */ }
    throw new Error(`Error exportando leads: ${message}`);
  }

  const blob = await res.blob();
  const ext = format === 'xlsx' ? 'xlsx' : 'csv';
  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, '-');
  const filename = `leads_brokers_export_${ts}.${ext}`;

  const link = document.createElement('a');
  const urlBlob = window.URL.createObjectURL(blob);
  link.href = urlBlob;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(urlBlob);
}
