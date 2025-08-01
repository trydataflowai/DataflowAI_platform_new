import React, { useEffect, useState } from 'react';
import { fetchDashboardFinanzas } from '../../api/DashboardsApis/DashboardFinanzas';
import { obtenerInfoUsuario } from '../../api/Usuario';
import { useTheme } from '../componentes/ThemeContext';
import darkStyles from '../../styles/Dashboards/DashboardFinanzas.module.css';
import lightStyles from '../../styles/Dashboards/DashboardFinanzasLight.module.css';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FiFilter, FiDownload, FiRefreshCw } from 'react-icons/fi';

// Registrar componentes de Chart.js
Chart.register(...registerables);

const DashboardFinanzas = () => {
  const [datos, setDatos] = useState(null);
  const [datosCompletos, setDatosCompletos] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usandoDatosReferencia, setUsandoDatosReferencia] = useState(false);
  const [planId, setPlanId] = useState(null);
  const { theme } = useTheme();
  const [styles, setStyles] = useState(darkStyles);

  // Filtros
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [filtroActivo, setFiltroActivo] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Obtener información del usuario y plan
  useEffect(() => {
    const obtenerPlan = async () => {
      try {
        const usuario = await obtenerInfoUsuario();
        setPlanId(usuario.empresa?.plan?.id);
      } catch (err) {
        console.error('Error obteniendo info usuario:', err);
      }
    };
    obtenerPlan();
  }, []);

  // Aplicar estilos según tema y plan
  useEffect(() => {
    if (planId === 3 || planId === 6) {
      setStyles(theme === 'dark' ? darkStyles : lightStyles);
    } else {
      setStyles(darkStyles);
    }
  }, [theme, planId]);

  // Cargar datos financieros
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        const usuario = await obtenerInfoUsuario();
        const idEmpresaUsuario = usuario.empresa?.id;

        const finanzas = await fetchDashboardFinanzas();
        setDatosCompletos(finanzas);

        let datosFiltrados = finanzas.filter(
          item => item.id_empresa === idEmpresaUsuario
        );

        if (datosFiltrados.length === 0) {
          datosFiltrados = finanzas.filter(item => item.id_empresa === 56);
          setUsandoDatosReferencia(true);
        }

        procesarDatos(datosFiltrados);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // Procesar datos para gráficos y resumen
  const procesarDatos = (datosCrudos) => {
    const datosMensuales = datosCrudos.map(item => ({
      mes: `${item.mes}/${item.anio}`,
      fecha: new Date(item.anio, item.mes - 1),
      ingresos: parseFloat(item.ingresos_totales),
      egresos: parseFloat(item.total_egresos),
      utilidad: parseFloat(item.utilidad_neta),
      margen: parseFloat(item.margen_neto),
      flujo: parseFloat(item.flujo_efectivo_total),
      activos: parseFloat(item.activos_totales),
      pasivos: parseFloat(item.pasivos_totales),
      patrimonio: parseFloat(item.patrimonio)
    })).sort((a, b) => a.fecha - b.fecha);

    const resumen = datosMensuales.reduce(
      (acc, item) => ({
        ingresos: acc.ingresos + item.ingresos,
        egresos: acc.egresos + item.egresos,
        utilidad: acc.utilidad + item.utilidad,
        flujo: acc.flujo + item.flujo,
        datosMensuales
      }),
      { ingresos: 0, egresos: 0, utilidad: 0, flujo: 0, datosMensuales: [] }
    );

    setDatos({
      ...resumen,
      datosMensuales,
      ultimoMes: datosMensuales[datosMensuales.length - 1]
    });
  };

  // Aplicar filtros
  const aplicarFiltros = () => {
    if (!fechaInicio && !fechaFin) {
      setFiltroActivo(false);
      procesarDatos(datosCompletos);
      return;
    }

    const datosFiltrados = datosCompletos.filter(item => {
      const fechaItem = new Date(item.anio, item.mes - 1);
      return (
        (!fechaInicio || fechaItem >= fechaInicio) &&
        (!fechaFin || fechaItem <= fechaFin)
      );
    });

    setFiltroActivo(true);
    procesarDatos(datosFiltrados);
  };

  // Resetear filtros
  const resetearFiltros = () => {
    setFechaInicio(null);
    setFechaFin(null);
    setFiltroActivo(false);
    procesarDatos(datosCompletos);
  };

  // Configuración de gráficos
  const getChartOptions = (title) => ({
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: theme === 'dark' ? '#ffffff' : '#333333'
        }
      },
      title: {
        display: true,
        text: title,
        color: theme === 'dark' ? '#ffffff' : '#333333',
        font: {
          size: 16
        }
      },
      tooltip: {
        backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
        titleColor: theme === 'dark' ? '#00f7ff' : '#0a66c2',
        bodyColor: theme === 'dark' ? '#ffffff' : '#333333',
        borderColor: theme === 'dark' ? '#00f7ff' : '#0a66c2',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: {
          color: theme === 'dark' ? '#ffffff' : '#333333'
        },
        grid: {
          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        ticks: {
          color: theme === 'dark' ? '#ffffff' : '#333333'
        },
        grid: {
          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  });

  if (error) return <div className={styles.errorContainer}>Error: {error}</div>;
  if (loading) return <div className={styles.loadingContainer}>Cargando datos...</div>;
  if (!datos) return null;

  return (
    <div className={styles.dashboardContainer}>
      {/* Header con controles */}
      <header className={styles.dashboardHeader}>
        <div className={styles.headerTitle}>
          <h1>Dashboard Financiero</h1>
          {usandoDatosReferencia && (
            <div className={styles.warningTag}>
              <span>⚠️ Datos de referencia</span>
            </div>
          )}
          {filtroActivo && (
            <div className={styles.filterTag}>
              <span>Filtros activos</span>
            </div>
          )}
        </div>

        <div className={styles.headerControls}>
          <button
            className={`${styles.controlButton} ${mostrarFiltros ? styles.active : ''}`}
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
          >
            <FiFilter /> Filtros
          </button>

          <button className={styles.controlButton}>
            <FiDownload /> Exportar
          </button>

          <button
            className={styles.controlButton}
            onClick={() => window.location.reload()}
          >
            <FiRefreshCw /> Actualizar
          </button>
        </div>
      </header>

      {/* Panel de filtros */}
      {mostrarFiltros && (
        <div className={styles.filterPanel}>
          <div className={styles.filterGroup}>
            <label>Fecha Inicio:</label>
            <DatePicker
              selected={fechaInicio}
              onChange={(date) => setFechaInicio(date)}
              selectsStart
              startDate={fechaInicio}
              endDate={fechaFin}
              dateFormat="MM/yyyy"
              showMonthYearPicker
              className={styles.datePicker}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Fecha Fin:</label>
            <DatePicker
              selected={fechaFin}
              onChange={(date) => setFechaFin(date)}
              selectsEnd
              startDate={fechaInicio}
              endDate={fechaFin}
              minDate={fechaInicio}
              dateFormat="MM/yyyy"
              showMonthYearPicker
              className={styles.datePicker}
            />
          </div>

          <div className={styles.filterActions}>
            <button
              className={styles.applyButton}
              onClick={aplicarFiltros}
            >
              Aplicar Filtros
            </button>

            <button
              className={styles.resetButton}
              onClick={resetearFiltros}
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      )}

      <SummaryCard
        title="Ingresos Totales"
        value={datos.ingresos}
        change={datos.datosMensuales.length > 1 ?
          ((datos.datosMensuales[datos.datosMensuales.length - 1].ingresos -
            datos.datosMensuales[datos.datosMensuales.length - 2].ingresos) /
            datos.datosMensuales[datos.datosMensuales.length - 2].ingresos) * 100 : 0}
        icon="💰"
        type="income"
        styles={styles}
      />

      <SummaryCard
        title="Egresos Totales"
        value={datos.egresos}
        change={datos.datosMensuales.length > 1 ?
          ((datos.datosMensuales[datos.datosMensuales.length - 1].egresos -
            datos.datosMensuales[datos.datosMensuales.length - 2].egresos) /
            datos.datosMensuales[datos.datosMensuales.length - 2].egresos) * 100 : 0}
        icon="📉"
        type="expense"
        styles={styles}
      />

      <SummaryCard
        title="Utilidad Neta"
        value={datos.utilidad}
        change={datos.datosMensuales.length > 1 ?
          ((datos.datosMensuales[datos.datosMensuales.length - 1].utilidad -
            datos.datosMensuales[datos.datosMensuales.length - 2].utilidad) /
            datos.datosMensuales[datos.datosMensuales.length - 2].utilidad) * 100 : 0}
        icon="📊"
        type="profit"
        styles={styles}
      />

      <SummaryCard
        title="Flujo de Efectivo"
        value={datos.flujo}
        change={datos.datosMensuales.length > 1 ?
          ((datos.datosMensuales[datos.datosMensuales.length - 1].flujo -
            datos.datosMensuales[datos.datosMensuales.length - 2].flujo) /
            datos.datosMensuales[datos.datosMensuales.length - 2].flujo) * 100 : 0}
        icon="💵"
        type="cashflow"
        styles={styles}
      />


      {/* Gráficos principales */}
      <section className={styles.chartSection}>
        <div className={styles.mainChart}>
          <h2 className={styles.sectionTitle}>Evolución Financiera</h2>
          <div className={styles.chartContainer}>
            <Line
              data={{
                labels: datos.datosMensuales.map(item => item.mes),
                datasets: [
                  {
                    label: 'Ingresos',
                    data: datos.datosMensuales.map(item => item.ingresos),
                    borderColor: theme === 'dark' ? '#00f7ff' : '#0a66c2',
                    backgroundColor: theme === 'dark' ? 'rgba(0, 247, 255, 0.1)' : 'rgba(10, 102, 194, 0.1)',
                    tension: 0.3,
                    fill: true
                  },
                  {
                    label: 'Egresos',
                    data: datos.datosMensuales.map(item => item.egresos),
                    borderColor: theme === 'dark' ? '#ff3366' : '#d83b01',
                    backgroundColor: theme === 'dark' ? 'rgba(255, 51, 102, 0.1)' : 'rgba(216, 59, 1, 0.1)',
                    tension: 0.3,
                    fill: true
                  },
                  {
                    label: 'Utilidad',
                    data: datos.datosMensuales.map(item => item.utilidad),
                    borderColor: theme === 'dark' ? '#00ffaa' : '#107c10',
                    backgroundColor: theme === 'dark' ? 'rgba(0, 255, 170, 0.1)' : 'rgba(16, 124, 16, 0.1)',
                    tension: 0.3,
                    fill: true
                  }
                ]
              }}
              options={getChartOptions('Comparativo Mensual')}
            />
          </div>
        </div>

        <div className={styles.secondaryCharts}>
          <div className={styles.miniChart}>
            <h3 className={styles.chartTitle}>Distribución de Margen</h3>
            <div className={styles.chartWrapper}>
              <Pie
                data={{
                  labels: ['Margen Neto', 'Costos', 'Gastos'],
                  datasets: [{
                    data: [
                      datos.ultimoMes?.margen || 0,
                      100 - (datos.ultimoMes?.margen || 0) - 20,
                      20
                    ],
                    backgroundColor: [
                      theme === 'dark' ? '#00ffaa' : '#107c10',
                      theme === 'dark' ? '#ff3366' : '#d83b01',
                      theme === 'dark' ? '#ffcc00' : '#ffaa44'
                    ],
                    borderColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
                    borderWidth: 1
                  }]
                }}
                options={{
                  ...getChartOptions(''),
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className={styles.miniChart}>
            <h3 className={styles.chartTitle}>Balance General</h3>
            <div className={styles.chartWrapper}>
              <Bar
                data={{
                  labels: ['Activos', 'Pasivos', 'Patrimonio'],
                  datasets: [{
                    data: [
                      datos.ultimoMes?.activos || 0,
                      datos.ultimoMes?.pasivos || 0,
                      datos.ultimoMes?.patrimonio || 0
                    ],
                    backgroundColor: [
                      theme === 'dark' ? 'rgba(0, 247, 255, 0.7)' : 'rgba(10, 102, 194, 0.7)',
                      theme === 'dark' ? 'rgba(255, 51, 102, 0.7)' : 'rgba(216, 59, 1, 0.7)',
                      theme === 'dark' ? 'rgba(0, 255, 170, 0.7)' : 'rgba(16, 124, 16, 0.7)'
                    ],
                    borderColor: [
                      theme === 'dark' ? '#00f7ff' : '#0a66c2',
                      theme === 'dark' ? '#ff3366' : '#d83b01',
                      theme === 'dark' ? '#00ffaa' : '#107c10'
                    ],
                    borderWidth: 1
                  }]
                }}
                options={{
                  ...getChartOptions(''),
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tabla de detalle */}
      <section className={styles.detailSection}>
        <h2 className={styles.sectionTitle}>Detalle por Mes</h2>
        <div className={styles.tableContainer}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Mes/Año</th>
                <th>Ingresos</th>
                <th>Egresos</th>
                <th>Utilidad</th>
                <th>Margen %</th>
                <th>Flujo Efectivo</th>
              </tr>
            </thead>
            <tbody>
              {datos.datosMensuales.map((item, index) => (
                <tr key={index}>
                  <td>{item.mes}</td>
                  <td>${item.ingresos.toLocaleString('es-CO')}</td>
                  <td>${item.egresos.toLocaleString('es-CO')}</td>
                  <td>${item.utilidad.toLocaleString('es-CO')}</td>
                  <td>{item.margen.toFixed(2)}%</td>
                  <td>${item.flujo.toLocaleString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const SummaryCard = ({ title, value, change, icon, type, styles }) => {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  const getChangeClass = (val) => {
    if (val > 0) return styles.positiveChange;
    if (val < 0) return styles.negativeChange;
    return styles.neutralChange;
  };

  return (
    <div className={`${styles.summaryCard} ${styles[type]}`}>
      <div className={styles.cardHeader}>
        <span className={styles.cardIcon}>{icon}</span>
        <h3>{title}</h3>
      </div>
      <div className={styles.cardValue}>{formatCurrency(value)}</div>
      <div className={styles.cardFooter}>
        <span className={getChangeClass(change)}>
          {change > 0 ? '↑' : change < 0 ? '↓' : '→'} {Math.abs(change).toFixed(2)}%
        </span>
        <span>vs período anterior</span>
      </div>
    </div>
  );
};

export default DashboardFinanzas;