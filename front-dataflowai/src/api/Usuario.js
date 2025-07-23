const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const obtenerInfoUsuario = async () => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}usuario/info/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('No se pudo obtener la información del usuario');
  }

  return await response.json();
};
