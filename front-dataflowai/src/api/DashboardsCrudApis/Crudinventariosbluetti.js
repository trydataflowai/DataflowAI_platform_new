const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export async function getInventariosBluetti() {
  const response = await fetch(`${BASE_URL}inventarios-bluetti/`);
  if (!response.ok) throw new Error("Error fetching inventarios bluetti");
  return response.json();
}

export async function createInventarioBluetti(data) {
  const response = await fetch(`${BASE_URL}inventarios-bluetti/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error creating inventario bluetti");
  return response.json();
}

export async function updateInventarioBluetti(id, data) {
  const response = await fetch(`${BASE_URL}inventarios-bluetti/${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error updating inventario bluetti");
  return response.json();
}

export async function deleteInventarioBluetti(id) {
  const response = await fetch(`${BASE_URL}inventarios-bluetti/${id}/`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Error deleting inventario bluetti");
  return response;
}

/* MASIVOS */
export async function bulkImportInventariosBluetti(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}inventarios-bluetti/bulk-import/`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "error desconocido" }));
    const detalles = Array.isArray(err.detalles) ? ` | ${err.detalles.slice(0, 3).join(" | ")}` : "";
    throw new Error((err.error || err.detail || "Error en bulk import inventarios bluetti") + detalles);
  }
  return res.json();
}

export async function bulkUpdateInventariosBluettiExcel(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}inventarios-bluetti/bulk-update-excel/`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json().catch(()=>({ error: 'error desconocido' }));
    throw new Error(err.error || "Error en bulk update Excel inventarios bluetti");
  }

  return res.json();
}

export async function bulkDeleteInventariosBluetti(ids) {
  const response = await fetch(`${BASE_URL}inventarios-bluetti/bulk-delete/`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) throw new Error("Error bulk delete inventarios bluetti");
  return response;
}

export async function exportInventariosBluetti() {
  const response = await fetch(`${BASE_URL}inventarios-bluetti/export/`);
  if (!response.ok) throw new Error("Error exporting inventarios bluetti");
  return response;
}

export async function exportTemplateInventariosBluetti() {
  const response = await fetch(`${BASE_URL}inventarios-bluetti/export-template/`);
  if (!response.ok) throw new Error("Error exporting template inventarios bluetti");
  return response;
}

export async function getCuentasClientesBluetti() {
  const response = await fetch(`${BASE_URL}cuentas-clientes-bluetti/`);
  if (!response.ok) throw new Error("Error fetching cuentas clientes bluetti");
  return response.json();
}

export async function getCanalesBluetti() {
  const response = await fetch(`${BASE_URL}canales-bluetti/`);
  if (!response.ok) throw new Error("Error fetching canales bluetti");
  return response.json();
}



