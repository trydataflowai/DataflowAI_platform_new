// src/api/Login.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/';

// Variables para control de inactividad
let inactivityTimer;
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos de inactividad

// Variable para controlar si estamos refrescando el token
let isRefreshing = false;
let refreshSubscribers = [];

// Función para reiniciar el timer de inactividad
export const reiniciarTimerInactividad = () => {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }
  
  inactivityTimer = setTimeout(() => {
    // Verificar si el token sigue siendo válido
    if (!tokenEstaExpirado()) {
      // Si el token es válido pero el usuario estuvo inactivo, cerrar sesión
      console.log('Sesión cerrada por inactividad');
      cerrarSesion();
    }
  }, INACTIVITY_TIMEOUT);
};

// Función para suscribirse al refresh del token
function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

// Función para ejecutar todos los callbacks cuando el token se refresca
function onRefreshed(token) {
  refreshSubscribers.map(callback => callback(token));
  refreshSubscribers = [];
}

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

    // Guardamos tokens y datos de usuario (compatible con código existente)
    if (data.token) {
      localStorage.setItem('token', data.token); // Para compatibilidad
      localStorage.setItem('access_token', data.token); // Nuevo nombre
    }
    
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }
    
    // Guardamos la hora de expiración
    const expiresAt = Date.now() + (data.expires_in * 1000);
    localStorage.setItem('token_expires_at', expiresAt.toString());
    
    if (data.usuario) localStorage.setItem('usuario', JSON.stringify(data.usuario));
    if (data.registro_sesion) localStorage.setItem('registro_sesion', JSON.stringify(data.registro_sesion));

    // Iniciar el timer de inactividad después del login
    reiniciarTimerInactividad();

    return data;
  } catch (error) {
    throw new Error(error?.message || 'Error de red');
  }
};

// Función para refrescar el token
export const refrescarToken = async () => {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      subscribeTokenRefresh((token) => {
        if (token) {
          resolve(token);
        } else {
          reject(new Error('Error refrescando token'));
        }
      });
    });
  }

  isRefreshing = true;
  
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      throw new Error('No hay refresh token disponible');
    }

    const response = await fetch(`${API_BASE_URL}refresh-token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      cerrarSesion();
      throw new Error(data.error || 'Error refrescando token');
    }

    // Actualizamos el token (compatible con ambas nomenclaturas)
    const newToken = data.token || data.access_token;
    localStorage.setItem('token', newToken);
    localStorage.setItem('access_token', newToken);
    
    const expiresAt = Date.now() + (data.expires_in * 1000);
    localStorage.setItem('token_expires_at', expiresAt.toString());

    // Reiniciar timer de inactividad después de refrescar
    reiniciarTimerInactividad();

    onRefreshed(newToken);
    
    return newToken;
  } catch (error) {
    onRefreshed(null);
    throw error;
  } finally {
    isRefreshing = false;
  }
};

// Función para verificar si el token está expirado
export const tokenEstaExpirado = () => {
  const expiresAt = localStorage.getItem('token_expires_at');
  if (!expiresAt) return true;

  const now = Date.now();
  const timeUntilExpiry = parseInt(expiresAt) - now;
  
  // Consideramos expirado si falta menos de 1 minuto
  return timeUntilExpiry < 60000;
};

// Función para obtener el token actual (compatible)
export const obtenerToken = () => {
  return localStorage.getItem('token') || localStorage.getItem('access_token');
};

// Función para obtener token, refrescando si es necesario
export const obtenerTokenActualizado = async () => {
  const token = obtenerToken();
  
  if (!token) {
    throw new Error('No hay token disponible');
  }

  if (tokenEstaExpirado()) {
    try {
      const newToken = await refrescarToken();
      return newToken;
    } catch (error) {
      cerrarSesion();
      throw error;
    }
  }

  return token;
};

// Interceptor para peticiones HTTP
export const apiConAuth = async (url, options = {}) => {
  try {
    const token = await obtenerTokenActualizado();
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      },
    };

    const response = await fetch(`${API_BASE_URL}${url}`, config);
    
    // Si el token expiró durante la petición, intentamos refrescar y reenviar
    if (response.status === 401) {
      try {
        const newToken = await refrescarToken();
        
        config.headers.Authorization = `Bearer ${newToken}`;
        return await fetch(`${API_BASE_URL}${url}`, config);
      } catch (refreshError) {
        cerrarSesion();
        throw new Error('Sesión expirada');
      }
    }

    return response;
  } catch (error) {
    throw error;
  }
};

// Función para hacer peticiones GET
export const apiGet = async (url) => {
  return await apiConAuth(url);
};

// Función para hacer peticiones POST
export const apiPost = async (url, data) => {
  return await apiConAuth(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Función para hacer peticiones PUT
export const apiPut = async (url, data) => {
  return await apiConAuth(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// Función para hacer peticiones DELETE
export const apiDelete = async (url) => {
  return await apiConAuth(url, {
    method: 'DELETE',
  });
};

export const cerrarSesion = () => {
  // Limpiar timer de inactividad
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }
  
  // Remover event listeners
  if (typeof window !== 'undefined') {
    window.removeEventListener('mousemove', reiniciarTimerInactividad);
    window.removeEventListener('keypress', reiniciarTimerInactividad);
    window.removeEventListener('click', reiniciarTimerInactividad);
    window.removeEventListener('scroll', reiniciarTimerInactividad);
  }

  localStorage.removeItem('token');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('token_expires_at');
  localStorage.removeItem('usuario');
  localStorage.removeItem('registro_sesion');
  
  // Redirigir al login
  window.location.href = '/login';
};

// Función para inicializar el detector de inactividad
export const inicializarDetectorInactividad = () => {
  if (typeof window !== 'undefined') {
    // Agregar event listeners para detectar actividad
    window.addEventListener('mousemove', reiniciarTimerInactividad);
    window.addEventListener('keypress', reiniciarTimerInactividad);
    window.addEventListener('click', reiniciarTimerInactividad);
    window.addEventListener('scroll', reiniciarTimerInactividad);
    
    // Iniciar el timer por primera vez
    reiniciarTimerInactividad();
  }
};

// Función para limpiar el detector de inactividad (útil al hacer logout)
export const limpiarDetectorInactividad = () => {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }
  
  if (typeof window !== 'undefined') {
    window.removeEventListener('mousemove', reiniciarTimerInactividad);
    window.removeEventListener('keypress', reiniciarTimerInactividad);
    window.removeEventListener('click', reiniciarTimerInactividad);
    window.removeEventListener('scroll', reiniciarTimerInactividad);
  }
};