// DashboardChurnKpi.jsx
import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  BarChart, Bar, ComposedChart
} from 'recharts';
import styles from '../../styles/Dashboards/DashboardChurn.module.css';
import { obtenerChurnKpi } from '../../api/DashboardsApis/DashboardChurnKpi';

const YEAR_FOR_PERIOD = 2025;
const REGISTROS_POR_PAGINA = 10;

const parseNumber = (val) => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  const v = String(val).replace(/\./g, '').replace(/,/g, '.').trim();
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatCurrency = (n) => {
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${n.toFixed(2)}`;
  }
};

// Función para formatear fecha
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return dateString;
  }
};

// Función para calcular el churn rate mensual
const calcularChurnMensual = (data, year) => {
  const meses = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];

  const datosMensuales = {};
  
  meses.forEach((mes, index) => {
    datosMensuales[index + 1] = {
      mes: index + 1,
      nombreMes: mes,
      clientesTotales: 0,
      clientesPerdidos: 0,
      churnRate: 0
    };
  });

  const clientesPorMes = new Map();
  const clientesPerdidosPorMes = new Map();

  for (let i = 1; i <= 12; i++) {
    clientesPorMes.set(i, new Set());
    clientesPerdidosPorMes.set(i, new Set());
  }

  data.forEach((cliente) => {
    const idCliente = String(cliente.id_cliente);
    
    if (cliente.fecha_contratacion) {
      const fechaContratacion = new Date(cliente.fecha_contratacion);
      if (fechaContratacion.getFullYear() === year) {
        const mesContratacion = fechaContratacion.getMonth() + 1;
        clientesPorMes.get(mesContratacion).add(idCliente);
      }
    }
    
    if (cliente.fecha_baja && String(cliente.estado_cliente).toLowerCase() === 'inactivo') {
      const fechaBaja = new Date(cliente.fecha_baja);
      if (fechaBaja.getFullYear() === year) {
        const mesBaja = fechaBaja.getMonth() + 1;
        clientesPerdidosPorMes.get(mesBaja).add(idCliente);
      }
    }
  });

  for (let mes = 1; mes <= 12; mes++) {
    const clientesTotales = clientesPorMes.get(mes).size;
    const clientesPerdidos = clientesPerdidosPorMes.get(mes).size;
    
    datosMensuales[mes].clientesTotales = clientesTotales;
    datosMensuales[mes].clientesPerdidos = clientesPerdidos;
    datosMensuales[mes].churnRate = clientesTotales > 0 
      ? Number(((clientesPerdidos / clientesTotales) * 100).toFixed(2))
      : 0;
  }

  return Object.values(datosMensuales);
};

// Función para calcular churn rate por tipo de plan
const calcularChurnPorTipoPlan = (data, year) => {
  const planesMap = new Map();
  
  data.forEach((cliente) => {
    const tipoPlan = cliente.tipo_plan || 'Sin Plan';
    if (!planesMap.has(tipoPlan)) {
      planesMap.set(tipoPlan, {
        tipoPlan: tipoPlan,
        clientesTotales: new Set(),
        clientesPerdidos: new Set()
      });
    }
  });

  data.forEach((cliente) => {
    const idCliente = String(cliente.id_cliente);
    const tipoPlan = cliente.tipo_plan || 'Sin Plan';
    const planData = planesMap.get(tipoPlan);
    
    if (!planData) return;

    if (cliente.fecha_contratacion) {
      const fechaContratacion = new Date(cliente.fecha_contratacion);
      if (fechaContratacion.getFullYear() === year) {
        planData.clientesTotales.add(idCliente);
      }
    }

    if (cliente.fecha_baja && String(cliente.estado_cliente).toLowerCase() === 'inactivo') {
      const fechaBaja = new Date(cliente.fecha_baja);
      if (fechaBaja.getFullYear() === year) {
        planData.clientesPerdidos.add(idCliente);
      }
    }
  });

  const resultado = [];
  for (const [tipoPlan, data] of planesMap) {
    const clientesTotales = data.clientesTotales.size;
    const clientesPerdidos = data.clientesPerdidos.size;
    const churnRate = clientesTotales > 0 
      ? Number(((clientesPerdidos / clientesTotales) * 100).toFixed(2))
      : 0;

    resultado.push({
      tipoPlan: tipoPlan,
      clientesTotales: clientesTotales,
      clientesPerdidos: clientesPerdidos,
      churnRate: churnRate
    });
  }

  return resultado.sort((a, b) => b.churnRate - a.churnRate);
};

// Función para calcular clientes nuevos vs perdidos por mes
const calcularClientesNuevosVsPerdidos = (data, year) => {
  const meses = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];

  const datosMensuales = {};
  
  meses.forEach((mes, index) => {
    datosMensuales[index + 1] = {
      mes: index + 1,
      nombreMes: mes,
      nuevosClientes: 0,
      clientesPerdidos: 0
    };
  });

  const nuevosClientesPorMes = new Map();
  const clientesPerdidosPorMes = new Map();

  for (let i = 1; i <= 12; i++) {
    nuevosClientesPorMes.set(i, new Set());
    clientesPerdidosPorMes.set(i, new Set());
  }

  data.forEach((cliente) => {
    const idCliente = String(cliente.id_cliente);
    
    // Clientes nuevos por fecha_contratacion
    if (cliente.fecha_contratacion) {
      const fechaContratacion = new Date(cliente.fecha_contratacion);
      if (fechaContratacion.getFullYear() === year) {
        const mesContratacion = fechaContratacion.getMonth() + 1;
        nuevosClientesPorMes.get(mesContratacion).add(idCliente);
      }
    }
    
    // Clientes perdidos por fecha_baja + estado inactivo
    if (cliente.fecha_baja && String(cliente.estado_cliente).toLowerCase() === 'inactivo') {
      const fechaBaja = new Date(cliente.fecha_baja);
      if (fechaBaja.getFullYear() === year) {
        const mesBaja = fechaBaja.getMonth() + 1;
        clientesPerdidosPorMes.get(mesBaja).add(idCliente);
      }
    }
  });

  for (let mes = 1; mes <= 12; mes++) {
    const nuevos = nuevosClientesPorMes.get(mes).size;
    const perdidos = clientesPerdidosPorMes.get(mes).size;
    
    datosMensuales[mes].nuevosClientes = nuevos;
    datosMensuales[mes].clientesPerdidos = perdidos;
  }

  return Object.values(datosMensuales);
};

// Función para calcular promedios de factores de churn
const calcularTopChurnFactors = (data) => {
  const factores = {
    numero_quejas: { suma: 0, count: 0, nombre: 'Número de Quejas' },
    total_reclamos: { suma: 0, count: 0, nombre: 'Total Reclamos' },
    interacciones_servicio: { suma: 0, count: 0, nombre: 'Interacciones Servicio' },
    satisfaccion_cliente: { suma: 0, count: 0, nombre: 'Satisfacción Cliente' },
    valor_percibido: { suma: 0, count: 0, nombre: 'Valor Percibido' },
    recomendacion_nps: { suma: 0, count: 0, nombre: 'Recomendación NPS' }
  };

  // Calcular sumas y contadores
  data.forEach((cliente) => {
    // Número de quejas
    if (cliente.numero_quejas !== null && cliente.numero_quejas !== undefined) {
      factores.numero_quejas.suma += parseNumber(cliente.numero_quejas);
      factores.numero_quejas.count++;
    }

    // Total reclamos
    if (cliente.total_reclamos !== null && cliente.total_reclamos !== undefined) {
      factores.total_reclamos.suma += parseNumber(cliente.total_reclamos);
      factores.total_reclamos.count++;
    }

    // Interacciones servicio
    if (cliente.interacciones_servicio !== null && cliente.interacciones_servicio !== undefined) {
      factores.interacciones_servicio.suma += parseNumber(cliente.interacciones_servicio);
      factores.interacciones_servicio.count++;
    }

    // Satisfacción cliente
    if (cliente.satisfaccion_cliente !== null && cliente.satisfaccion_cliente !== undefined) {
      factores.satisfaccion_cliente.suma += parseNumber(cliente.satisfaccion_cliente);
      factores.satisfaccion_cliente.count++;
    }

    // Valor percibido
    if (cliente.valor_percibido !== null && cliente.valor_percibido !== undefined) {
      factores.valor_percibido.suma += parseNumber(cliente.valor_percibido);
      factores.valor_percibido.count++;
    }

    // Recomendación NPS
    if (cliente.recomendacion_nps !== null && cliente.recomendacion_nps !== undefined) {
      factores.recomendacion_nps.suma += parseNumber(cliente.recomendacion_nps);
      factores.recomendacion_nps.count++;
    }
  });

  // Calcular promedios
  const resultado = Object.entries(factores).map(([key, factor]) => ({
    factor: factor.nombre,
    promedio: factor.count > 0 ? Number((factor.suma / factor.count).toFixed(2)) : 0,
    totalClientes: factor.count
  }));

  // Ordenar por promedio descendente
  return resultado.sort((a, b) => b.promedio - a.promedio);
};

// Función para obtener datos paginados para la tabla
const obtenerDatosTabla = (data, paginaActual) => {
  const inicio = (paginaActual - 1) * REGISTROS_POR_PAGINA;
  const fin = inicio + REGISTROS_POR_PAGINA;
  
  return data.slice(inicio, fin).map((cliente, index) => ({
    id: inicio + index + 1,
    nombre_cliente: cliente.nombre_cliente || 'N/A',
    fecha_contratacion: cliente.fecha_contratacion,
    fecha_baja: cliente.fecha_baja,
    estado_cliente: cliente.estado_cliente || 'N/A',
    observacion_cliente: cliente.observacion_cliente || '-',
    arpu: cliente.arpu ? formatCurrency(parseNumber(cliente.arpu)) : '-'
  }));
};

const DashboardChurnKpi = () => {
  const [churnRate, setChurnRate] = useState(null);
  const [totalCustomers, setTotalCustomers] = useState(null);
  const [activeCustomers, setActiveCustomers] = useState(null);
  const [inactiveCustomers, setInactiveCustomers] = useState(null);
  const [churnRevenue, setChurnRevenue] = useState(null);
  const [monthlyChurnData, setMonthlyChurnData] = useState([]);
  const [churnByPlanData, setChurnByPlanData] = useState([]);
  const [customersLostNewData, setCustomersLostNewData] = useState([]);
  const [topChurnFactorsData, setTopChurnFactorsData] = useState([]);
  const [tablaData, setTablaData] = useState([]);
  const [allClientesData, setAllClientesData] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await obtenerChurnKpi();
        if (!mounted) return;

        if (!Array.isArray(data) || data.length === 0) {
          setChurnRate('0.00');
          setTotalCustomers(0);
          setActiveCustomers(0);
          setInactiveCustomers(0);
          setChurnRevenue(formatCurrency(0));
          setMonthlyChurnData([]);
          setChurnByPlanData([]);
          setCustomersLostNewData([]);
          setTopChurnFactorsData([]);
          setTablaData([]);
          setAllClientesData([]);
          setTotalPaginas(1);
          setLoading(false);
          return;
        }

        // === CÁLCULOS EXISTENTES ===
        const allUnique = new Set(data.map((r) => String(r.id_cliente)));
        const total = allUnique.size;

        const activeSet = new Set(
          data
            .filter((r) => String(r.estado_cliente).toLowerCase() === 'activo' && r.id_cliente != null)
            .map((r) => String(r.id_cliente))
        );
        const totalActive = activeSet.size;

        const inactiveSet = new Set(
          data
            .filter((r) => String(r.estado_cliente).toLowerCase() === 'inactivo' && r.id_cliente != null)
            .map((r) => String(r.id_cliente))
        );
        const totalInactive = inactiveSet.size;

        const clientesTotalesPeriodo = new Set(
          data
            .filter((r) => r.fecha_contratacion && new Date(r.fecha_contratacion).getFullYear() === YEAR_FOR_PERIOD)
            .map((r) => String(r.id_cliente))
        );

        const clientesPerdidosPeriodo = new Set(
          data
            .filter(
              (r) =>
                r.fecha_baja &&
                new Date(r.fecha_baja).getFullYear() === YEAR_FOR_PERIOD &&
                String(r.estado_cliente).toLowerCase() === 'inactivo'
            )
            .map((r) => String(r.id_cliente))
        );

        const totalPeriodo = clientesTotalesPeriodo.size;
        const perdidosPeriodo = clientesPerdidosPeriodo.size;
        const tasa = totalPeriodo > 0 ? ((perdidosPeriodo / totalPeriodo) * 100).toFixed(2) : '0.00';

        const mapInactiveWithBaja = new Map();
        for (const r of data) {
          const id = r.id_cliente != null ? String(r.id_cliente) : null;
          if (!id) continue;
          if (r.fecha_baja && String(r.estado_cliente).toLowerCase() === 'inactivo') {
            if (!mapInactiveWithBaja.has(id)) {
              mapInactiveWithBaja.set(id, parseNumber(r.arpu ?? r.monto_facturado_mensual ?? 0));
            }
          }
        }
        let revenueSum = 0;
        for (const v of mapInactiveWithBaja.values()) revenueSum += v;

        // === NUEVO: TODOS LOS DATOS ===
        const monthlyData = calcularChurnMensual(data, YEAR_FOR_PERIOD);
        const planData = calcularChurnPorTipoPlan(data, YEAR_FOR_PERIOD);
        const lostNewData = calcularClientesNuevosVsPerdidos(data, YEAR_FOR_PERIOD);
        const churnFactorsData = calcularTopChurnFactors(data);
        
        // Configurar paginación
        setAllClientesData(data);
        const totalPags = Math.ceil(data.length / REGISTROS_POR_PAGINA);
        setTotalPaginas(totalPags);
        const tablaClientes = obtenerDatosTabla(data, 1);
        setTablaData(tablaClientes);

        // Guardar estados
        setTotalCustomers(total);
        setActiveCustomers(totalActive);
        setInactiveCustomers(totalInactive);
        setChurnRate(tasa);
        setChurnRevenue(formatCurrency(revenueSum));
        setMonthlyChurnData(monthlyData);
        setChurnByPlanData(planData);
        setCustomersLostNewData(lostNewData);
        setTopChurnFactorsData(churnFactorsData);
      } catch (err) {
        console.error('Error obteniendo datos de churn:', err);
        setError(err.message || 'Error al obtener datos');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  // Función para cambiar de página
  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
      const nuevaTablaData = obtenerDatosTabla(allClientesData, nuevaPagina);
      setTablaData(nuevaTablaData);
    }
  };

  // Tooltip personalizado para la gráfica de líneas
  const CustomTooltipLine = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>{`Mes: ${label}`}</p>
          <p className={styles.tooltipItem}>
            <span>Churn Rate: </span>
            <strong>{payload[0].value}%</strong>
          </p>
          <p className={styles.tooltipItem}>
            <span>Clientes Totales: </span>
            <strong>{payload[0].payload.clientesTotales}</strong>
          </p>
          <p className={styles.tooltipItem}>
            <span>Clientes Perdidos: </span>
            <strong>{payload[0].payload.clientesPerdidos}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  // Tooltip personalizado para la gráfica de barras
  const CustomTooltipBar = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>{`Plan: ${label}`}</p>
          <p className={styles.tooltipItem}>
            <span>Churn Rate: </span>
            <strong>{payload[0].value}%</strong>
          </p>
          <p className={styles.tooltipItem}>
            <span>Clientes Totales: </span>
            <strong>{payload[0].payload.clientesTotales}</strong>
          </p>
          <p className={styles.tooltipItem}>
            <span>Clientes Perdidos: </span>
            <strong>{payload[0].payload.clientesPerdidos}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  // Tooltip personalizado para Customers Lost & New
  const CustomTooltipLostNew = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>{`Mes: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} className={styles.tooltipItem} style={{ color: entry.color }}>
              <span>{entry.name}: </span>
              <strong>{entry.value}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Tooltip personalizado para Top Churn Factors
  const CustomTooltipChurnFactors = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>{`Factor: ${label}`}</p>
          <p className={styles.tooltipItem}>
            <span>Promedio: </span>
            <strong>{payload[0].value}</strong>
          </p>
          <p className={styles.tooltipItem}>
            <span>Clientes Considerados: </span>
            <strong>{payload[0].payload.totalClientes}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  // Función para obtener color según el factor
  const getFactorColor = (factor) => {
    const colors = {
      'Número de Quejas': '#ef4444',
      'Total Reclamos': '#f97316',
      'Interacciones Servicio': '#eab308',
      'Satisfacción Cliente': '#10b981',
      'Valor Percibido': '#3b82f6',
      'Recomendación NPS': '#8b5cf6'
    };
    return colors[factor] || '#6b7280';
  };

  return (
    <div className={styles.container}>
      {/* KPI CARDS */}
      <div className={styles.kpiGrid}>
        {/* CHURN RATE */}
        <div className={styles.card} role="region" aria-label="Churn Rate">
          <div className={styles.cardHeader}>
            <h2 className={styles.title}>Churn Rate</h2>
            <div className={styles.subtitle}>
              Fórmula: Clientes perdidos ÷ Clientes totales (inicio periodo) × 100
            </div>
          </div>
          <div className={styles.cardBody}>
            {loading ? (
              <div className={styles.loading}>Cargando...</div>
            ) : error ? (
              <div className={styles.error}>Error: {error}</div>
            ) : (
              <div className={styles.count}>{churnRate}%</div>
            )}
          </div>
        </div>

        {/* TOTAL CUSTOMERS */}
        <div className={styles.card} role="region" aria-label="Total Customers">
          <div className={styles.cardHeader}>
            <h2 className={styles.title}>Total Customers</h2>
            <div className={styles.subtitle}>Recuento único por id_cliente</div>
          </div>
          <div className={styles.cardBody}>
            {loading ? (
              <div className={styles.loading}>Cargando...</div>
            ) : error ? (
              <div className={styles.error}>Error: {error}</div>
            ) : (
              <div className={styles.count}>{totalCustomers}</div>
            )}
          </div>
        </div>

        {/* ACTIVE CUSTOMERS */}
        <div className={styles.card} role="region" aria-label="Active Customers">
          <div className={styles.cardHeader}>
            <h2 className={styles.title}>Active Customers</h2>
            <div className={styles.subtitle}>id_cliente únicos con estado = activo</div>
          </div>
          <div className={styles.cardBody}>
            {loading ? (
              <div className={styles.loading}>Cargando...</div>
            ) : error ? (
              <div className={styles.error}>Error: {error}</div>
            ) : (
              <div className={styles.count}>{activeCustomers}</div>
            )}
          </div>
        </div>

        {/* INACTIVE CUSTOMERS */}
        <div className={styles.card} role="region" aria-label="Inactive Customers">
          <div className={styles.cardHeader}>
            <h2 className={styles.title}>Inactive Customers</h2>
            <div className={styles.subtitle}>id_cliente únicos con estado = inactivo</div>
          </div>
          <div className={styles.cardBody}>
            {loading ? (
              <div className={styles.loading}>Cargando...</div>
            ) : error ? (
              <div className={styles.error}>Error: {error}</div>
            ) : (
              <div className={styles.count}>{inactiveCustomers}</div>
            )}
          </div>
        </div>

        {/* CHURN REVENUE */}
        <div className={styles.card} role="region" aria-label="Churn Revenue">
          <div className={styles.cardHeader}>
            <h2 className={styles.title}>Churn Revenue</h2>
            <div className={styles.subtitle}>
              Suma de ARPU por clientes inactivos (con fecha_baja)
            </div>
          </div>
          <div className={styles.cardBody}>
            {loading ? (
              <div className={styles.loading}>Cargando...</div>
            ) : error ? (
              <div className={styles.error}>Error: {error}</div>
            ) : (
              <div className={styles.count}>{churnRevenue}</div>
            )}
          </div>
        </div>
      </div>

      {/* GRÁFICAS */}
      <div className={styles.chartsGrid}>
        {/* GRÁFICA MONTHLY CHURN RATE */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Monthly Churn Rate - {YEAR_FOR_PERIOD}</h2>
            <div className={styles.chartSubtitle}>
              Evolución mensual del Churn Rate: Clientes perdidos ÷ Clientes totales del mes × 100
            </div>
          </div>
          <div className={styles.chartBody}>
            {loading ? (
              <div className={styles.loading}>Cargando gráfica...</div>
            ) : error ? (
              <div className={styles.error}>Error: {error}</div>
            ) : monthlyChurnData.length === 0 ? (
              <div className={styles.noData}>No hay datos disponibles para el año {YEAR_FOR_PERIOD}</div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={monthlyChurnData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 20,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="nombreMes" 
                    tick={{ fill: '#666' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: '#666' }}
                    tickLine={false}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<CustomTooltipLine />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="churnRate"
                    name="Churn Rate"
                    stroke="#ff6b6b"
                    strokeWidth={3}
                    dot={{ fill: '#ff6b6b', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, fill: '#ff4757' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* GRÁFICA CHURN RATE BY PLAN TYPE */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Churn Rate by Plan Type - {YEAR_FOR_PERIOD}</h2>
            <div className={styles.chartSubtitle}>
              Comparación del Churn Rate por tipo de plan
            </div>
          </div>
          <div className={styles.chartBody}>
            {loading ? (
              <div className={styles.loading}>Cargando gráfica...</div>
            ) : error ? (
              <div className={styles.error}>Error: {error}</div>
            ) : churnByPlanData.length === 0 ? (
              <div className={styles.noData}>No hay datos disponibles por tipo de plan</div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={churnByPlanData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 20,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="tipoPlan" 
                    tick={{ fill: '#666', fontSize: 12 }}
                    tickLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tick={{ fill: '#666' }}
                    tickLine={false}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<CustomTooltipBar />} />
                  <Legend />
                  <Bar
                    dataKey="churnRate"
                    name="Churn Rate"
                    fill="#8884d8"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* GRÁFICA CUSTOMERS LOST & NEW */}
        <div className={`${styles.chartCard} ${styles.fullWidth}`}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Customers Lost & New - {YEAR_FOR_PERIOD}</h2>
            <div className={styles.chartSubtitle}>
              Comparación mensual entre clientes nuevos y clientes perdidos
            </div>
          </div>
          <div className={styles.chartBody}>
            {loading ? (
              <div className={styles.loading}>Cargando gráfica...</div>
            ) : error ? (
              <div className={styles.error}>Error: {error}</div>
            ) : customersLostNewData.length === 0 ? (
              <div className={styles.noData}>No hay datos disponibles para el año {YEAR_FOR_PERIOD}</div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart
                  data={customersLostNewData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 20,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="nombreMes" 
                    tick={{ fill: '#666' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: '#666' }}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltipLostNew />} />
                  <Legend />
                  <Bar
                    dataKey="clientesPerdidos"
                    name="Lost Customers"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                    barSize={25}
                  />
                  <Bar
                    dataKey="nuevosClientes"
                    name="New Customers"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    barSize={25}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* GRÁFICA TOP CHURN FACTORS */}
        <div className={`${styles.chartCard} ${styles.fullWidth}`}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Top Churn Factors</h2>
            <div className={styles.chartSubtitle}>
              Promedio de factores que influyen en el churn rate de los clientes
            </div>
          </div>
          <div className={styles.chartBody}>
            {loading ? (
              <div className={styles.loading}>Cargando gráfica...</div>
            ) : error ? (
              <div className={styles.error}>Error: {error}</div>
            ) : topChurnFactorsData.length === 0 ? (
              <div className={styles.noData}>No hay datos disponibles para factores de churn</div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={topChurnFactorsData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 20,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="factor" 
                    tick={{ fill: '#666', fontSize: 12 }}
                    tickLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tick={{ fill: '#666' }}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltipChurnFactors />} />
                  <Legend />
                  <Bar
                    dataKey="promedio"
                    name="Valor Promedio"
                    fill={(data) => getFactorColor(data.factor)}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* TABLA DE CLIENTES */}
      <div className={styles.tableSection}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Clientes</h2>
            <div className={styles.chartSubtitle}>
              Lista de clientes ({allClientesData.length} registros totales)
            </div>
          </div>
          <div className={styles.tableContainer}>
            {loading ? (
              <div className={styles.loading}>Cargando tabla...</div>
            ) : error ? (
              <div className={styles.error}>Error: {error}</div>
            ) : tablaData.length === 0 ? (
              <div className={styles.noData}>No hay datos disponibles para mostrar</div>
            ) : (
              <>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nombre del Cliente</th>
                      <th>Fecha Contratación</th>
                      <th>Fecha Baja</th>
                      <th>Estado</th>
                      <th>ARPU</th>
                      <th>Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tablaData.map((cliente) => (
                      <tr key={cliente.id}>
                        <td className={styles.numberCell}>{cliente.id}</td>
                        <td className={styles.nameCell}>{cliente.nombre_cliente}</td>
                        <td className={styles.dateCell}>{formatDate(cliente.fecha_contratacion)}</td>
                        <td className={styles.dateCell}>{formatDate(cliente.fecha_baja)}</td>
                        <td className={styles.statusCell}>
                          <span className={`${styles.statusBadge} ${
                            cliente.estado_cliente.toLowerCase() === 'activo' ? styles.active : styles.inactive
                          }`}>
                            {cliente.estado_cliente}
                          </span>
                        </td>
                        <td className={styles.currencyCell}>{cliente.arpu}</td>
                        <td className={styles.observationCell}>{cliente.observacion_cliente}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* PAGINACIÓN */}
                <div className={styles.pagination}>
                  <button 
                    className={`${styles.paginationButton} ${paginaActual === 1 ? styles.disabled : ''}`}
                    onClick={() => cambiarPagina(paginaActual - 1)}
                    disabled={paginaActual === 1}
                  >
                    Anterior
                  </button>
                  
                  <div className={styles.paginationInfo}>
                    Página {paginaActual} de {totalPaginas}
                  </div>
                  
                  <button 
                    className={`${styles.paginationButton} ${paginaActual === totalPaginas ? styles.disabled : ''}`}
                    onClick={() => cambiarPagina(paginaActual + 1)}
                    disabled={paginaActual === totalPaginas}
                  >
                    Siguiente
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardChurnKpi;