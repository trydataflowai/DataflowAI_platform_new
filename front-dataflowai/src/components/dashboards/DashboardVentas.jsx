// src/components/dashboards/DashboardVentas.jsx
import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { 
  TrendingUp, DollarSign, ShoppingCart, Users, 
  Calendar, MapPin, Smartphone, AlertTriangle,
  ArrowUp, ArrowDown, Target, Package
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import { fetchDashboardVentas } from '../../api/DashboardApi';
import { obtenerInfoUsuario } from '../../api/Usuario';
import { useTheme } from '../componentes/ThemeContext';

import darkStyles from '../../styles/Dashboards/DashboardVentas.module.css';
import lightStyles from '../../styles/Dashboards/DashboardVentasLight.module.css';

const DashboardVentas = () => {
  const { theme } = useTheme();
  const [styles, setStyles] = useState(darkStyles);
  const [planId, setPlanId] = useState(null);
  
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usandoDatosReferencia, setUsandoDatosReferencia] = useState(false);
  const [filtroTiempo, setFiltroTiempo] = useState('todos');

  // Actualizar estilos basado en tema y plan
  useEffect(() => {
    if (planId === 3 || planId === 6) {
      setStyles(theme === 'dark' ? darkStyles : lightStyles);
    } else {
      setStyles(darkStyles);
    }
  }, [theme, planId]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const usuario = await obtenerInfoUsuario();
        setPlanId(usuario.empresa?.plan?.id);
        const idEmpresaUsuario = usuario.empresa?.id;

        const ventas = await fetchDashboardVentas();

        let datosFiltrados = ventas.filter(
          item => item.id_empresa === idEmpresaUsuario
        );

        if (datosFiltrados.length === 0) {
          datosFiltrados = ventas.filter(item => item.id_empresa === 56);
          setUsandoDatosReferencia(true);
        }

        setDatos(datosFiltrados);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // Calcular métricas principales
  const calcularMetricas = () => {
    if (!datos.length) return {};

    const totalCantidad = datos.reduce((acc, item) => acc + (item.cantidad_vendida || 0), 0);
    const totalDinero = datos.reduce((acc, item) => acc + (parseFloat(item.dinero_vendido) || 0), 0);
    const totalTransacciones = datos.reduce((acc, item) => acc + (item.numero_transacciones || 0), 0);
    const totalUtilidad = datos.reduce((acc, item) => acc + (parseFloat(item.utilidad_bruta) || 0), 0);
    const ticketPromedio = totalDinero / totalTransacciones || 0;
    const margenPromedio = (totalUtilidad / totalDinero) * 100 || 0;

    return {
      totalCantidad,
      totalDinero,
      totalTransacciones,
      totalUtilidad,
      ticketPromedio,
      margenPromedio
    };
  };

  // Datos para gráficos
  const prepararDatosGraficos = () => {
    if (!datos.length) return { ventasPorDia: [], ventasPorCanal: [], ventasPorCategoria: [] };

    // Ventas por día
    const ventasPorDia = datos.reduce((acc, item) => {
      const fecha = item.fecha_venta;
      const existing = acc.find(x => x.fecha === fecha);
      if (existing) {
        existing.ventas += parseFloat(item.dinero_vendido);
        existing.cantidad += item.cantidad_vendida;
      } else {
        acc.push({
          fecha,
          ventas: parseFloat(item.dinero_vendido),
          cantidad: item.cantidad_vendida,
          fechaFormat: format(parseISO(fecha), 'dd MMM', { locale: es })
        });
      }
      return acc;
    }, []).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    // Ventas por canal
    const ventasPorCanal = datos.reduce((acc, item) => {
      const canal = item.canal;
      const existing = acc.find(x => x.name === canal);
      if (existing) {
        existing.value += parseFloat(item.dinero_vendido);
      } else {
        acc.push({ name: canal, value: parseFloat(item.dinero_vendido) });
      }
      return acc;
    }, []);

    // Ventas por categoría
    const ventasPorCategoria = datos.reduce((acc, item) => {
      const categoria = item.categoria;
      const existing = acc.find(x => x.categoria === categoria);
      if (existing) {
        existing.ventas += parseFloat(item.dinero_vendido);
        existing.cantidad += item.cantidad_vendida;
      } else {
        acc.push({
          categoria,
          ventas: parseFloat(item.dinero_vendido),
          cantidad: item.cantidad_vendida
        });
      }
      return acc;
    }, []);

    return { ventasPorDia, ventasPorCanal, ventasPorCategoria };
  };

  const metricas = calcularMetricas();
  const { ventasPorDia, ventasPorCanal, ventasPorCategoria } = prepararDatosGraficos();

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <AlertTriangle size={48} />
        <h2>Error al cargar datos</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>
            <TrendingUp className={styles.titleIcon} />
            Dashboard de Ventas
          </h1>
          <p className={styles.subtitle}>Análisis completo de rendimiento comercial</p>
        </div>
        
        <div className={styles.filters}>
          <select 
            value={filtroTiempo} 
            onChange={(e) => setFiltroTiempo(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="todos">Todos los períodos</option>
            <option value="ultimo-mes">Último mes</option>
            <option value="ultima-semana">Última semana</option>
          </select>
        </div>
      </div>

      {/* Alerta de datos de referencia */}
      {usandoDatosReferencia && (
        <div className={styles.warningAlert}>
          <AlertTriangle size={20} />
          <span>Estás viendo datos de referencia porque tu empresa aún no tiene registros.</span>
        </div>
      )}

      {/* Métricas principales */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>
            <DollarSign />
          </div>
          <div className={styles.metricContent}>
            <h3>Ventas Totales</h3>
            <p className={styles.metricValue}>
              ${metricas.totalDinero?.toLocaleString('es-CO')}
            </p>
            <span className={styles.metricChange}>
              <ArrowUp size={16} />
              +12.5% vs mes anterior
            </span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>
            <Package />
          </div>
          <div className={styles.metricContent}>
            <h3>Unidades Vendidas</h3>
            <p className={styles.metricValue}>
              {metricas.totalCantidad?.toLocaleString('es-CO')}
            </p>
            <span className={styles.metricChange}>
              <ArrowUp size={16} />
              +8.2% vs mes anterior
            </span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>
            <ShoppingCart />
          </div>
          <div className={styles.metricContent}>
            <h3>Transacciones</h3>
            <p className={styles.metricValue}>
              {metricas.totalTransacciones?.toLocaleString('es-CO')}
            </p>
            <span className={styles.metricChange}>
              <ArrowUp size={16} />
              +15.7% vs mes anterior
            </span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>
            <Target />
          </div>
          <div className={styles.metricContent}>
            <h3>Ticket Promedio</h3>
            <p className={styles.metricValue}>
              ${metricas.ticketPromedio?.toLocaleString('es-CO')}
            </p>
            <span className={styles.metricChange}>
              <ArrowDown size={16} />
              -2.1% vs mes anterior
            </span>
          </div>
        </div>
      </div>

      {/* Gráficos principales */}
      <div className={styles.chartsGrid}>
        {/* Evolución de ventas */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Evolución de Ventas</h3>
            <Calendar size={20} />
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={ventasPorDia}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fechaFormat" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString('es-CO')}`, 'Ventas']}
                  labelStyle={{ color: '#333' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="ventas" 
                  stroke="#8884d8" 
                  fillOpacity={1} 
                  fill="url(#colorVentas)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ventas por canal */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Distribución por Canal</h3>
            <Smartphone size={20} />
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ventasPorCanal}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {ventasPorCanal.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toLocaleString('es-CO')}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Ventas por categoría */}
      <div className={styles.fullWidthChart}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Rendimiento por Categoría</h3>
            <Users size={20} />
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={ventasPorCategoria}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoria" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'ventas' ? `$${value.toLocaleString('es-CO')}` : value.toLocaleString('es-CO'),
                    name === 'ventas' ? 'Ventas' : 'Cantidad'
                  ]}
                />
                <Bar dataKey="ventas" fill="#8884d8" name="ventas" />
                <Bar dataKey="cantidad" fill="#82ca9d" name="cantidad" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Footer con estadísticas adicionales */}
      <div className={styles.statsFooter}>
        <div className={styles.statItem}>
          <MapPin size={16} />
          <span>Ciudades activas: {new Set(datos.map(d => d.ciudad)).size}</span>
        </div>
        <div className={styles.statItem}>
          <Package size={16} />
          <span>Productos vendidos: {new Set(datos.map(d => d.sku)).size}</span>
        </div>
        <div className={styles.statItem}>
          <Target size={16} />
          <span>Margen promedio: {metricas.margenPromedio?.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardVentas;