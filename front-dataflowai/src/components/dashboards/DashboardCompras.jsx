// src/components/dashboards/DashboardCompras.jsx
import React, { useEffect, useState } from 'react';
import { fetchDashboardCompras } from '../../api/DashboardsApis/DashboardCompras';
import { obtenerInfoUsuario } from '../../api/Usuario';
import { useTheme } from '../componentes/ThemeContext';
import darkStyles from '../../styles/Dashboards/DashboardCompras.module.css';
import lightStyles from '../../styles/Dashboards/DashboardComprasLight.module.css';

const DashboardComprasV2 = () => {
  const [datos, setDatos] = useState(null);
  const [datosDetallados, setDatosDetallados] = useState([]);
  const [error, setError] = useState(null);
  const [usandoDatosReferencia, setUsandoDatosReferencia] = useState(false);
  const [loading, setLoading] = useState(true);
  const [planId, setPlanId] = useState(null);
  const [filtroTiempo, setFiltroTiempo] = useState('mes');
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState('todos');

  const { theme } = useTheme();
  const [styles, setStyles] = useState(darkStyles);

  // Actualizar estilos basado en el plan y tema
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
        setLoading(true);
        const usuario = await obtenerInfoUsuario();
        const idEmpresaUsuario = usuario.empresa?.id;
        setPlanId(usuario.empresa?.plan?.id);

        const compras = await fetchDashboardCompras();

        let datosFiltrados = compras.filter(
          item => item.id_empresa === idEmpresaUsuario
        );

        if (datosFiltrados.length === 0) {
          datosFiltrados = compras.filter(item => item.id_empresa === 56);
          setUsandoDatosReferencia(true);
        }

        // Calcular métricas principales
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

        // Calcular datos adicionales para análisis
        const proveedores = [...new Set(datosFiltrados.map(item => item.proveedor))];
        const categorias = [...new Set(datosFiltrados.map(item => item.categoria))];
        
        // Análisis por proveedor
        const compraPorProveedor = proveedores.map(proveedor => {
          const comprasProveedor = datosFiltrados.filter(item => item.proveedor === proveedor);
          const totalProveedor = comprasProveedor.reduce((sum, item) => sum + parseFloat(item.valor_total), 0);
          return { proveedor, total: totalProveedor, cantidad: comprasProveedor.length };
        }).sort((a, b) => b.total - a.total);

        // Análisis por categoría
        const compraPorCategoria = categorias.map(categoria => {
          const comprasCategoria = datosFiltrados.filter(item => item.categoria === categoria);
          const totalCategoria = comprasCategoria.reduce((sum, item) => sum + parseFloat(item.valor_total), 0);
          return { categoria, total: totalCategoria, cantidad: comprasCategoria.length };
        }).sort((a, b) => b.total - a.total);

        // Análisis mensual
        const compraPorMes = datosFiltrados.reduce((acc, item) => {
          const mesAnio = `${item.mes}/${item.anio}`;
          if (!acc[mesAnio]) {
            acc[mesAnio] = { total: 0, cantidad: 0 };
          }
          acc[mesAnio].total += parseFloat(item.valor_total);
          acc[mesAnio].cantidad += parseInt(item.cantidad_comprada);
          return acc;
        }, {});

        const datosResumen = {
          totalCompras: resumen.totalCompras,
          totalCantidad: resumen.totalCantidad,
          promedioUnitario: resumen.contador > 0 ? resumen.promedioUnitario / resumen.contador : 0,
          tiempoEntregaPromedio: resumen.contador > 0 ? resumen.tiempoEntregaPromedio / resumen.contador : 0,
          totalProveedores: proveedores.length,
          totalCategorias: categorias.length,
          compraPorProveedor,
          compraPorCategoria,
          compraPorMes: Object.entries(compraPorMes).map(([mes, data]) => ({ mes, ...data })),
          proveedores
        };

        setDatos(datosResumen);
        setDatosDetallados(datosFiltrados);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Cargando dashboard de compras...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <h2 className={styles.errorTitle}>⚠️ Error</h2>
          <p className={styles.errorText}>{error}</p>
        </div>
      </div>
    );
  }

  const datosFiltradosPorProveedor = proveedorSeleccionado === 'todos' 
    ? datosDetallados 
    : datosDetallados.filter(item => item.proveedor === proveedorSeleccionado);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>
            <span className={styles.icon}>📊</span>
            Dashboard de Compras
          </h1>
          <p className={styles.subtitle}>Análisis completo de tus operaciones de compra</p>
        </div>

        {usandoDatosReferencia && (
          <div className={styles.warningBanner}>
            <span className={styles.warningIcon}>⚠️</span>
            <div className={styles.warningContent}>
              <h3 className={styles.warningTitle}>Datos de Referencia</h3>
              <p className={styles.warningText}>Estás viendo datos de demostración porque tu empresa aún no tiene registros.</p>
            </div>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className={styles.filtersContainer}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Proveedor:</label>
          <select 
            className={styles.filterSelect}
            value={proveedorSeleccionado}
            onChange={(e) => setProveedorSeleccionado(e.target.value)}
          >
            <option value="todos">Todos los proveedores</option>
            {datos.proveedores.map(proveedor => (
              <option key={proveedor} value={proveedor}>{proveedor}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Métricas principales */}
      <div className={styles.metricsGrid}>
        <MetricCard 
          styles={styles}
          icon="💰"
          title="Total Compras"
          value={`$${datos.totalCompras.toLocaleString('es-CO')}`}
          subtitle="Valor total invertido"
          trend="+12.5%"
          trendPositive={true}
        />
        <MetricCard 
          styles={styles}
          icon="📦"
          title="Total Unidades"
          value={datos.totalCantidad.toLocaleString('es-CO')}
          subtitle="Productos adquiridos"
          trend="+8.3%"
          trendPositive={true}
        />
        <MetricCard 
          styles={styles}
          icon="💲"
          title="Valor Unitario Promedio"
          value={`$${datos.promedioUnitario.toFixed(2)}`}
          subtitle="Costo promedio por unidad"
          trend="-2.1%"
          trendPositive={false}
        />
        <MetricCard 
          styles={styles}
          icon="⏱️"
          title="Tiempo de Entrega"
          value={`${datos.tiempoEntregaPromedio.toFixed(1)} días`}
          subtitle="Promedio de entrega"
          trend="-15.2%"
          trendPositive={true}
        />
        <MetricCard 
          styles={styles}
          icon="🏭"
          title="Proveedores Activos"
          value={datos.totalProveedores}
          subtitle="Proveedores únicos"
          trend="+3"
          trendPositive={true}
        />
        <MetricCard 
          styles={styles}
          icon="📋"
          title="Categorías"
          value={datos.totalCategorias}
          subtitle="Tipos de productos"
          trend="Estable"
          trendPositive={null}
        />
      </div>

      {/* Análisis detallado */}
      <div className={styles.analysisGrid}>
        {/* Top Proveedores */}
        <div className={styles.analysisCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>
              <span className={styles.cardIcon}>🏆</span>
              Top Proveedores
            </h3>
          </div>
          <div className={styles.cardContent}>
            {datos.compraPorProveedor.slice(0, 5).map((item, index) => (
              <div key={item.proveedor} className={styles.rankingItem}>
                <div className={styles.rankingPosition}>#{index + 1}</div>
                <div className={styles.rankingInfo}>
                  <span className={styles.rankingName}>{item.proveedor}</span>
                  <span className={styles.rankingValue}>
                    ${item.total.toLocaleString('es-CO')} ({item.cantidad} compras)
                  </span>
                </div>
                <div className={styles.rankingBar}>
                  <div 
                    className={styles.rankingProgress} 
                    style={{ 
                      width: `${(item.total / datos.compraPorProveedor[0].total) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Categorías */}
        <div className={styles.analysisCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>
              <span className={styles.cardIcon}>📊</span>
              Categorías Principales
            </h3>
          </div>
          <div className={styles.cardContent}>
            {datos.compraPorCategoria.slice(0, 5).map((item, index) => (
              <div key={item.categoria} className={styles.rankingItem}>
                <div className={styles.rankingPosition}>#{index + 1}</div>
                <div className={styles.rankingInfo}>
                  <span className={styles.rankingName}>{item.categoria}</span>
                  <span className={styles.rankingValue}>
                    ${item.total.toLocaleString('es-CO')} ({item.cantidad} compras)
                  </span>
                </div>
                <div className={styles.rankingBar}>
                  <div 
                    className={styles.rankingProgress} 
                    style={{ 
                      width: `${(item.total / datos.compraPorCategoria[0].total) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tendencia Mensual */}
        <div className={`${styles.analysisCard} ${styles.fullWidth}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>
              <span className={styles.cardIcon}>📈</span>
              Tendencia de Compras por Mes
            </h3>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.chartContainer}>
              {datos.compraPorMes.map((item, index) => (
                <div key={item.mes} className={styles.chartBar}>
                  <div 
                    className={styles.chartColumn}
                    style={{ 
                      height: `${(item.total / Math.max(...datos.compraPorMes.map(m => m.total))) * 100}%` 
                    }}
                  ></div>
                  <span className={styles.chartLabel}>{item.mes}</span>
                  <span className={styles.chartValue}>${(item.total / 1000000).toFixed(1)}M</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de compras recientes */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>
            <span className={styles.cardIcon}>📋</span>
            Compras Recientes
          </h3>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Proveedor</th>
                <th>Cantidad</th>
                <th>Valor Unitario</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {datosFiltradosPorProveedor.slice(0, 10).map((item, index) => (
                <tr key={index}>
                  <td>{new Date(item.fecha_compra).toLocaleDateString('es-CO')}</td>
                  <td>
                    <div className={styles.productCell}>
                      <span className={styles.productName}>{item.nombre_producto}</span>
                      <span className={styles.productCategory}>{item.categoria}</span>
                    </div>
                  </td>
                  <td>{item.proveedor}</td>
                  <td>{item.cantidad_comprada.toLocaleString()}</td>
                  <td>${parseFloat(item.valor_unitario).toLocaleString('es-CO')}</td>
                  <td className={styles.totalCell}>
                    ${parseFloat(item.valor_total).toLocaleString('es-CO')}
                  </td>
                  <td>
                    <span className={styles.statusBadge}>
                      {item.tiempo_entrega_dias <= 3 ? '🟢 Rápido' : 
                       item.tiempo_entrega_dias <= 7 ? '🟡 Normal' : '🔴 Lento'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ styles, icon, title, value, subtitle, trend, trendPositive }) => (
  <div className={styles.metricCard}>
    <div className={styles.metricHeader}>
      <span className={styles.metricIcon}>{icon}</span>
      <div className={styles.metricTrend}>
        {trend && (
          <span className={`${styles.trendValue} ${
            trendPositive === true ? styles.trendPositive : 
            trendPositive === false ? styles.trendNegative : styles.trendNeutral
          }`}>
            {trendPositive === true ? '↗️' : trendPositive === false ? '↘️' : '➡️'} {trend}
          </span>
        )}
      </div>
    </div>
    <div className={styles.metricContent}>
      <h3 className={styles.metricTitle}>{title}</h3>
      <p className={styles.metricValue}>{value}</p>
      <p className={styles.metricSubtitle}>{subtitle}</p>
    </div>
    <div className={styles.metricFooter}>
      <div className={styles.metricAccent}></div>
    </div>
  </div>
);

export default DashboardComprasV2;