import React, { useEffect, useState } from 'react';
import styles from '../../styles/CreacionUsuario.module.css';
import { obtenerVentasRaw } from '../../api/DashboardsApis/DashboardFormsVentasEspacioApi';

const DashboardFormsVentasEspacio = () => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ CARGAR DATA CRUDa
  useEffect(() => {
    const cargarVentas = async () => {
      try {
        const data = await obtenerVentasRaw();
        const rows = Array.isArray(data)
          ? data
          : data.results && Array.isArray(data.results)
          ? data.results
          : [];

        setVentas(rows);
      } catch (err) {
        setError(err.message || 'Error al cargar ventas');
      } finally {
        setLoading(false);
      }
    };

    cargarVentas();
  }, []);

  // ✅ CÁLCULOS DIRECTAMENTE EN EL JSX
  const totalCantidad = ventas.reduce((acc, item) => {
    const cantidad =
      item?.organized?.Ingresos?.['cantidad vendida'] ?? 0;
    return acc + Number(cantidad);
  }, 0);

  const totalDinero = ventas.reduce((acc, item) => {
    const dinero =
      item?.organized?.Ingresos?.['dinero vendido'] ?? 0;
    return acc + Number(dinero);
  }, 0);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // ✅ RENDER
  return (
    <div className={styles.container}>
      <h2>Dashboard Ventas Punto de Venta</h2>

      {loading ? (
        <p>Cargando ventas...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>Error: {error}</p>
      ) : (
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            marginTop: '1rem',
          }}
        >
          {/* ✅ TOTAL CANTIDAD */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '8px',
              boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
              minWidth: '220px',
            }}
          >
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
              Cantidad Vendida
            </div>
            <div style={{ fontSize: '1.7rem', fontWeight: '700' }}>
              {totalCantidad}
            </div>
          </div>

          {/* ✅ TOTAL DINERO */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '8px',
              boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
              minWidth: '240px',
            }}
          >
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
              Dinero Vendido
            </div>
            <div style={{ fontSize: '1.7rem', fontWeight: '700' }}>
              {formatCurrency(totalDinero)}
            </div>
          </div>

          {/* ✅ TOTAL REGISTROS */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '8px',
              boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
              minWidth: '200px',
            }}
          >
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
              Registros
            </div>
            <div style={{ fontSize: '1.7rem', fontWeight: '700' }}>
              {ventas.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardFormsVentasEspacio;
