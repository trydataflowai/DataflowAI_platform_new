// DashboardChurnKpi.jsx
import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/Dashboards/DashboardChurn.module.css';
import { obtenerChurnKpi } from '../../api/DashboardsApis/DashboardChurnKpi';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const parseNumber = (val) => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  const v = String(val).replace(/\./g, '').replace(/,/g, '.').trim();
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Función CORREGIDA para calcular el churn rate mensual
const calcularChurnMensual = (data, year) => {
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const datosMensuales = {};

  meses.forEach((mes, index) => {
    datosMensuales[index + 1] = {
      mes: index + 1,
      nombreMes: mes,
      clientesActivos: 0,
      clientesPerdidos: 0,
      churnRate: 0
    };
  });

  for (let mes = 1; mes <= 12; mes++) {
    const clientesActivosMes = new Set();
    const clientesPerdidosMes = new Set();

    data.forEach((cliente) => {
      const idCliente = String(cliente.id_cliente);
      const fechaContratacion = cliente.fecha_contratacion ? new Date(cliente.fecha_contratacion) : null;
      const fechaBaja = cliente.fecha_baja ? new Date(cliente.fecha_baja) : null;

      if (fechaContratacion && fechaContratacion.getFullYear() <= year) {
        const mesContratacion = fechaContratacion.getMonth() + 1;
        const anoContratacion = fechaContratacion.getFullYear();

        if (anoContratacion < year || (anoContratacion === year && mesContratacion <= mes)) {
          if (!fechaBaja || fechaBaja.getFullYear() > year ||
            (fechaBaja.getFullYear() === year && fechaBaja.getMonth() + 1 > mes)) {
            clientesActivosMes.add(idCliente);
          }
        }
      }

      if (fechaBaja && fechaBaja.getFullYear() === year && fechaBaja.getMonth() + 1 === mes) {
        clientesPerdidosMes.add(idCliente);
      }
    });

    const activos = clientesActivosMes.size;
    const perdidos = clientesPerdidosMes.size;

    datosMensuales[mes].clientesActivos = activos;
    datosMensuales[mes].clientesPerdidos = perdidos;
    datosMensuales[mes].churnRate = activos > 0
      ? Number(((perdidos / activos) * 100).toFixed(2))
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
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
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

    if (cliente.fecha_contratacion) {
      const fechaContratacion = new Date(cliente.fecha_contratacion);
      if (fechaContratacion.getFullYear() === year) {
        const mesContratacion = fechaContratacion.getMonth() + 1;
        nuevosClientesPorMes.get(mesContratacion).add(idCliente);
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
    const nuevos = nuevosClientesPorMes.get(mes).size;
    const perdidos = clientesPerdidosPorMes.get(mes).size;

    datosMensuales[mes].nuevosClientes = nuevos;
    datosMensuales[mes].clientesPerdidos = perdidos;
  }

  return Object.values(datosMensuales);
};

// Función MODIFICADA para calcular porcentaje por factor de churn
const calcularTopChurnFactors = (data) => {
  const factores = {
    numero_quejas: { suma: 0, count: 0, nombre: 'Número de Quejas' },
    total_reclamos: { suma: 0, count: 0, nombre: 'Total Reclamos' },
    interacciones_servicio: { suma: 0, count: 0, nombre: 'Interacciones Servicio' },
    satisfaccion_cliente: { suma: 0, count: 0, nombre: 'Satisfacción Cliente' },
    valor_percibido: { suma: 0, count: 0, nombre: 'Valor Percibido' },
    recomendacion_nps: { suma: 0, count: 0, nombre: 'Recomendación NPS' }
  };

  data.forEach((cliente) => {
    if (cliente.numero_quejas !== null && cliente.numero_quejas !== undefined) {
      factores.numero_quejas.suma += parseNumber(cliente.numero_quejas);
      factores.numero_quejas.count++;
    }
    if (cliente.total_reclamos !== null && cliente.total_reclamos !== undefined) {
      factores.total_reclamos.suma += parseNumber(cliente.total_reclamos);
      factores.total_reclamos.count++;
    }
    if (cliente.interacciones_servicio !== null && cliente.interacciones_servicio !== undefined) {
      factores.interacciones_servicio.suma += parseNumber(cliente.interacciones_servicio);
      factores.interacciones_servicio.count++;
    }
    if (cliente.satisfaccion_cliente !== null && cliente.satisfaccion_cliente !== undefined) {
      factores.satisfaccion_cliente.suma += parseNumber(cliente.satisfaccion_cliente);
      factores.satisfaccion_cliente.count++;
    }
    if (cliente.valor_percibido !== null && cliente.valor_percibido !== undefined) {
      factores.valor_percibido.suma += parseNumber(cliente.valor_percibido);
      factores.valor_percibido.count++;
    }
    if (cliente.recomendacion_nps !== null && cliente.recomendacion_nps !== undefined) {
      factores.recomendacion_nps.suma += parseNumber(cliente.recomendacion_nps);
      factores.recomendacion_nps.count++;
    }
  });

  const sumaTotal = Object.values(factores).reduce((total, factor) => total + factor.suma, 0);

  const resultado = Object.entries(factores).map(([key, factor]) => {
    const porcentaje = sumaTotal > 0 ? Number(((factor.suma / sumaTotal) * 100).toFixed(2)) : 0;
    return {
      factor: factor.nombre,
      porcentaje: porcentaje,
      cantidadTotal: factor.suma,
      totalClientes: factor.count
    };
  });

  return resultado.sort((a, b) => b.porcentaje - a.porcentaje);
};

// Función para extraer años únicos de los datos
const extraerAnosDisponibles = (data) => {
  const anosSet = new Set();

  data.forEach((cliente) => {
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
  const [monthlyChurnData, setMonthlyChurnData] = useState([]);
  const [churnByPlanData, setChurnByPlanData] = useState([]);
  const [customersLostNewData, setCustomersLostNewData] = useState([]);
  const [topChurnFactorsData, setTopChurnFactorsData] = useState([]);
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
          setMonthlyChurnData([]);
          setChurnByPlanData([]);
          setCustomersLostNewData([]);
          setTopChurnFactorsData([]);
          setAvailableYears([new Date().getFullYear()]);
          setLoading(false);
          return;
        }

        const anosDisponibles = extraerAnosDisponibles(data);
        setAvailableYears(anosDisponibles);

        if (!anosDisponibles.includes(selectedYear)) {
          setSelectedYear(anosDisponibles[0]);
        }

        // Cálculos existentes
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

        // Nuevos datos
        const monthlyData = calcularChurnMensual(data, selectedYear);
        const planData = calcularChurnPorTipoPlan(data, selectedYear);
        const lostNewData = calcularClientesNuevosVsPerdidos(data, selectedYear);
        const churnFactorsData = calcularTopChurnFactors(data);

        // Guardar estados
        setTotalCustomers(total);
        setActiveCustomers(totalActive);
        setInactiveCustomers(totalInactive);
        setChurnRate(tasa);
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

  // Configuración de gráficas con tooltips mejorados
  const monthlyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#6b7280',
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          },
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#111827',
        bodyColor: '#374151',
        borderColor: 'rgba(229, 231, 235, 0.8)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function (context) {
            const data = monthlyChurnData[context.dataIndex];
            return [
              `Churn Rate: ${context.parsed.y}%`,
              `Clientes Activos: ${data.clientesActivos}`,
              `Clientes Perdidos: ${data.clientesPerdidos}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(243, 244, 246, 0.8)',
          drawBorder: false,
        },
        ticks: {
          color: '#6b7280'
        }
      },
      y: {
        grid: {
          color: 'rgba(243, 244, 246, 0.8)',
          drawBorder: false,
        },
        ticks: {
          color: '#6b7280',
          callback: function (value) {
            return value + '%';
          }
        },
        beginAtZero: true
      }
    }
  };

  const monthlyChartData = {
    labels: monthlyChurnData.map(item => item.nombreMes),
    datasets: [
      {
        label: 'Churn Rate',
        data: monthlyChurnData.map(item => item.churnRate),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const planChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#6b7280',
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          },
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#111827',
        bodyColor: '#374151',
        borderColor: 'rgba(229, 231, 235, 0.8)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          afterLabel: function (context) {
            const data = churnByPlanData[context.dataIndex];
            return [
              `Clientes Totales: ${data.clientesTotales}`,
              `Clientes Perdidos: ${data.clientesPerdidos}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(243, 244, 246, 0.8)',
          drawBorder: false,
        },
        ticks: {
          color: '#6b7280'
        }
      },
      y: {
        grid: {
          color: 'rgba(243, 244, 246, 0.8)',
          drawBorder: false,
        },
        ticks: {
          color: '#6b7280',
          callback: function (value) {
            return value + '%';
          }
        },
        beginAtZero: true
      }
    }
  };

  const planChartData = {
    labels: churnByPlanData.map(item => item.tipoPlan),
    datasets: [
      {
        label: 'Churn Rate',
        data: churnByPlanData.map(item => item.churnRate),
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: '#6366f1',
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      }
    ]
  };

  const lostNewChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#6b7280',
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          },
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#111827',
        bodyColor: '#374151',
        borderColor: 'rgba(229, 231, 235, 0.8)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(243, 244, 246, 0.8)',
          drawBorder: false,
        },
        ticks: {
          color: '#6b7280'
        }
      },
      y: {
        grid: {
          color: 'rgba(243, 244, 246, 0.8)',
          drawBorder: false,
        },
        ticks: {
          color: '#6b7280'
        },
        beginAtZero: true
      }
    }
  };

  const lostNewChartData = {
    labels: customersLostNewData.map(item => item.nombreMes),
    datasets: [
      {
        label: 'Clientes Perdidos',
        data: customersLostNewData.map(item => item.clientesPerdidos),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: '#ef4444',
        borderWidth: 1,
        borderRadius: 6,
      },
      {
        label: 'Clientes Nuevos',
        data: customersLostNewData.map(item => item.nuevosClientes),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: '#22c55e',
        borderWidth: 1,
        borderRadius: 6,
      }
    ]
  };

  const factorsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#6b7280',
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          },
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#111827',
        bodyColor: '#374151',
        borderColor: 'rgba(229, 231, 235, 0.8)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          afterLabel: function (context) {
            const data = topChurnFactorsData[context.dataIndex];
            return [
              `Cantidad Total: ${data.cantidadTotal}`,
              `Clientes Considerados: ${data.totalClientes}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(243, 244, 246, 0.8)',
          drawBorder: false,
        },
        ticks: {
          color: '#6b7280'
        }
      },
      y: {
        grid: {
          color: 'rgba(243, 244, 246, 0.8)',
          drawBorder: false,
        },
        ticks: {
          color: '#6b7280',
          callback: function (value) {
            return value + '%';
          }
        },
        beginAtZero: true
      }
    }
  };

  const factorsChartData = {
    labels: topChurnFactorsData.map(item => item.factor),
    datasets: [
      {
        label: 'Porcentaje de Participación',
        data: topChurnFactorsData.map(item => item.porcentaje),
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: '#8b5cf6',
        borderWidth: 1,
        borderRadius: 6,
      }
    ]
  };

  const abrirModalAI = () => {
    setShowAIModal(true);
  };

  const cerrarModalAI = () => {
    setShowAIModal(false);
  };

  return (
    <>
      <div className={styles['churn-dash-container']}>
        {/* Header Elegante */}
        <div className={styles['churn-dash-header']}>
          <div className={styles['churn-dash-header-content']}>
            <div className={styles['churn-dash-title-section']}>
              <h1 className={styles['churn-dash-main-title']}>
                Churn Analytics
              </h1>
              <p className={styles['churn-dash-subtitle']}>
                Análisis detallado de la tasa de abandono de clientes
              </p>
            </div>

            <div className={styles['churn-dash-controls']}>
              <div className={styles['churn-dash-filter']}>
                <label htmlFor="year-select" className={styles['churn-dash-filter-label']}>
                  Año
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

              <button
                className={styles['churn-dash-ai-button']}
                onClick={abrirModalAI}
              >
                <span className={styles['churn-dash-ai-icon']}>AI</span>
                Análisis IA
              </button>
            </div>
          </div>
        </div>

        {/* KPIs en línea - 4 tarjetas */}
        <div className={styles['churn-dash-kpi-section']}>
          <div className={styles['churn-dash-kpi-grid']}>
            {/* CHURN RATE */}
            <div className={styles['churn-dash-card']}>
              <div className={styles['churn-dash-card-content']}>
                <div className={styles['churn-dash-card-header']}>
                  <div className={styles['churn-dash-card-icon']}>
                    <div className={`${styles['churn-dash-icon']} ${styles['churn-dash-icon-primary']}`}>
                      <span>📈</span>
                    </div>
                  </div>
                  <h3 className={styles['churn-dash-card-title']}>Churn Rate</h3>
                </div>
                <div className={styles['churn-dash-card-body']}>
                  {loading ? (
                    <div className={styles['churn-dash-loading']}>...</div>
                  ) : error ? (
                    <div className={styles['churn-dash-error']}>!</div>
                  ) : (
                    <>
                      <div className={styles['churn-dash-count']}>{churnRate}%</div>
                      <div className={styles['churn-dash-card-description']}>
                        Tasa de abandono
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* TOTAL CUSTOMERS */}
            <div className={styles['churn-dash-card']}>
              <div className={styles['churn-dash-card-content']}>
                <div className={styles['churn-dash-card-header']}>
                  <div className={styles['churn-dash-card-icon']}>
                    <div className={`${styles['churn-dash-icon']} ${styles['churn-dash-icon-secondary']}`}>
                      <span>👥</span>
                    </div>
                  </div>
                  <h3 className={styles['churn-dash-card-title']}>Total Clientes</h3>
                </div>
                <div className={styles['churn-dash-card-body']}>
                  {loading ? (
                    <div className={styles['churn-dash-loading']}>...</div>
                  ) : error ? (
                    <div className={styles['churn-dash-error']}>!</div>
                  ) : (
                    <>
                      <div className={styles['churn-dash-count']}>{totalCustomers}</div>
                      <div className={styles['churn-dash-card-description']}>
                        Base total
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ACTIVE CUSTOMERS */}
            <div className={styles['churn-dash-card']}>
              <div className={styles['churn-dash-card-content']}>
                <div className={styles['churn-dash-card-header']}>
                  <div className={styles['churn-dash-card-icon']}>
                    <div className={`${styles['churn-dash-icon']} ${styles['churn-dash-icon-success']}`}>
                      <span>✅</span>
                    </div>
                  </div>
                  <h3 className={styles['churn-dash-card-title']}>Activos</h3>
                </div>
                <div className={styles['churn-dash-card-body']}>
                  {loading ? (
                    <div className={styles['churn-dash-loading']}>...</div>
                  ) : error ? (
                    <div className={styles['churn-dash-error']}>!</div>
                  ) : (
                    <>
                      <div className={styles['churn-dash-count']}>{activeCustomers}</div>
                      <div className={styles['churn-dash-card-description']}>
                        Clientes activos
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* INACTIVE CUSTOMERS */}
            <div className={styles['churn-dash-card']}>
              <div className={styles['churn-dash-card-content']}>
                <div className={styles['churn-dash-card-header']}>
                  <div className={styles['churn-dash-card-icon']}>
                    <div className={`${styles['churn-dash-icon']} ${styles['churn-dash-icon-warning']}`}>
                      <span>❌</span>
                    </div>
                  </div>
                  <h3 className={styles['churn-dash-card-title']}>Inactivos</h3>
                </div>
                <div className={styles['churn-dash-card-body']}>
                  {loading ? (
                    <div className={styles['churn-dash-loading']}>...</div>
                  ) : error ? (
                    <div className={styles['churn-dash-error']}>!</div>
                  ) : (
                    <>
                      <div className={styles['churn-dash-count']}>{inactiveCustomers}</div>
                      <div className={styles['churn-dash-card-description']}>
                        Clientes perdidos
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gráficas - Primera Fila */}
        <div className={styles['churn-dash-charts-section']}>
          <div className={styles['churn-dash-charts-grid']}>
            {/* MONTHLY CHURN RATE */}
            <div className={styles['churn-dash-chart-card']}>
              <div className={styles['churn-dash-chart-header']}>
                <h3 className={styles['churn-dash-chart-title']}>
                  Evolución Mensual del Churn Rate
                </h3>
                <p className={styles['churn-dash-chart-subtitle']}>
                  Tendencias y patrones de abandono por mes - {selectedYear}
                </p>
              </div>
              <div className={styles['churn-dash-chart-body']}>
                {loading ? (
                  <div className={styles['churn-dash-loading']}>Cargando gráfica...</div>
                ) : error ? (
                  <div className={styles['churn-dash-error']}>Error al cargar datos</div>
                ) : monthlyChurnData.length === 0 ? (
                  <div className={styles['churn-dash-no-data']}>No hay datos disponibles</div>
                ) : (
                  <Line data={monthlyChartData} options={monthlyChartOptions} />
                )}
              </div>
            </div>

            {/* CHURN RATE BY PLAN TYPE */}
            <div className={styles['churn-dash-chart-card']}>
              <div className={styles['churn-dash-chart-header']}>
                <h3 className={styles['churn-dash-chart-title']}>
                  Churn Rate por Tipo de Plan
                </h3>
                <p className={styles['churn-dash-chart-subtitle']}>
                  Análisis comparativo por categoría de servicio - {selectedYear}
                </p>
              </div>
              <div className={styles['churn-dash-chart-body']}>
                {loading ? (
                  <div className={styles['churn-dash-loading']}>Cargando gráfica...</div>
                ) : error ? (
                  <div className={styles['churn-dash-error']}>Error al cargar datos</div>
                ) : churnByPlanData.length === 0 ? (
                  <div className={styles['churn-dash-no-data']}>No hay datos disponibles</div>
                ) : (
                  <Bar data={planChartData} options={planChartOptions} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Gráficas - Segunda Fila */}
        <div className={styles['churn-dash-charts-section']}>
          <div className={styles['churn-dash-charts-grid']}>
            {/* CUSTOMERS LOST & NEW */}
            <div className={styles['churn-dash-chart-card']}>
              <div className={styles['churn-dash-chart-header']}>
                <h3 className={styles['churn-dash-chart-title']}>
                  Flujo de Clientes: Nuevos vs Perdidos
                </h3>
                <p className={styles['churn-dash-chart-subtitle']}>
                  Balance mensual de adquisición y pérdida - {selectedYear}
                </p>
              </div>
              <div className={styles['churn-dash-chart-body']}>
                {loading ? (
                  <div className={styles['churn-dash-loading']}>Cargando gráfica...</div>
                ) : error ? (
                  <div className={styles['churn-dash-error']}>Error al cargar datos</div>
                ) : customersLostNewData.length === 0 ? (
                  <div className={styles['churn-dash-no-data']}>No hay datos disponibles</div>
                ) : (
                  <Bar data={lostNewChartData} options={lostNewChartOptions} />
                )}
              </div>
            </div>

            {/* TOP CHURN FACTORS */}
            <div className={styles['churn-dash-chart-card']}>
              <div className={styles['churn-dash-chart-header']}>
                <h3 className={styles['churn-dash-chart-title']}>
                  Factores Clave de Churn
                </h3>
                <p className={styles['churn-dash-chart-subtitle']}>
                  Porcentaje de participación por factor de influencia
                </p>
              </div>
              <div className={styles['churn-dash-chart-body']}>
                {loading ? (
                  <div className={styles['churn-dash-loading']}>Cargando gráfica...</div>
                ) : error ? (
                  <div className={styles['churn-dash-error']}>Error al cargar datos</div>
                ) : topChurnFactorsData.length === 0 ? (
                  <div className={styles['churn-dash-no-data']}>No hay datos disponibles</div>
                ) : (
                  <Bar data={factorsChartData} options={factorsChartOptions} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL AI */}
      {/* MODAL AI */}
{showAIModal && (
  <div className={styles['churn-dash-ai-modal']}>
    <div className={styles['churn-dash-ai-modal-content']}>
      <div className={styles['churn-dash-ai-modal-header']}>
        <h2 className={styles['churn-dash-ai-modal-title']}>
          Análisis de Datos con Inteligencia Artificial
        </h2>
        <button 
          className={styles['churn-dash-ai-modal-close']}
          onClick={cerrarModalAI}
        >
          ×
        </button>
      </div>
      <div className={styles['churn-dash-ai-modal-body']}>
        <iframe
          src="/chatModal?tabla=dashboard_churn_rate"
          className={styles['churn-dash-ai-iframe']}
          title="Chat AI para análisis de datos"
        />
      </div>
    </div>
  </div>
)}

      
    </>
  );
};

export default DashboardChurnKpi;