const BASE_URL = "http://localhost:8000/api";

export async function getInventariosSelloutBluetti() {
  const response = await fetch(`${BASE_URL}/inventarios-sellout-bluetti/`);
  if (!response.ok) throw new Error("Error fetching inventarios sellout bluetti");
  return response.json();
}

export async function createInventarioSelloutBluetti(data) {
  const response = await fetch(`${BASE_URL}/inventarios-sellout-bluetti/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = body?.detail || body?.error || JSON.stringify(body) || "Error creating inventario sellout bluetti";
    throw new Error(msg);
  }
  return body;
}

export async function updateInventarioSelloutBluetti(id, data) {
  const response = await fetch(`${BASE_URL}/inventarios-sellout-bluetti/${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error updating inventario sellout bluetti");
  return response.json();
}

export async function deleteInventarioSelloutBluetti(id) {
  const response = await fetch(`${BASE_URL}/inventarios-sellout-bluetti/${id}/`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Error deleting inventario sellout bluetti");
  return response;
}

export async function bulkImportInventariosSelloutBluetti(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/inventarios-sellout-bluetti/bulk-import/`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "error desconocido" }));
    const detalles = Array.isArray(err.detalles) ? ` | ${err.detalles.slice(0, 3).join(" | ")}` : "";
    throw new Error((err.error || err.detail || "Error en bulk import inventarios sellout bluetti") + detalles);
  }
  return res.json();
}

export async function bulkUpdateInventariosSelloutBluettiExcel(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/inventarios-sellout-bluetti/bulk-update-excel/`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "error desconocido" }));
    throw new Error(err.error || "Error en bulk update Excel inventarios sellout bluetti");
  }

  return res.json();
}

export async function bulkDeleteInventariosSelloutBluetti(ids) {
  const response = await fetch(`${BASE_URL}/inventarios-sellout-bluetti/bulk-delete/`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) throw new Error("Error bulk delete inventarios sellout bluetti");
  return response;
}

export async function exportInventariosSelloutBluetti() {
  const response = await fetch(`${BASE_URL}/inventarios-sellout-bluetti/export/`);
  if (!response.ok) throw new Error("Error exporting inventarios sellout bluetti");
  return response;
}

export async function exportTemplateInventariosSelloutBluetti() {
  const response = await fetch(`${BASE_URL}/inventarios-sellout-bluetti/export-template/`);
  if (!response.ok) throw new Error("Error exporting template inventarios sellout bluetti");
  return response;
}

export async function getCuentasClientesBluetti() {
  const response = await fetch(`${BASE_URL}/cuentas-clientes-bluetti/`);
  if (!response.ok) throw new Error("Error fetching cuentas clientes bluetti");
  return response.json();
}

export async function getCanalesBluetti() {
  const response = await fetch(`${BASE_URL}/canales-bluetti/`);
  if (!response.ok) throw new Error("Error fetching canales bluetti");
  return response.json();
}
