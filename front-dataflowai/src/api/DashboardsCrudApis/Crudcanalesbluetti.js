const BASE_URL = "http://localhost:8000/api";

export async function getCanalesBluetti() {
  const response = await fetch(`${BASE_URL}/canales-bluetti/`);
  if (!response.ok) throw new Error("Error fetching canales bluetti");
  return response.json();
}

export async function createCanalBluetti(data) {
  const response = await fetch(`${BASE_URL}/canales-bluetti/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error creating canal bluetti");
  return response.json();
}

export async function updateCanalBluetti(id, data) {
  const response = await fetch(`${BASE_URL}/canales-bluetti/${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error updating canal bluetti");
  return response.json();
}

export async function deleteCanalBluetti(id) {
  const response = await fetch(`${BASE_URL}/canales-bluetti/${id}/`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Error deleting canal bluetti");
  return response;
}

/* MASIVOS */
export async function bulkImportCanalesBluetti(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/canales-bluetti/bulk-import/`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "error desconocido" }));
    const detalles = Array.isArray(err.detalles) ? ` | ${err.detalles.slice(0, 3).join(" | ")}` : "";
    throw new Error((err.error || err.detail || "Error en bulk import canales bluetti") + detalles);
  }
  return res.json();
}

export async function bulkUpdateCanalesBluettiExcel(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/canales-bluetti/bulk-update-excel/`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json().catch(()=>({ error: 'error desconocido' }));
    throw new Error(err.error || "Error en bulk update Excel canales bluetti");
  }

  return res.json();
}

export async function bulkDeleteCanalesBluetti(ids) {
  const response = await fetch(`${BASE_URL}/canales-bluetti/bulk-delete/`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) throw new Error("Error bulk delete canales bluetti");
  return response;
}

export async function exportCanalesBluetti() {
  const response = await fetch(`${BASE_URL}/canales-bluetti/export/`);
  if (!response.ok) throw new Error("Error exporting canales bluetti");
  return response;
}

export async function exportTemplateCanalesBluetti() {
  const response = await fetch(`${BASE_URL}/canales-bluetti/export-template/`);
  if (!response.ok) throw new Error("Error exporting template canales bluetti");
  return response;
}
