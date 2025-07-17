const API_BASE_URL = 'http://127.0.0.1:8000/api/';


export const obtenerProductosUsuario = async () => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}usuario/productos/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('No se pudieron obtener los productos');
  }

  return await response.json(); // Array de productos
};
