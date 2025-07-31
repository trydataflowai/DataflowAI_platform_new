// src/components/dashboards/DashboardFinanzas.jsx
import React, { useEffect, useState } from 'react';
import { fetchDashboardFinanzas } from '../../api/DashboardsApis/DashboardFinanzas';
import { obtenerInfoUsuario } from '../../api/Usuario';

const DashboardFinanzas = () => {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [usandoDatosReferencia, setUsandoDatosReferencia] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const usuario = await obtenerInfoUsuario();
        const idEmpresaUsuario = usuario.empresa?.id;

        const finanzas = await fetchDashboardFinanzas();

        let datosFiltrados = finanzas.filter(
          item => item.id_empresa === idEmpresaUsuario
        );

        if (datosFiltrados.length === 0) {
          datosFiltrados = finanzas.filter(item => item.id_empresa === 56);
          setUsandoDatosReferencia(true);
        }

        // Acumuladores financieros
        const resumen = datosFiltrados.reduce(
          (acc, item) => ({
            ingresos: acc.ingresos + parseFloat(item.ingresos_totales || 0),
            egresos: acc.egresos + parseFloat(item.total_egresos || 0),
            utilidad: acc.utilidad + parseFloat(item.utilidad_neta || 0),
            flujo: acc.flujo + parseFloat(item.flujo_efectivo_total || 0),
          }),
          { ingresos: 0, egresos: 0, utilidad: 0, flujo: 0 }
        );

        setDatos(resumen);
      } catch (err) {
        setError(err.message);
      }
    };

    cargarDatos();
  }, []);

  if (error) return <p style={{ color: '#000' }}>Error: {error}</p>;
  if (!datos) return <p style={{ color: '#000' }}>Cargando datos...</p>;

  return (
    <div style={{ padding: '1rem' }}>
      <h1 style={{ color: '#000' }}>Dashboard Financiero</h1>

      {usandoDatosReferencia && (
        <div
          style={{
            backgroundColor: '#000',
            color: '#fff',
            border: '1px solid #444',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1rem',
          }}
        >
          ⚠️ Estás viendo datos de referencia porque tu empresa aún no tiene registros.
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <Card title="💼 Ingresos Totales" value={`$${datos.ingresos.toLocaleString('es-CO')}`} />
        <Card title="📉 Egresos Totales" value={`$${datos.egresos.toLocaleString('es-CO')}`} />
        <Card title="📊 Utilidad Neta" value={`$${datos.utilidad.toLocaleString('es-CO')}`} />
        <Card title="💵 Flujo Efectivo Total" value={`$${datos.flujo.toLocaleString('es-CO')}`} />
      </div>
    </div>
  );
};

const Card = ({ title, value }) => (
  <div
    style={{
      background: '#fff',
      padding: '1rem',
      borderRadius: '10px',
      width: '220px',
      textAlign: 'center',
      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    }}
  >
    <h3 style={{ color: '#000' }}>{title}</h3>
    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#000' }}>
      {value}
    </p>
  </div>
);

export default DashboardFinanzas;
