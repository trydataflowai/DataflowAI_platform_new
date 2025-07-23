const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


export async function fetchCategorias() {
  const res = await fetch(`${API_BASE_URL}categorias/`);
  return res.json();
}

export async function fetchPlanes() {
  const res = await fetch(`${API_BASE_URL}planes/`);
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
