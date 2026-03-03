const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

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

export async function getProductosBelkin() {
  const response = await fetch(`${BASE_URL}productos-belkin/`, {
    credentials: "include",
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Error fetching productos");
  const body = await response.json().catch(() => []);
  return toList(body);
}

export async function createProductoBelkin(data) {
  const response = await fetch(`${BASE_URL}productos-belkin/`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error creating producto");
  return response.json();
}

export async function updateProductoBelkin(id, data) {
  const response = await fetch(`${BASE_URL}productos-belkin/${id}/`, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error updating producto");
  return response.json();
}

export async function deleteProductoBelkin(id) {
  const response = await fetch(`${BASE_URL}productos-belkin/${id}/`, {
    method: "DELETE",
    credentials: "include",
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Error deleting producto");
  return response;
}

export async function bulkImportProductosBelkin(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}productos-belkin/bulk-import/`, {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders(),
    body: formData,
  });
  if (!res.ok) throw new Error("Error en bulk import");
  return res.json();
}

export async function bulkUpdateProductosBelkinExcel(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}productos-belkin/bulk-update-excel/`, {
    method: "POST",
    body: formData,
    credentials: "include",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error en bulk update Excel");
  }
  return res.json();
}

export async function bulkDeleteProductosBelkin(ids) {
  const response = await fetch(`${BASE_URL}productos-belkin/bulk-delete/`, {
    method: "DELETE",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) throw new Error("Error bulk delete");
  return response;
}

export async function exportProductosBelkin() {
  const response = await fetch(`${BASE_URL}productos-belkin/export/`, {
    credentials: "include",
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Error exporting productos");
  return response;
}
