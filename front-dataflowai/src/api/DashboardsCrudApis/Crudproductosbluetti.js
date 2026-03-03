const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export async function getProductosBluetti() {
  const response = await fetch(`${BASE_URL}productos-bluetti/`);
  if (!response.ok) throw new Error("Error fetching productos bluetti");
  return response.json();
}

export async function createProductoBluetti(data) {
  const response = await fetch(`${BASE_URL}productos-bluetti/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error creating producto bluetti");
  return response.json();
}

export async function updateProductoBluetti(id, data) {
  const response = await fetch(`${BASE_URL}productos-bluetti/${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error updating producto bluetti");
  return response.json();
}

export async function deleteProductoBluetti(id) {
  const response = await fetch(`${BASE_URL}productos-bluetti/${id}/`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Error deleting producto bluetti");
  return response;
}

/* MASIVOS */
export async function bulkImportProductosBluetti(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}productos-bluetti/bulk-import/`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "error desconocido" }));
    const detalles = Array.isArray(err.detalles) ? ` | ${err.detalles.slice(0, 3).join(" | ")}` : "";
    throw new Error((err.error || err.detail || "Error en bulk import productos bluetti") + detalles);
  }
  return res.json();
}

export async function bulkUpdateProductosBluettiExcel(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}productos-bluetti/bulk-update-excel/`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json().catch(()=>({ error: 'error desconocido' }));
    throw new Error(err.error || "Error en bulk update Excel productos bluetti");
  }

  return res.json();
}

export async function bulkDeleteProductosBluetti(ids) {
  const response = await fetch(`${BASE_URL}productos-bluetti/bulk-delete/`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) throw new Error("Error bulk delete productos bluetti");
  return response;
}

export async function exportProductosBluetti() {
  const response = await fetch(`${BASE_URL}productos-bluetti/export/`);
  if (!response.ok) throw new Error("Error exporting productos bluetti");
  return response;
}

export async function exportTemplateProductosBluetti() {
  const response = await fetch(`${BASE_URL}productos-bluetti/export-template/`);
  if (!response.ok) throw new Error("Error exporting template productos bluetti");
  return response;
}
