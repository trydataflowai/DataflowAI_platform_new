import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../../styles/Dashboards/dashboard-ventas-e-inventarios/AnalisisInventarios.module.css';
import { obtenerConetcomClientes } from '../../../api/DashboardsApis/dashboards-conetcom/Dashboardconetcomclientes';
import { obtenerConetcomPlanes } from '../../../api/DashboardsApis/dashboards-conetcom/Dashboardconetcom_planes';
import { obtenerConetcomFacturacion } from '../../../api/DashboardsApis/dashboards-conetcom/Dashboardconetcom_facturacion';

const toList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const DashboardGeneralConectcom = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [loadingKpis, setLoadingKpis] = useState(false);
  const [kpiError, setKpiError] = useState('');

  const accesos = [
    { label: 'Conetcom Clientes', path: '/Crud/Dashboard/ConetcomClientes' },
    { label: 'Conetcom Campana', path: '/Crud/Dashboard/ConetcomCampana' },
    { label: 'Conetcom Facturacion', path: '/Crud/Dashboard/ConetcomFacturacion' },
    { label: 'Conetcom Interacciones Campanas', path: '/Crud/Dashboard/ConetcomInteraccionesCampanas' },
    { label: 'Conetcom Pagos', path: '/Crud/Dashboard/ConetcomPagos' },
    { label: 'Conetcom Planes', path: '/Crud/Dashboard/ConetcomPlanes' },
    { label: 'Conetcom Tickets Soporte', path: '/Crud/Dashboard/ConetcomTicketsSoporte' },
    { label: 'Conetcom Trafico Consumo', path: '/Crud/Dashboard/ConetcomTraficoConsumo' },
  ];

  useEffect(() => {
    const cargarKpis = async () => {
      try {
        setLoadingKpis(true);
        setKpiError('');
        const [clientesRes, planesRes, facturasRes] = await Promise.all([
          obtenerConetcomClientes(),
          obtenerConetcomPlanes(),
          obtenerConetcomFacturacion(),
        ]);
        setClientes(toList(clientesRes));
        setPlanes(toList(planesRes));
        setFacturas(toList(facturasRes));
      } catch (err) {
        setKpiError(err?.message || 'No se pudieron calcular los indicadores.');
      } finally {
        setLoadingKpis(false);
      }
    };
    cargarKpis();
  }, []);

  const { mrr, arpu, clientesActivos } = useMemo(() => {
    const planesPorId = new Map(
      planes.map((plan) => [String(plan.id_plan), Number(plan.precio_mensual) || 0]),
    );

    const activos = clientes.filter((c) => String(c.estado_cliente || '').toLowerCase() === 'activo');

    const totalMrr = activos.reduce((acc, cliente) => {
      const idPlan = cliente?.id_plan_contratado ? String(cliente.id_plan_contratado) : '';
      return acc + (planesPorId.get(idPlan) || 0);
    }, 0);

    const totalArpu = activos.length > 0 ? totalMrr / activos.length : 0;

    return {
      mrr: totalMrr,
      arpu: totalArpu,
      clientesActivos: activos.length,
    };
  }, [clientes, planes]);

  const analytics = useMemo(() => {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const inicioMesSiguiente = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);

    const toDate = (value) => {
      if (!value) return null;
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    const isInCurrentMonth = (value) => {
      const d = toDate(value);
      return Boolean(d && d >= inicioMes && d < inicioMesSiguiente);
    };

    const planesPorId = new Map(
      planes.map((plan) => [String(plan.id_plan), Number(plan.precio_mensual) || 0]),
    );

    const clientesInicioMes = clientes.filter((cliente) => {
      const fechaAlta = toDate(cliente.fecha_alta_cliente);
      const fechaFin = toDate(cliente.fecha_finalizacion_contrato);
      const altaAntesDeMes = Boolean(fechaAlta && fechaAlta < inicioMes);
      const noCanceladoAntesDeMes = !fechaFin || fechaFin >= inicioMes;
      return altaAntesDeMes && noCanceladoAntesDeMes;
    });

    const canceladosMes = clientes.filter((cliente) => {
      const cancelado = String(cliente.estado_cliente || '').toLowerCase() === 'cancelado';
      return cancelado && isInCurrentMonth(cliente.fecha_finalizacion_contrato);
    });

    const altasMes = clientes.filter((cliente) => isInCurrentMonth(cliente.fecha_alta_cliente));

    const activosInicioMesCount = clientesInicioMes.length;
    const canceladosMesCount = canceladosMes.length;
    const churnRate = activosInicioMesCount > 0 ? (canceladosMesCount / activosInicioMesCount) * 100 : 0;
    const crecimientoNetoClientes = altasMes.length - canceladosMesCount;

    const mrrInicioMes = clientesInicioMes.reduce((acc, cliente) => {
      const idPlan = cliente?.id_plan_contratado ? String(cliente.id_plan_contratado) : '';
      return acc + (planesPorId.get(idPlan) || 0);
    }, 0);

    const mrrPerdidoCancelaciones = canceladosMes.reduce((acc, cliente) => {
      const idPlan = cliente?.id_plan_contratado ? String(cliente.id_plan_contratado) : '';
      return acc + (planesPorId.get(idPlan) || 0);
    }, 0);

    const retencionIngresos = mrrInicioMes > 0 ? ((mrrInicioMes - mrrPerdidoCancelaciones) / mrrInicioMes) * 100 : 0;

    const activosActuales = clientes.filter((c) => String(c.estado_cliente || '').toLowerCase() === 'activo').length;
    const canceladosActuales = clientes.filter((c) => String(c.estado_cliente || '').toLowerCase() === 'cancelado').length;

    const ventasPorCanalMap = altasMes.reduce((acc, cliente) => {
      const canal = cliente.canal_adquisicion || 'sin_canal';
      acc.set(canal, (acc.get(canal) || 0) + 1);
      return acc;
    }, new Map());

    const ventasPorCanal = Array.from(ventasPorCanalMap.entries())
      .map(([canal, ventas]) => ({ canal, ventas }))
      .sort((a, b) => b.ventas - a.ventas);

    const regionPorCliente = new Map(
      clientes.map((cliente) => [String(cliente.id_cliente), cliente.region_departamento || 'sin_region']),
    );

    const ingresosPorRegionMap = facturas.reduce((acc, factura) => {
      if (!isInCurrentMonth(factura.fecha_emision)) return acc;
      const idCliente = String(factura.id_cliente || '');
      const region = regionPorCliente.get(idCliente) || 'sin_region';
      const valor = Number(factura.valor_total_facturado) || 0;
      acc.set(region, (acc.get(region) || 0) + valor);
      return acc;
    }, new Map());

    const ingresosPorRegion = Array.from(ingresosPorRegionMap.entries())
      .map(([region, ingresos]) => ({ region, ingresos }))
      .sort((a, b) => b.ingresos - a.ingresos);

    return {
      churnRate,
      crecimientoNetoClientes,
      retencionIngresos,
      activosActuales,
      canceladosActuales,
      ventasPorCanal,
      ingresosPorRegion,
    };
  }, [clientes, planes, facturas]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value || 0);

  const formatPercent = (value) => `${(value || 0).toFixed(2)}%`;

  return (
    <div className={styles.container}>
      <h1>Dashboard General Conectcom</h1>
      <p>Indicadores clave:</p>
      {kpiError ? <p style={{ color: '#b00020' }}>{kpiError}</p> : null}
      {loadingKpis ? (
        <p>Cargando indicadores...</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.8rem',
            marginBottom: '1rem',
            maxWidth: '700px',
          }}
        >
          <div style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '0.9rem', background: '#fff' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#555' }}>Ingresos mensuales recurrentes (MRR)</p>
            <h2 style={{ margin: '0.35rem 0 0 0', fontSize: '1.3rem' }}>{formatCurrency(mrr)}</h2>
          </div>
          <div style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '0.9rem', background: '#fff' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#555' }}>Ingreso promedio por cliente (ARPU)</p>
            <h2 style={{ margin: '0.35rem 0 0 0', fontSize: '1.3rem' }}>{formatCurrency(arpu)}</h2>
            <small style={{ color: '#666' }}>Base: {clientesActivos} clientes activos</small>
          </div>
          <div style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '0.9rem', background: '#fff' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#555' }}>Tasa de cancelacion mensual (Churn Rate)</p>
            <h2 style={{ margin: '0.35rem 0 0 0', fontSize: '1.3rem' }}>{formatPercent(analytics.churnRate)}</h2>
          </div>
          <div style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '0.9rem', background: '#fff' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#555' }}>Crecimiento neto de clientes (mes)</p>
            <h2 style={{ margin: '0.35rem 0 0 0', fontSize: '1.3rem' }}>{analytics.crecimientoNetoClientes}</h2>
          </div>
          <div style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '0.9rem', background: '#fff' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#555' }}>Retencion de ingresos</p>
            <h2 style={{ margin: '0.35rem 0 0 0', fontSize: '1.3rem' }}>{formatPercent(analytics.retencionIngresos)}</h2>
          </div>
          <div style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '0.9rem', background: '#fff' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#555' }}>Clientes activos vs cancelados</p>
            <h2 style={{ margin: '0.35rem 0 0 0', fontSize: '1.3rem' }}>
              {analytics.activosActuales} / {analytics.canceladosActuales}
            </h2>
          </div>
        </div>
      )}

      {!loadingKpis && !kpiError ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '0.8rem',
            marginBottom: '1rem',
            maxWidth: '900px',
          }}
        >
          <div style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '0.9rem', background: '#fff' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#555' }}>Ventas por canal (altas del mes)</p>
            {analytics.ventasPorCanal.length === 0 ? (
              <small style={{ color: '#666' }}>Sin datos del mes actual.</small>
            ) : (
              analytics.ventasPorCanal.map((item) => (
                <div key={item.canal} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <span>{item.canal}</span>
                  <strong>{item.ventas}</strong>
                </div>
              ))
            )}
          </div>
          <div style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '0.9rem', background: '#fff' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#555' }}>Ingresos por region (facturacion del mes)</p>
            {analytics.ingresosPorRegion.length === 0 ? (
              <small style={{ color: '#666' }}>Sin datos del mes actual.</small>
            ) : (
              analytics.ingresosPorRegion.map((item) => (
                <div key={item.region} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <span>{item.region}</span>
                  <strong>{formatCurrency(item.ingresos)}</strong>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
      <p>Accesos rapidos a los CRUD:</p>

      <div style={{ display: 'grid', gap: '0.6rem', maxWidth: '520px' }}>
        {accesos.map((item) => (
          <button
            key={item.path}
            type="button"
            onClick={() => navigate(item.path)}
            style={{ padding: '0.6rem 0.8rem', textAlign: 'left', cursor: 'pointer' }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DashboardGeneralConectcom;
