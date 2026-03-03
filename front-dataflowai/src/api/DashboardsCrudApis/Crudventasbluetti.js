const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export async function getVentasBluetti() {
  const response = await fetch(`${BASE_URL}ventas-bluetti/`);
  if (!response.ok) throw new Error("Error fetching ventas bluetti");
  return response.json();
}

export async function createVentaBluetti(data) {
  const response = await fetch(`${BASE_URL}ventas-bluetti/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const text = await response.text(); // leer cuerpo (puede ser json o texto)
  let body;
  try { body = JSON.parse(text); } catch (e) { body = text; }

  if (!response.ok) {
    // lanzar con el detalle si existe, si no el texto entero
    const msg = (body && (body.detail || body.error || JSON.stringify(body))) || response.statusText;
    throw new Error(msg);
  }
  return body;
}

export async function updateVentaBluetti(id, data) {
  const response = await fetch(`${BASE_URL}ventas-bluetti/${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error updating venta bluetti");
  return response.json();
}

export async function deleteVentaBluetti(id) {
  const response = await fetch(`${BASE_URL}ventas-bluetti/${id}/`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Error deleting venta bluetti");
  return response;
}

/* MASIVOS */
export async function bulkImportVentasBluetti(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}ventas-bluetti/bulk-import/`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "error desconocido" }));
    const detalles = Array.isArray(err.detalles) ? ` | ${err.detalles.slice(0, 3).join(" | ")}` : "";
    throw new Error((err.error || err.detail || "Error en bulk import ventas bluetti") + detalles);
  }
  return res.json();
}

export async function bulkUpdateVentasBluettiExcel(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}ventas-bluetti/bulk-update-excel/`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json().catch(()=>({ error: 'error desconocido' }));
    throw new Error(err.error || "Error en bulk update Excel ventas bluetti");
  }

  return res.json();
}

export async function bulkDeleteVentasBluetti(ids) {
  const response = await fetch(`${BASE_URL}ventas-bluetti/bulk-delete/`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) throw new Error("Error bulk delete ventas bluetti");
  return response;
}

export async function exportVentasBluetti() {
  const response = await fetch(`${BASE_URL}ventas-bluetti/export/`);
  if (!response.ok) throw new Error("Error exporting ventas bluetti");
  return response;
}

export async function exportTemplateVentasBluetti() {
  const response = await fetch(`${BASE_URL}ventas-bluetti/export-template/`);
  if (!response.ok) throw new Error("Error exporting template ventas bluetti");
  return response;
}

export async function getCuentasClientesBluetti() {
  const response = await fetch(`${BASE_URL}cuentas-clientes-bluetti/`);
  if (!response.ok) throw new Error("Error fetching cuentas clientes bluetti");
  return response.json(); // espera [{ id_registro, id, nombre_cliente, ... }, ...]
}

// obtiene lista de canales (para mostrar nombres y enviar id)
export async function getCanalesBluetti() {
  const response = await fetch(`${BASE_URL}canales-bluetti/`);
  if (!response.ok) throw new Error("Error fetching canales bluetti");
  return response.json(); // espera [{ id_registro, id, nombre_canal, ... }, ...]
}
