const API_BASE_URL = 'http://127.0.0.1:8000/api/';

export async function fetchCategorias() {
  const res = await fetch(`${API_BASE_URL}categorias/`);
  return res.json();
}

export async function fetchEstados() {
  const res = await fetch(`${API_BASE_URL}estados/`);
  return res.json();
}

export async function fetchPlanes() {
  const res = await fetch(`${API_BASE_URL}planes/`);
  return res.json();
}

export async function fetchPermisos() {
  const res = await fetch(`${API_BASE_URL}permisos/`);
  return res.json();
}

export async function crearEmpresa(data) {
  const res = await fetch(`${API_BASE_URL}empresas/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw err;
  }
  return res.json();
}

export async function crearUsuario(data) {
  const res = await fetch(`${API_BASE_URL}usuarios/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw err;
  }
  return res.json();
}
