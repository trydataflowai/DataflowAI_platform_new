// src/components/dashboards/DashboardVentas.jsx
import React, { useEffect, useState } from 'react';
import { fetchDashboardVentas } from '../../api/DashboardApi';
import { obtenerInfoUsuario } from '../../api/Usuario';

const DashboardVentas = () => {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [usandoDatosReferencia, setUsandoDatosReferencia] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // 1. Obtener usuario logeado
        const usuario = await obtenerInfoUsuario();
        const idEmpresaUsuario = usuario.empresa?.id;

        // 2. Obtener todos los datos del dashboard
        const ventas = await fetchDashboardVentas();

        // 3. Filtrar por empresa del usuario
        let datosFiltrados = ventas.filter(
          item => item.id_empresa === idEmpresaUsuario
        );

        // 4. Si no hay datos para su empresa, usar empresa 56
        if (datosFiltrados.length === 0) {
          datosFiltrados = ventas.filter(item => item.id_empresa === 56);
          setUsandoDatosReferencia(true);
        }

        // 5. Calcular totales
        const totalCantidad = datosFiltrados.reduce(
          (acc, item) => acc + (item.cantidad_vendida || 0),
          0
        );
        const totalDinero = datosFiltrados.reduce(
          (acc, item) => acc + (parseFloat(item.dinero_vendido) || 0),
          0
        );

        setDatos({
          cantidad_vendida: totalCantidad,
          dinero_vendido: totalDinero
        });
      } catch (err) {
        setError(err.message);
      }
    };

    cargarDatos();
  }, []);

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (!datos) {
    return <p>Cargando datos...</p>;
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Dashboard de Ventas</h1>

      {usandoDatosReferencia && (
        <div
          style={{
            backgroundColor: '#fff3cd',
            color: '#856404',
            border: '1px solid #ffeeba',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}
        >
          ⚠️ Estás viendo datos de referencia porque tu empresa aún no tiene registros.
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <div
          style={{
            background: '#f1f1f1',
            padding: '1rem',
            borderRadius: '10px',
            width: '200px',
            textAlign: 'center'
          }}
        >
          <h3>✅ Cantidad Vendida</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            {datos.cantidad_vendida}
          </p>
        </div>

        <div
          style={{
            background: '#e6f4ea',
            padding: '1rem',
            borderRadius: '10px',
            width: '200px',
            textAlign: 'center'
          }}
        >
          <h3>💰 Dinero Vendido</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            ${datos.dinero_vendido.toLocaleString('es-CO')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardVentas;
