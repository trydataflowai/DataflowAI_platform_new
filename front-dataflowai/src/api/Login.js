// src/api/Login.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
      // data.error viene desde el backend (p. ej. "usuario inactivo")
      throw new Error(data.error || 'Error al iniciar sesión');
    }

    // Guardamos token y usuario (opcional)
    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));

    return data; // contiene token + usuario
  } catch (error) {
    throw new Error(error.message || 'Error de red');
  }
};

export const cerrarSesion = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
};
