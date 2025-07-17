const API_BASE_URL = 'http://127.0.0.1:8000/api/';

export const iniciarSesion = async ({ correo, contrasena }) => {
  try {
    const response = await fetch(`${API_BASE_URL}login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ correo, contrasena }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al iniciar sesión');
    }

    // Puedes guardar el token si quieres:
    localStorage.setItem('token', data.token);

    return data; // contiene token + usuario
  } catch (error) {
    throw new Error(error.message || 'Error de red');
  }
};


export const cerrarSesion = () => {
  localStorage.removeItem('token');
};



