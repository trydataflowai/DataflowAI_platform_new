// src/api/Importacion.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Función para importar archivo de dashboard
 * @param {number} id_producto - ID del producto/dashboard
 * @param {File} archivo - Archivo Excel a importar
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export const importarArchivoDashboard = async (id_producto, archivo) => {
  try {
    // Validar parámetros
    if (!id_producto || !archivo) {
      throw new Error('ID del producto y archivo son requeridos');
    }

    // Validar que sea un archivo Excel
    const extension = archivo.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(extension)) {
      throw new Error('El archivo debe ser de formato Excel (.xlsx o .xls)');
    }

    // Crear FormData
    const formData = new FormData();
    formData.append('archivo', archivo);

    // Obtener token de autenticación
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No se encontró token de autenticación');
    }

    // Realizar petición
    const response = await fetch(`${API_BASE_URL}importar/${id_producto}/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    // Procesar respuesta
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `Error HTTP: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Error en importarArchivoDashboard:', error);
    throw error;
  }
};

/**
 * Función para obtener el estado de importación (opcional, para futuras mejoras)
 * @param {number} id_producto - ID del producto
 * @returns {Promise<Object>} - Estado de la importación
 */
export const obtenerEstadoImportacion = async (id_producto) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No se encontró token de autenticación');
    }

    const response = await fetch(`${API_BASE_URL}estado-importacion/${id_producto}/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `Error HTTP: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Error en obtenerEstadoImportacion:', error);
    throw error;
  }
};

/**
 * Función para validar archivo antes de importar (opcional)
 * @param {File} archivo - Archivo a validar
 * @returns {Object} - Resultado de la validación
 */
export const validarArchivo = (archivo) => {
  const errors = [];
  const warnings = [];

  // Validar extensión
  const extension = archivo.name.split('.').pop().toLowerCase();
  if (!['xlsx', 'xls'].includes(extension)) {
    errors.push('El archivo debe ser de formato Excel (.xlsx o .xls)');
  }

  // Validar tamaño (máximo 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB en bytes
  if (archivo.size > maxSize) {
    errors.push('El archivo no debe superar los 10MB');
  }

  // Validar que no esté vacío
  if (archivo.size === 0) {
    errors.push('El archivo está vacío');
  }

  // Advertencia por archivos muy grandes
  const warningSize = 5 * 1024 * 1024; // 5MB
  if (archivo.size > warningSize && archivo.size <= maxSize) {
    warnings.push('El archivo es grande, la importación puede tardar varios minutos');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    fileInfo: {
      name: archivo.name,
      size: archivo.size,
      type: archivo.type,
      lastModified: new Date(archivo.lastModified)
    }
  };
};

/**
 * Función para formatear el tamaño del archivo
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} - Tamaño formateado
 */
export const formatearTamanoArchivo = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};