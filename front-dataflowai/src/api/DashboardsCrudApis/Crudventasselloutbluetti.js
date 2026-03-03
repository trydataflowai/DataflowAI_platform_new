const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export async function getVentasSelloutBluetti() {
  const response = await fetch(`${BASE_URL}ventas-sellout-bluetti/`);
  if (!response.ok) throw new Error("Error fetching ventas sellout bluetti");
  return response.json();
}

export async function createVentaSelloutBluetti(data) {
  const response = await fetch(`${BASE_URL}ventas-sellout-bluetti/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = body?.detail || body?.error || JSON.stringify(body) || "Error creating venta sellout bluetti";
    throw new Error(msg);
  }
  return body;
}

export async function updateVentaSelloutBluetti(id, data) {
  const response = await fetch(`${BASE_URL}ventas-sellout-bluetti/${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error updating venta sellout bluetti");
  return response.json();
}

export async function deleteVentaSelloutBluetti(id) {
  const response = await fetch(`${BASE_URL}ventas-sellout-bluetti/${id}/`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Error deleting venta sellout bluetti");
  return response;
}

export async function bulkImportVentasSelloutBluetti(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}ventas-sellout-bluetti/bulk-import/`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "error desconocido" }));
    const detalles = Array.isArray(err.detalles) ? ` | ${err.detalles.slice(0, 3).join(" | ")}` : "";
    throw new Error((err.error || err.detail || "Error en bulk import ventas sellout bluetti") + detalles);
  }
  return res.json();
}

export async function bulkUpdateVentasSelloutBluettiExcel(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}ventas-sellout-bluetti/bulk-update-excel/`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "error desconocido" }));
    throw new Error(err.error || "Error en bulk update Excel ventas sellout bluetti");
  }

  return res.json();
}

export async function bulkDeleteVentasSelloutBluetti(ids) {
  const response = await fetch(`${BASE_URL}ventas-sellout-bluetti/bulk-delete/`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) throw new Error("Error bulk delete ventas sellout bluetti");
  return response;
}

export async function exportVentasSelloutBluetti() {
  const response = await fetch(`${BASE_URL}ventas-sellout-bluetti/export/`);
  if (!response.ok) throw new Error("Error exporting ventas sellout bluetti");
  return response;
}

export async function exportTemplateVentasSelloutBluetti() {
  const response = await fetch(`${BASE_URL}ventas-sellout-bluetti/export-template/`);
  if (!response.ok) throw new Error("Error exporting template ventas sellout bluetti");
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
