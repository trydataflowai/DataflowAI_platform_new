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

export async function getPdvBelkin() {
  const response = await fetch(`${BASE_URL}/pdv-belkin/`, {
    credentials: "include",
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Error fetching pdv");
  const body = await response.json().catch(() => []);
  return toList(body);
}

export async function createPdvBelkin(data) {
  const response = await fetch(`${BASE_URL}/pdv-belkin/`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error creating pdv");
  return response.json();
}

export async function updatePdvBelkin(id, data) {
  const response = await fetch(`${BASE_URL}/pdv-belkin/${id}/`, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error updating pdv");
  return response.json();
}

export async function deletePdvBelkin(id) {
  const response = await fetch(`${BASE_URL}/pdv-belkin/${id}/`, {
    method: "DELETE",
    credentials: "include",
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Error deleting pdv");
  return response;
}

export async function bulkImportPdvBelkin(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/pdv-belkin/bulk-import/`, {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!res.ok) throw new Error("Error en bulk import pdv");
  return res.json();
}

export async function bulkUpdatePdvBelkinExcel(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/pdv-belkin/bulk-update-excel/`, {
    method: "POST",
    body: formData,
    credentials: "include",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error en bulk update Excel pdv");
  }
  return res.json();
}

export async function bulkDeletePdvBelkin(ids) {
  const response = await fetch(`${BASE_URL}/pdv-belkin/bulk-delete/`, {
    method: "DELETE",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) throw new Error("Error bulk delete pdv");
  return response;
}

export async function exportPdvBelkin() {
  const response = await fetch(`${BASE_URL}/pdv-belkin/export/`, {
    credentials: "include",
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Error exporting pdv");
  return response;
}
