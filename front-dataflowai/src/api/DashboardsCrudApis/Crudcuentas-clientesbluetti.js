const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export async function getCuentasClientesBluetti() {
  const response = await fetch(`${BASE_URL}cuentas-clientes-bluetti/`);
  if (!response.ok) throw new Error("Error fetching cuentas clientes bluetti");
  return response.json();
}

export async function createCuentaClienteBluetti(data) {
  const response = await fetch(`${BASE_URL}cuentas-clientes-bluetti/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error creating cuenta cliente bluetti");
  return response.json();
}

export async function updateCuentaClienteBluetti(id, data) {
  const response = await fetch(`${BASE_URL}cuentas-clientes-bluetti/${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error updating cuenta cliente bluetti");
  return response.json();
}

export async function deleteCuentaClienteBluetti(id) {
  const response = await fetch(`${BASE_URL}cuentas-clientes-bluetti/${id}/`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Error deleting cuenta cliente bluetti");
  return response;
}

/* MASIVOS */
export async function bulkImportCuentasClientesBluetti(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}cuentas-clientes-bluetti/bulk-import/`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "error desconocido" }));
    const detalles = Array.isArray(err.detalles) ? ` | ${err.detalles.slice(0, 3).join(" | ")}` : "";
    throw new Error((err.error || err.detail || "Error en bulk import cuentas clientes bluetti") + detalles);
  }
  return res.json();
}

export async function bulkUpdateCuentasClientesBluettiExcel(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}cuentas-clientes-bluetti/bulk-update-excel/`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json().catch(()=>({ error: 'error desconocido' }));
    throw new Error(err.error || "Error en bulk update Excel cuentas clientes bluetti");
  }

  return res.json();
}

export async function bulkDeleteCuentasClientesBluetti(ids) {
  const response = await fetch(`${BASE_URL}cuentas-clientes-bluetti/bulk-delete/`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) throw new Error("Error bulk delete cuentas clientes bluetti");
  return response;
}

export async function exportCuentasClientesBluetti() {
  const response = await fetch(`${BASE_URL}cuentas-clientes-bluetti/export/`);
  if (!response.ok) throw new Error("Error exporting cuentas clientes bluetti");
  return response;
}

export async function exportTemplateCuentasClientesBluetti() {
  const response = await fetch(`${BASE_URL}cuentas-clientes-bluetti/export-template/`);
  if (!response.ok) throw new Error("Error exporting template cuentas clientes bluetti");
  return response;
}

// obtiene lista de canales (para mostrar nombre en el frontend)
export async function getCanalesBluetti() {
  const response = await fetch(`${BASE_URL}canales-bluetti/`);
  if (!response.ok) throw new Error("Error fetching canales bluetti");
  return response.json(); // espera [{ id_registro, id, codigo_canal, nombre_canal }, ...]
}
