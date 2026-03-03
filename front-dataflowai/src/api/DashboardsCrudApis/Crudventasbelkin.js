const BASE_URL = "http://localhost:8000/api";

function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem("token") || "";
  return token
    ? { ...extra, Authorization: `Bearer ${token.replace(/^Bearer\s*/i, "")}` }
    : extra;
}

function toList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

export async function getVentasBelkin() {
  const response = await fetch(`${BASE_URL}/ventas-belkin/`, {
    credentials: "include",
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Error fetching ventas belkin");
  const body = await response.json().catch(() => []);
  return toList(body);
}

export async function createVentasBelkin(data) {
  const response = await fetch(`${BASE_URL}/ventas-belkin/`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error creating ventas belkin");
  return response.json();
}

export async function updateVentasBelkin(id, data) {
  const response = await fetch(`${BASE_URL}/ventas-belkin/${id}/`, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error updating ventas belkin");
  return response.json();
}

export async function deleteVentasBelkin(id) {
  const response = await fetch(`${BASE_URL}/ventas-belkin/${id}/`, {
    method: "DELETE",
    credentials: "include",
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Error deleting ventas belkin");
  return response;
}

export async function bulkImportVentasBelkin(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/ventas-belkin/bulk-import/`, {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!res.ok) throw new Error("Error en bulk import ventas belkin");
  return res.json();
}

export async function bulkUpdateVentasBelkinExcel(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/ventas-belkin/bulk-update-excel/`, {
    method: "POST",
    body: formData,
    credentials: "include",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error en bulk update Excel ventas belkin");
  }
  return res.json();
}

export async function bulkDeleteVentasBelkin(ids) {
  const response = await fetch(`${BASE_URL}/ventas-belkin/bulk-delete/`, {
    method: "DELETE",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) throw new Error("Error bulk delete ventas belkin");
  return response;
}

export async function exportVentasBelkin() {
  const response = await fetch(`${BASE_URL}/ventas-belkin/export/`, {
    credentials: "include",
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Error exporting ventas belkin");
  return response;
}
