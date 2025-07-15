const API_BASE_URL = 'http://127.0.0.1:8000/api/';

export const importarArchivoDashboard = async (id_producto, archivo) => {
  const formData = new FormData();
  formData.append('archivo', archivo);

  const token = localStorage.getItem('token');

  const res = await fetch(`${API_BASE_URL}importar/${id_producto}/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Error al importar');
  }

  return data;
};
