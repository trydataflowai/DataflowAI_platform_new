const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/';

const getAuthHeaders = (extra = {}) => {
  const token = localStorage.getItem('token');
  return { ...extra, Authorization: `Bearer ${token}` };
};

// ---- KPIs Dashboard ----
export async function getLoopserviciosTotekKpis() {
  const response = await fetch(`${BASE_URL}loopserviciostotek/kpis/`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Error fetching KPIs Loop Servicios Totek');
  return response.json();
}

// ---- CRUD Individual ----
export async function getLoopserviciosTotek() {
  const response = await fetch(`${BASE_URL}loopserviciostotek/`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Error fetching servicios Loop Totek');
  return response.json();
}

export async function createLoopservicioTotek(data) {
  const response = await fetch(`${BASE_URL}loopserviciostotek/`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Error creating servicio Loop Totek');
  return response.json();
}

export async function updateLoopservicioTotek(id, data) {
  const response = await fetch(`${BASE_URL}loopserviciostotek/${id}/`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Error updating servicio Loop Totek');
  return response.json();
}

export async function deleteLoopservicioTotek(id) {
  const response = await fetch(`${BASE_URL}loopserviciostotek/${id}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Error deleting servicio Loop Totek');
  return response;
}

// ---- Masivos ----
export async function bulkImportLoopserviciosTotek(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}loopserviciostotek/bulk-import/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'error desconocido' }));
    const detalles = Array.isArray(err.detalles) ? ` | ${err.detalles.slice(0, 3).join(' | ')}` : '';
    throw new Error((err.error || err.detail || 'Error en bulk import Loop Totek') + detalles);
  }
  return res.json();
}

export async function bulkUpdateLoopserviciosTotekExcel(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}loopserviciostotek/bulk-update-excel/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'error desconocido' }));
    throw new Error(err.error || 'Error en bulk update Excel Loop Totek');
  }
  return res.json();
}

export async function bulkDeleteLoopserviciosTotek(ids) {
  const response = await fetch(`${BASE_URL}loopserviciostotek/bulk-delete/`, {
    method: 'DELETE',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) throw new Error('Error bulk delete Loop Totek');
  return response;
}

export async function exportLoopserviciosTotek() {
  const response = await fetch(`${BASE_URL}loopserviciostotek/export/`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Error exportando servicios Loop Totek');
  return response;
}

export async function exportTemplateLoopserviciosTotek() {
  const response = await fetch(`${BASE_URL}loopserviciostotek/export-template/`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Error exportando plantilla Loop Totek');
  return response;
}
