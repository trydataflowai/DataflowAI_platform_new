const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;



export const obtenerHerramientaUsuario = async () => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}usuario/productos/herramientas`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('No se pudieron obtener los productos');
  }

  return await response.json(); // Array de productos
};
