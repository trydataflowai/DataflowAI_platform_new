// src/api/Login.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/';

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
      // data.error viene desde el backend (por ejemplo "usuario inactivo")
      throw new Error(data.error || 'Error al iniciar sesión');
    }

    // Guardamos token y usuario y registro de sesión (si viene)
    if (data.token) localStorage.setItem('token', data.token);
    if (data.usuario) localStorage.setItem('usuario', JSON.stringify(data.usuario));
    if (data.registro_sesion) localStorage.setItem('registro_sesion', JSON.stringify(data.registro_sesion));

    return data; // contiene token, usuario y registro_sesion
  } catch (error) {
    // Normalizamos el mensaje de error
    throw new Error(error?.message || 'Error de red');
  }
};

export const cerrarSesion = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  localStorage.removeItem('registro_sesion');
};
