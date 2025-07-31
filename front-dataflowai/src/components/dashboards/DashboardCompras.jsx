// src/components/dashboards/DashboardCompras.jsx
import React, { useEffect, useState } from 'react';
import { fetchDashboardCompras } from '../../api/DashboardsApis/DashboardCompras';
import { obtenerInfoUsuario } from '../../api/Usuario';

const DashboardCompras = () => {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [usandoDatosReferencia, setUsandoDatosReferencia] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const usuario = await obtenerInfoUsuario();
        const idEmpresaUsuario = usuario.empresa?.id;

        const compras = await fetchDashboardCompras();

        let datosFiltrados = compras.filter(
          item => item.id_empresa === idEmpresaUsuario
        );

        if (datosFiltrados.length === 0) {
          datosFiltrados = compras.filter(item => item.id_empresa === 56);
          setUsandoDatosReferencia(true);
        }

        const resumen = datosFiltrados.reduce(
          (acc, item) => ({
            totalCompras: acc.totalCompras + parseFloat(item.valor_total || 0),
            totalCantidad: acc.totalCantidad + parseInt(item.cantidad_comprada || 0),
            promedioUnitario: acc.promedioUnitario + parseFloat(item.valor_unitario || 0),
            tiempoEntregaPromedio: acc.tiempoEntregaPromedio + parseInt(item.tiempo_entrega_dias || 0),
            contador: acc.contador + 1,
          }),
          { totalCompras: 0, totalCantidad: 0, promedioUnitario: 0, tiempoEntregaPromedio: 0, contador: 0 }
        );

        const datosResumen = {
          totalCompras: resumen.totalCompras,
          totalCantidad: resumen.totalCantidad,
          promedioUnitario: resumen.contador > 0 ? resumen.promedioUnitario / resumen.contador : 0,
          tiempoEntregaPromedio: resumen.contador > 0 ? resumen.tiempoEntregaPromedio / resumen.contador : 0,
        };

        setDatos(datosResumen);
      } catch (err) {
        setError(err.message);
      }
    };

    cargarDatos();
  }, []);

  if (error) return <p style={{ color: '#000' }}>Error: {error}</p>;
  if (!datos) return <p style={{ color: '#000' }}>Cargando datos...</p>;

  return (
    <div style={{ padding: '1rem', backgroundColor: '#fff', color: '#000' }}>
      <h1 style={{ color: '#fff', backgroundColor: '#000', padding: '0.5rem', borderRadius: '4px' }}>
        Dashboard de Compras
      </h1>

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
        <Card title="💰 Total Compras" value={`$${datos.totalCompras.toLocaleString('es-CO')}`} />
        <Card title="📦 Total Unidades Compradas" value={datos.totalCantidad.toLocaleString('es-CO')} />
        <Card title="💲 Promedio Valor Unitario" value={`$${datos.promedioUnitario.toFixed(2)}`} />
        <Card title="⏱️ Tiempo Prom. Entrega (días)" value={`${datos.tiempoEntregaPromedio.toFixed(1)} días`} />
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
    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#000' }}>{value}</p>
  </div>
);

export default DashboardCompras;
