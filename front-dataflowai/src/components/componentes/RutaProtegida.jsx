// src/components/componentes/RutaProtegida.jsx
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { tokenEstaExpirado, inicializarDetectorInactividad, limpiarDetectorInactividad } from '../../api/Login';

const RutaProtegida = ({ children }) => {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');

  useEffect(() => {
    // Inicializar detector de inactividad cuando el componente se monta
    if (token && !tokenEstaExpirado()) {
      inicializarDetectorInactividad();
    }

    // Cleanup al desmontar
    return () => {
      limpiarDetectorInactividad();
    };
  }, [token]);

  // Verificar si no hay token o si está expirado
  if (!token || tokenEstaExpirado()) {
    // Limpiar detector de inactividad antes de redirigir
    limpiarDetectorInactividad();
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default RutaProtegida;