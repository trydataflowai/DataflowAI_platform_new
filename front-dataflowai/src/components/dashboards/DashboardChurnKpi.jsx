// DashboardChurnKpi.jsx
import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  BarChart, Bar, ComposedChart
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/Dashboards/DashboardChurn.module.css';
import { obtenerChurnKpi } from '../../api/DashboardsApis/DashboardChurnKpi';

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

// Función para extraer años únicos de los datos
const extraerAnosDisponibles = (data) => {
  const anosSet = new Set();
  
  data.forEach((cliente) => {
    // Extraer año de fecha_contratacion
    if (cliente.fecha_contratacion) {
      try {
        const fecha = new Date(cliente.fecha_contratacion);
        if (!isNaN(fecha.getTime())) {
          anosSet.add(fecha.getFullYear());
        }
      } catch (error) {
        console.warn('Fecha de contratación inválida:', cliente.fecha_contratacion);
      }
    }
    
    // Extraer año de fecha_baja
    if (cliente.fecha_baja) {
      try {
        const fecha = new Date(cliente.fecha_baja);
        if (!isNaN(fecha.getTime())) {
          anosSet.add(fecha.getFullYear());
        }
      } catch (error) {
        console.warn('Fecha de baja inválida:', cliente.fecha_baja);
      }
    }
  });
  
  const anosArray = Array.from(anosSet).sort((a, b) => b - a);
  return anosArray.length > 0 ? anosArray : [new Date().getFullYear()];
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
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);
  const [showAIModal, setShowAIModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

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
          setAvailableYears([new Date().getFullYear()]);
          setLoading(false);
          return;
        }

        // Extraer años disponibles de los datos
        const anosDisponibles = extraerAnosDisponibles(data);
        setAvailableYears(anosDisponibles);
        
        // Si el año seleccionado no está en los disponibles, seleccionar el más reciente
        if (!anosDisponibles.includes(selectedYear)) {
          setSelectedYear(anosDisponibles[0]);
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
            .filter((r) => r.fecha_contratacion && new Date(r.fecha_contratacion).getFullYear() === selectedYear)
            .map((r) => String(r.id_cliente))
        );

        const clientesPerdidosPeriodo = new Set(
          data
            .filter(
              (r) =>
                r.fecha_baja &&
                new Date(r.fecha_baja).getFullYear() === selectedYear &&
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
        const monthlyData = calcularChurnMensual(data, selectedYear);
        const planData = calcularChurnPorTipoPlan(data, selectedYear);
        const lostNewData = calcularClientesNuevosVsPerdidos(data, selectedYear);
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
  }, [selectedYear]);

  // Función para cambiar de página
  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
      const nuevaTablaData = obtenerDatosTabla(allClientesData, nuevaPagina);
      setTablaData(nuevaTablaData);
    }
  };

  // Función para abrir modal de AI
  const abrirModalAI = () => {
    setShowAIModal(true);
  };

  // Función para cerrar modal de AI
  const cerrarModalAI = () => {
    setShowAIModal(false);
  };

  // Tooltip personalizado para la gráfica de líneas
  const CustomTooltipLine = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles['churn-dash-tooltip']}>
          <p className={styles['churn-dash-tooltip-label']}>{`Mes: ${label}`}</p>
          <p className={styles['churn-dash-tooltip-item']}>
            <span>Churn Rate: </span>
            <strong>{payload[0].value}%</strong>
          </p>
          <p className={styles['churn-dash-tooltip-item']}>
            <span>Clientes Totales: </span>
            <strong>{payload[0].payload.clientesTotales}</strong>
          </p>
          <p className={styles['churn-dash-tooltip-item']}>
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
        <div className={styles['churn-dash-tooltip']}>
          <p className={styles['churn-dash-tooltip-label']}>{`Plan: ${label}`}</p>
          <p className={styles['churn-dash-tooltip-item']}>
            <span>Churn Rate: </span>
            <strong>{payload[0].value}%</strong>
          </p>
          <p className={styles['churn-dash-tooltip-item']}>
            <span>Clientes Totales: </span>
            <strong>{payload[0].payload.clientesTotales}</strong>
          </p>
          <p className={styles['churn-dash-tooltip-item']}>
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
        <div className={styles['churn-dash-tooltip']}>
          <p className={styles['churn-dash-tooltip-label']}>{`Mes: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} className={styles['churn-dash-tooltip-item']} style={{ color: entry.color }}>
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
        <div className={styles['churn-dash-tooltip']}>
          <p className={styles['churn-dash-tooltip-label']}>{`Factor: ${label}`}</p>
          <p className={styles['churn-dash-tooltip-item']}>
            <span>Promedio: </span>
            <strong>{payload[0].value}</strong>
          </p>
          <p className={styles['churn-dash-tooltip-item']}>
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
    <>
      <div className={styles['churn-dash-container']}>
        {/* FILTRO POR AÑO Y BOTÓN AI */}
        <div className={styles['churn-dash-header']}>
          <div className={styles['churn-dash-filter']}>
            <div className={styles['churn-dash-filter-content']}>
              <label htmlFor="year-select" className={styles['churn-dash-filter-label']}>
                Filtrar por Año:
              </label>
              <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className={styles['churn-dash-filter-select']}
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* BOTÓN AI */}
          <button 
            className={styles['churn-dash-ai-button']}
            onClick={abrirModalAI}
          >
            ¿Deseas analizar tus datos con AI?
          </button>
        </div>

        {/* KPI CARDS */}
        <div className={styles['churn-dash-kpi-grid']}>
          {/* CHURN RATE */}
          <div className={styles['churn-dash-card']} role="region" aria-label="Churn Rate">
            <div className={styles['churn-dash-card-header']}>
              <h2 className={styles['churn-dash-title']}>Churn Rate</h2>
            </div>
            <div className={styles['churn-dash-card-body']}>
              {loading ? (
                <div className={styles['churn-dash-loading']}>Cargando...</div>
              ) : error ? (
                <div className={styles['churn-dash-error']}>Error: {error}</div>
              ) : (
                <div className={styles['churn-dash-count']}>{churnRate}%</div>
              )}
            </div>
          </div>

          {/* TOTAL CUSTOMERS */}
          <div className={styles['churn-dash-card']} role="region" aria-label="Total Customers">
            <div className={styles['churn-dash-card-header']}>
              <h2 className={styles['churn-dash-title']}>Total Customers</h2>
            </div>
            <div className={styles['churn-dash-card-body']}>
              {loading ? (
                <div className={styles['churn-dash-loading']}>Cargando...</div>
              ) : error ? (
                <div className={styles['churn-dash-error']}>Error: {error}</div>
              ) : (
                <div className={styles['churn-dash-count']}>{totalCustomers}</div>
              )}
            </div>
          </div>

          {/* ACTIVE CUSTOMERS */}
          <div className={styles['churn-dash-card']} role="region" aria-label="Active Customers">
            <div className={styles['churn-dash-card-header']}>
              <h2 className={styles['churn-dash-title']}>Active Customers</h2>
            </div>
            <div className={styles['churn-dash-card-body']}>
              {loading ? (
                <div className={styles['churn-dash-loading']}>Cargando...</div>
              ) : error ? (
                <div className={styles['churn-dash-error']}>Error: {error}</div>
              ) : (
                <div className={styles['churn-dash-count']}>{activeCustomers}</div>
              )}
            </div>
          </div>

          {/* INACTIVE CUSTOMERS */}
          <div className={styles['churn-dash-card']} role="region" aria-label="Inactive Customers">
            <div className={styles['churn-dash-card-header']}>
              <h2 className={styles['churn-dash-title']}>Inactive Customers</h2>
            </div>
            <div className={styles['churn-dash-card-body']}>
              {loading ? (
                <div className={styles['churn-dash-loading']}>Cargando...</div>
              ) : error ? (
                <div className={styles['churn-dash-error']}>Error: {error}</div>
              ) : (
                <div className={styles['churn-dash-count']}>{inactiveCustomers}</div>
              )}
            </div>
          </div>

          {/* CHURN REVENUE */}
          <div className={styles['churn-dash-card']} role="region" aria-label="Churn Revenue">
            <div className={styles['churn-dash-card-header']}>
              <h2 className={styles['churn-dash-title']}>Churn Revenue</h2>
            </div>
            <div className={styles['churn-dash-card-body']}>
              {loading ? (
                <div className={styles['churn-dash-loading']}>Cargando...</div>
              ) : error ? (
                <div className={styles['churn-dash-error']}>Error: {error}</div>
              ) : (
                <div className={styles['churn-dash-count']}>{churnRevenue}</div>
              )}
            </div>
          </div>
        </div>

        {/* GRÁFICAS - PRIMERA FILA */}
        <div className={styles['churn-dash-charts-grid']}>

          
          {/* GRÁFICA MONTHLY CHURN RATE */}
          <div className={styles['churn-dash-chart-card']}>
            <div className={styles['churn-dash-chart-header']}>
              <h2 className={styles['churn-dash-chart-title']}>Monthly Churn Rate - {selectedYear}</h2>
              <div className={styles['churn-dash-chart-subtitle']}>
                Evolución mensual del Churn Rate
              </div>
            </div>
            <div className={styles['churn-dash-chart-body']}>
              {loading ? (
                <div className={styles['churn-dash-loading']}>Cargando gráfica...</div>
              ) : error ? (
                <div className={styles['churn-dash-error']}>Error: {error}</div>
              ) : monthlyChurnData.length === 0 ? (
                <div className={styles['churn-dash-no-data']}>No hay datos disponibles para el año {selectedYear}</div>
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
          <div className={styles['churn-dash-chart-card']}>
            <div className={styles['churn-dash-chart-header']}>
              <h2 className={styles['churn-dash-chart-title']}>Churn Rate by Plan Type - {selectedYear}</h2>
              <div className={styles['churn-dash-chart-subtitle']}>
                Comparación del Churn Rate por tipo de plan
              </div>
            </div>
            <div className={styles['churn-dash-chart-body']}>
              {loading ? (
                <div className={styles['churn-dash-loading']}>Cargando gráfica...</div>
              ) : error ? (
                <div className={styles['churn-dash-error']}>Error: {error}</div>
              ) : churnByPlanData.length === 0 ? (
                <div className={styles['churn-dash-no-data']}>No hay datos disponibles por tipo de plan</div>
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
        </div>

        {/* GRÁFICAS - SEGUNDA FILA */}
        <div className={styles['churn-dash-charts-grid']}>
          {/* GRÁFICA CUSTOMERS LOST & NEW */}
          <div className={styles['churn-dash-chart-card']}>
            <div className={styles['churn-dash-chart-header']}>
              <h2 className={styles['churn-dash-chart-title']}>Customers Lost & New - {selectedYear}</h2>
              <div className={styles['churn-dash-chart-subtitle']}>
                Comparación mensual entre clientes nuevos y clientes perdidos
              </div>
            </div>
            <div className={styles['churn-dash-chart-body']}>
              {loading ? (
                <div className={styles['churn-dash-loading']}>Cargando gráfica...</div>
              ) : error ? (
                <div className={styles['churn-dash-error']}>Error: {error}</div>
              ) : customersLostNewData.length === 0 ? (
                <div className={styles['churn-dash-no-data']}>No hay datos disponibles para el año {selectedYear}</div>
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
          <div className={styles['churn-dash-chart-card']}>
            <div className={styles['churn-dash-chart-header']}>
              <h2 className={styles['churn-dash-chart-title']}>Top Churn Factors</h2>
              <div className={styles['churn-dash-chart-subtitle']}>
                Promedio de factores que influyen en el churn rate de los clientes
              </div>
            </div>
            <div className={styles['churn-dash-chart-body']}>
              {loading ? (
                <div className={styles['churn-dash-loading']}>Cargando gráfica...</div>
              ) : error ? (
                <div className={styles['churn-dash-error']}>Error: {error}</div>
              ) : topChurnFactorsData.length === 0 ? (
                <div className={styles['churn-dash-no-data']}>No hay datos disponibles para factores de churn</div>
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
        <div className={styles['churn-dash-table-section']}>
          <div className={styles['churn-dash-chart-card']}>
            <div className={styles['churn-dash-chart-header']}>
              <h2 className={styles['churn-dash-chart-title']}>Clientes</h2>
              <div className={styles['churn-dash-chart-subtitle']}>
                Lista de clientes ({allClientesData.length} registros totales)
              </div>
            </div>
            <div className={styles['churn-dash-table-container']}>
              {loading ? (
                <div className={styles['churn-dash-loading']}>Cargando tabla...</div>
              ) : error ? (
                <div className={styles['churn-dash-error']}>Error: {error}</div>
              ) : tablaData.length === 0 ? (
                <div className={styles['churn-dash-no-data']}>No hay datos disponibles para mostrar</div>
              ) : (
                <>
                  <table className={styles['churn-dash-data-table']}>
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
                          <td className={styles['churn-dash-number-cell']}>{cliente.id}</td>
                          <td className={styles['churn-dash-name-cell']}>{cliente.nombre_cliente}</td>
                          <td className={styles['churn-dash-date-cell']}>{formatDate(cliente.fecha_contratacion)}</td>
                          <td className={styles['churn-dash-date-cell']}>{formatDate(cliente.fecha_baja)}</td>
                          <td className={styles['churn-dash-status-cell']}>
                            <span className={`${styles['churn-dash-status-badge']} ${
                              cliente.estado_cliente.toLowerCase() === 'activo' ? styles['churn-dash-active'] : styles['churn-dash-inactive']
                            }`}>
                              {cliente.estado_cliente}
                            </span>
                          </td>
                          <td className={styles['churn-dash-currency-cell']}>{cliente.arpu}</td>
                          <td className={styles['churn-dash-observation-cell']}>{cliente.observacion_cliente}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* PAGINACIÓN */}
                  <div className={styles['churn-dash-pagination']}>
                    <button 
                      className={`${styles['churn-dash-pagination-button']} ${paginaActual === 1 ? styles['churn-dash-disabled'] : ''}`}
                      onClick={() => cambiarPagina(paginaActual - 1)}
                      disabled={paginaActual === 1}
                    >
                      Anterior
                    </button>
                    
                    <div className={styles['churn-dash-pagination-info']}>
                      Página {paginaActual} de {totalPaginas}
                    </div>
                    
                    <button 
                      className={`${styles['churn-dash-pagination-button']} ${paginaActual === totalPaginas ? styles['churn-dash-disabled'] : ''}`}
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

      {/* MODAL AI */}
      {showAIModal && (
        <div className={styles['churn-dash-ai-modal']}>
          <div className={styles['churn-dash-ai-modal-header']}>
            <h2 className={styles['churn-dash-ai-modal-title']}>
              🤖 Análisis de Datos con Inteligencia Artificial
            </h2>
            <button 
              className={styles['churn-dash-ai-modal-close']}
              onClick={cerrarModalAI}
            >
              ✕ Cerrar
            </button>
          </div>
          <div className={styles['churn-dash-ai-modal-content']}>
            <iframe
              src="/dashboard-kpi-churn/chat-ai-consultas"
              className={styles['churn-dash-ai-iframe']}
              title="Chat AI para análisis de datos"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardChurnKpi;