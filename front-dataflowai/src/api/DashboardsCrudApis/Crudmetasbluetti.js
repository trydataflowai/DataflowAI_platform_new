const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export async function getMetasComercialesBluetti() {
  const response = await fetch(`${BASE_URL}metas-comerciales-bluetti/`);
  if (!response.ok) throw new Error("Error fetching metas comerciales bluetti");
  return response.json();
}

export async function createMetaComercialBluetti(data) {
  const response = await fetch(`${BASE_URL}metas-comerciales-bluetti/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error creating meta comercial bluetti");
  return response.json();
}

export async function updateMetaComercialBluetti(id, data) {
  const response = await fetch(`${BASE_URL}metas-comerciales-bluetti/${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error updating meta comercial bluetti");
  return response.json();
}

export async function deleteMetaComercialBluetti(id) {
  const response = await fetch(`${BASE_URL}metas-comerciales-bluetti/${id}/`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Error deleting meta comercial bluetti");
  return response;
}

/* MASIVOS */
export async function bulkImportMetasComercialesBluetti(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}metas-comerciales-bluetti/bulk-import/`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "error desconocido" }));
    const detalles = Array.isArray(err.detalles) ? ` | ${err.detalles.slice(0, 3).join(" | ")}` : "";
    throw new Error((err.error || err.detail || "Error en bulk import metas comerciales bluetti") + detalles);
  }
  return res.json();
}

export async function bulkUpdateMetasComercialesBluettiExcel(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}metas-comerciales-bluetti/bulk-update-excel/`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json().catch(()=>({ error: 'error desconocido' }));
    throw new Error(err.error || "Error en bulk update Excel metas comerciales bluetti");
  }

  return res.json();
}

export async function bulkDeleteMetasComercialesBluetti(ids) {
  const response = await fetch(`${BASE_URL}metas-comerciales-bluetti/bulk-delete/`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) throw new Error("Error bulk delete metas comerciales bluetti");
  return response;
}

export async function exportMetasComercialesBluetti() {
  const response = await fetch(`${BASE_URL}metas-comerciales-bluetti/export/`);
  if (!response.ok) throw new Error("Error exporting metas comerciales bluetti");
  return response;
}

export async function exportTemplateMetasComercialesBluetti() {
  const response = await fetch(`${BASE_URL}metas-comerciales-bluetti/export-template/`);
  if (!response.ok) throw new Error("Error exporting template metas comerciales bluetti");
  return response;
}
