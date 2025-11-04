import React, { useEffect, useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  Treemap,
} from 'recharts';
import styles from '../../styles/Dashboards/DashboardISPVentas.module.css';
import {
  getVentas,
  normalizeVentas,
  buildOptionsFromVentas,
  filterVentas,
  computeKPIsFromFiltered,
  computeExtendedKPIs,
  computeMonthlyAccumAndVar,
  computeDistributionByField,
  computeHierarchyData,
  getSegmentClass,
  getCategoryClass,
  getStatusClass,
  useClientesTable,
} from '../../api/DashboardsCrudApis/DashboardISPVentas';

// Componente de Treemap personalizado
function CustomizedTreemapContent(props) {
  const { x, y, width, height, name, value, index } = props;
  const colors = ['#00B43F', '#2CAF47', '#3EAA4F', '#4CA556', '#57A05D', '#609B63', '#689669', '#6F916F'];
  const bg = colors[index % colors.length];
  const padding = 8;
  const fontSize = Math.max(11, Math.min(15, Math.floor(width / 10)));
  const showName = width > 70 && height > 25;
  const showValue = width > 90 && height > 40;

  return (
    <g>
      <rect 
        x={x} 
        y={y} 
        width={width} 
        height={height} 
        style={{ 
          fill: bg, 
          stroke: '#e0e0e0', 
          strokeWidth: 2,
          opacity: 0.9
        }} 
      />
      {showName && (
        <text 
          x={x + padding} 
          y={y + padding + fontSize} 
          fill="#ffffff" 
          fontSize={fontSize} 
          fontWeight={700}
          style={{ pointerEvents: 'none' }}
        >
          {String(name).length > 20 ? String(name).slice(0, 20) + '...' : name}
        </text>
      )}
      {showValue && (
        <text 
          x={x + padding} 
          y={y + padding + fontSize + 18} 
          fill="#ffffff" 
          fontSize={Math.max(10, fontSize - 2)}
          fontWeight={600}
          style={{ pointerEvents: 'none' }}
        >
          ${Number(value || 0).toLocaleString('es-CO')}
        </text>
      )}
    </g>
  );
}


// Tooltip personalizado
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.customTooltip}>
        <p className={styles.tooltipLabel}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className={styles.tooltipValue}>
            {entry.name}: {
              entry.name.includes('%') || entry.name.includes('Var') 
                ? `${Number(entry.value).toFixed(2)}%`
                : `$${Number(entry.value).toLocaleString('es-CO')}`
            }
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardISPVenta() {
  const [rawVentas, setRawVentas] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    fecha_from: '',
    fecha_to: '',
    categoria_cliente: '',
    ciudad: '',
    segmento: '',
    nombre_plan: '',
    categoria_plan: '',
    estado_suscripcion: '',
    metodo_pago: '',
  });

  const cargarVentas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getVentas();
      setRawVentas(data || []);
      const normalized = normalizeVentas(data || []);
      setVentas(normalized);
    } catch (err) {
      console.error('Error cargando ventas:', err);
      setError(String(err.message || err));
      setRawVentas([]);
      setVentas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarVentas(); }, []);

  const options = useMemo(() => buildOptionsFromVentas(ventas), [ventas]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      fecha_from: '',
      fecha_to: '',
      categoria_cliente: '',
      ciudad: '',
      segmento: '',
      nombre_plan: '',
      categoria_plan: '',
      estado_suscripcion: '',
      metodo_pago: '',
    });
  };

  const filteredVentas = useMemo(() => filterVentas(ventas, filters), [ventas, filters]);
  const kpis = useMemo(() => computeKPIsFromFiltered(filteredVentas), [filteredVentas]);
  const extended = useMemo(() => computeExtendedKPIs(ventas, filteredVentas, filters), [ventas, filteredVentas, filters]);
  const chartData = useMemo(() => computeMonthlyAccumAndVar(filteredVentas), [filteredVentas]);
  const distributionCategoria = useMemo(() => computeDistributionByField(filteredVentas, 'categoria_plan'), [filteredVentas]);
  const hierarchyData = useMemo(() => computeHierarchyData(filteredVentas), [filteredVentas]);

  // Hook para la tabla
  const {
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    handleSort,
    renderSortIcon,
    filteredTableData,
    totalPages,
    currentItems
  } = useClientesTable(filteredVentas);

  const COLORS = ['#00B43F', '#2CAF47', '#3EAA4F', '#4CA556', '#57A05D', '#609B63', '#689669', '#6F916F'];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.titulo}>
            <span className={styles.tituloIcon}>📊</span>
            Dashboard ISP Ventas
            <span className={styles.badge}>v1.0</span>
          </h1>
          <div className={styles.headerDate}>
            {new Date().toLocaleDateString('es-CO', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.errorAlert}>
          <span className={styles.errorIcon}>⚠️</span>
          {error}
        </div>
      )}

      {/* Panel de filtros */}
      <div className={styles.filtersPanel}>
        <div className={styles.filtersSectionTitle}>
          <span className={styles.filterIcon}>🔍</span>
          Filtros de búsqueda
        </div>
        
        <div className={styles.filtersGrid}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <span className={styles.labelIcon}>📅</span>
              Fecha desde
            </label>
            <input
              type="date"
              className={styles.filterInput}
              value={filters.fecha_from}
              onChange={e => handleFilterChange('fecha_from', e.target.value)}
            />
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <span className={styles.labelIcon}>📅</span>
              Fecha hasta
            </label>
            <input
              type="date"
              className={styles.filterInput}
              value={filters.fecha_to}
              onChange={e => handleFilterChange('fecha_to', e.target.value)}
            />
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <span className={styles.labelIcon}>👥</span>
              Categoría cliente
            </label>
            <select 
              value={filters.categoria_cliente} 
              onChange={e => handleFilterChange('categoria_cliente', e.target.value)} 
              className={styles.filterSelect}
            >
              <option value=''>Todos</option>
              {options.categoria_clientes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <span className={styles.labelIcon}>📍</span>
              Ciudad
            </label>
            <select 
              value={filters.ciudad} 
              onChange={e => handleFilterChange('ciudad', e.target.value)} 
              className={styles.filterSelect}
            >
              <option value=''>Todas</option>
              {options.ciudades.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <span className={styles.labelIcon}>🎯</span>
              Segmento
            </label>
            <select 
              value={filters.segmento} 
              onChange={e => handleFilterChange('segmento', e.target.value)} 
              className={styles.filterSelect}
            >
              <option value=''>Todos</option>
              {options.segmentos.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <span className={styles.labelIcon}>📦</span>
              Nombre plan
            </label>
            <select 
              value={filters.nombre_plan} 
              onChange={e => handleFilterChange('nombre_plan', e.target.value)} 
              className={styles.filterSelect}
            >
              <option value=''>Todos</option>
              {options.nombres_plan.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <span className={styles.labelIcon}>🏷️</span>
              Categoría plan
            </label>
            <select 
              value={filters.categoria_plan} 
              onChange={e => handleFilterChange('categoria_plan', e.target.value)} 
              className={styles.filterSelect}
            >
              <option value=''>Todos</option>
              {options.categorias_plan.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <span className={styles.labelIcon}>✓</span>
              Estado suscripción
            </label>
            <select 
              value={filters.estado_suscripcion} 
              onChange={e => handleFilterChange('estado_suscripcion', e.target.value)} 
              className={styles.filterSelect}
            >
              <option value=''>Todos</option>
              {options.estados_suscripcion.map(es => <option key={es} value={es}>{es}</option>)}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <span className={styles.labelIcon}>💳</span>
              Método pago
            </label>
            <select 
              value={filters.metodo_pago} 
              onChange={e => handleFilterChange('metodo_pago', e.target.value)} 
              className={styles.filterSelect}
            >
              <option value=''>Todos</option>
              {options.metodos_pago.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.filterActions}>
          <button className={styles.btnPrimary} onClick={cargarVentas} disabled={loading}>
            <span className={styles.btnIcon}>🔄</span>
            {loading ? 'Cargando...' : 'Refrescar datos'}
          </button>
          <button className={styles.btnSecondary} onClick={clearFilters}>
            <span className={styles.btnIcon}>✕</span>
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>👥</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiLabel}>Clientes Activos</div>
            <div className={styles.kpiValue}>
              {loading ? '...' : kpis.totalClientes.toLocaleString('es-CO')}
            </div>
            <div className={styles.kpiSub}>{filteredVentas.length.toLocaleString('es-CO')} registros</div>
          </div>
          <div className={styles.kpiGlow}></div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>⚠️</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiLabel}>Clientes Cancelados</div>
            <div className={styles.kpiValue}>
              {loading ? '...' : (kpis.customersCanceled ?? 0).toLocaleString('es-CO')}
            </div>
            <div className={styles.kpiSub}>Estado: Cancelada</div>
          </div>
          <div className={styles.kpiGlow}></div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>💰</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiLabel}>Total Facturado</div>
            <div className={styles.kpiValue}>
              {loading ? '...' : `$${kpis.totalFacturado.toLocaleString('es-CO', { minimumFractionDigits: 0 })}`}
            </div>
            <div className={styles.kpiSub}>Suma total período</div>
          </div>
          <div className={styles.kpiGlow}></div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>📉</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiLabel}>Churn Rate</div>
            <div className={styles.kpiValue}>
              {loading ? '...' : `${(extended.churnRate * 100).toFixed(2)}%`}
            </div>
            <div className={styles.kpiSub}>Tasa de cancelación</div>
          </div>
          <div className={styles.kpiGlow}></div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>📈</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiLabel}>MRR</div>
            <div className={styles.kpiValue}>
              {loading ? '...' : `$${extended.MRR.toLocaleString('es-CO', { minimumFractionDigits: 0 })}`}
            </div>
            <div className={styles.kpiSub}>Monthly Recurring Revenue</div>
          </div>
          <div className={styles.kpiGlow}></div>
        </div>
      </div>

      {/* Gráfico principal */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>
            <span className={styles.chartIcon}>📊</span>
            Tendencia de Facturación Mensual
          </h3>
          <div className={styles.chartLegendCustom}>
            <span className={styles.legendItem}>
              <span className={styles.legendBar}></span>
              Total Mensual
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendLine}></span>
              Variación %
            </span>
          </div>
        </div>
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00B43F" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#2CAF47" stopOpacity={0.6}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 11, fill: '#6c757d' }} 
                stroke="#e0e0e0"
              />
              <YAxis 
                yAxisId="left" 
                orientation="left" 
                tickFormatter={(v) => v >= 1000 ? (v/1000).toFixed(1) + 'k' : v}
                tick={{ fontSize: 11, fill: '#6c757d' }}
                stroke="#e0e0e0"
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                domain={['auto', 'auto']}
                tickFormatter={(v) => `${Number(v).toFixed(0)}%`}
                tick={{ fontSize: 11, fill: '#6c757d' }}
                stroke="#e0e0e0"
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                yAxisId="left" 
                dataKey="monthly_total" 
                name="Total mes" 
                fill="url(#colorBar)"
                barSize={28}
                radius={[8, 8, 0, 0]}
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="var_pct" 
                stroke="#00B43F" 
                strokeWidth={3} 
                dot={{ r: 5, fill: '#00B43F', strokeWidth: 2, stroke: '#ffffff' }} 
                name="Var % mensual"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid de gráficos inferiores */}
      <div className={styles.analyticsGrid}>
        {/* Panel izquierdo: Pie chart distribucion por categoria_plan */}
        <div className={styles.analyticsCard}>
          <h3 className={styles.analyticsTitle}>Distribución por categoría de plan</h3>
          <div className={styles.analyticsContentRow}>
            <div className={styles.pieWrapper}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distributionCategoria.slice(0,8)}
                    dataKey="total"
                    nameKey="key"
                    innerRadius={48}
                    outerRadius={88}
                    paddingAngle={2}
                    labelLine={false}
                  >
                    {distributionCategoria.slice(0,8).map((entry, idx) => (
                      <Cell 
                        key={`cell-${idx}`} 
                        fill={['#10b981','#06b6d4','#f59e0b','#ef4444','#8b5cf6','#3b82f6','#84cc16','#f97316'][idx % 8]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => {
                      const v = Number(value || 0);
                      return [`$ ${v.toLocaleString(undefined, { minimumFractionDigits: 0 })}`, name];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* resumen: top items */}
            <div className={styles.summaryList}>
              {distributionCategoria.slice(0,8).map((row, i) => (
                <div key={row.key} className={styles.summaryItem}>
                  <div className={styles.summaryLeft}>
                    <span 
                      className={styles.colorBox} 
                      style={{ 
                        background: ['#10b981','#06b6d4','#f59e0b','#ef4444','#8b5cf6','#3b82f6','#84cc16','#f97316'][i % 8] 
                      }} 
                    />
                    <div className={styles.summaryKey}>{row.key}</div>
                  </div>
                  <div className={styles.summaryRight}>
                    <div className={styles.summaryTotal}>
                      ${row.total.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </div>
                    <div className={styles.summaryPct}>{row.pct.toFixed(1)}%</div>
                  </div>
                </div>
              ))}

              {distributionCategoria.length === 0 && (
                <div className={styles.noData}>No hay datos para mostrar.</div>
              )}
            </div>
          </div>
        </div>

        {/* Treemap jerárquico */}
        <div className={styles.analyticsCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>
              <span className={styles.chartIcon}>🗺️</span>
              Mapa de Ventas por Ciudad
            </h3>
          </div>
          <div className={styles.treemapWrapper}>
            <ResponsiveContainer width="100%" height={300}>
              <Treemap
                data={hierarchyData.hierarchy[0]?.children || []}
                dataKey="value"
                ratio={4 / 3}
                stroke="#0a0e1a"
                strokeWidth={2}
                isAnimationActive={false}
                content={<CustomizedTreemapContent />}
              />
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>
            <span className={styles.tableIcon}>📋</span>
            Resumen Detallado de Clientes
          </h3>
          <div className={styles.tableControls}>
            <div className={styles.tableSearch}>
              <input
                type="text"
                placeholder="Buscar cliente..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className={styles.searchIcon}>🔍</span>
            </div>
            <div className={styles.tableStats}>
              <span className={styles.statItem}>
                Mostrando {currentItems.length} de {filteredTableData.length} registros
              </span>
            </div>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th 
                  className={styles.sortableHeader}
                  onClick={() => handleSort('nombre_cliente')}
                >
                  Cliente {renderSortIcon('nombre_cliente')}
                </th>
                <th 
                  className={styles.sortableHeader}
                  onClick={() => handleSort('monto_facturado')}
                >
                  Total Facturado {renderSortIcon('monto_facturado')}
                </th>
                <th 
                  className={styles.sortableHeader}
                  onClick={() => handleSort('ciudad')}
                >
                  Ciudad {renderSortIcon('ciudad')}
                </th>
                <th 
                  className={styles.sortableHeader}
                  onClick={() => handleSort('segmento')}
                >
                  Segmento {renderSortIcon('segmento')}
                </th>
                <th 
                  className={styles.sortableHeader}
                  onClick={() => handleSort('nombre_plan')}
                >
                  Plan {renderSortIcon('nombre_plan')}
                </th>
                <th 
                  className={styles.sortableHeader}
                  onClick={() => handleSort('categoria_plan')}
                >
                  Categoría Plan {renderSortIcon('categoria_plan')}
                </th>
                <th 
                  className={styles.sortableHeader}
                  onClick={() => handleSort('fecha_inicio')}
                >
                  Fecha Inicio {renderSortIcon('fecha_inicio')}
                </th>
                <th 
                  className={styles.sortableHeader}
                  onClick={() => handleSort('estado_suscripcion')}
                >
                  Estado {renderSortIcon('estado_suscripcion')}
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((venta, index) => (
                <tr key={`${venta.id || index}-${venta.nombre_cliente}`} className={styles.tableRow}>
                  <td className={styles.clientCell}>
                    <div className={styles.clientInfo}>
                      <div className={styles.clientName}>{venta.nombre_cliente || 'N/A'}</div>
                      {venta.email && (
                        <div className={styles.clientEmail}>{venta.email}</div>
                      )}
                    </div>
                  </td>
                  <td className={styles.amountCell}>
                    <div className={styles.amountValue}>
                      ${Number(venta.monto_facturado || 0).toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                    </div>
                  </td>
                  <td className={styles.cityCell}>
                    <span className={styles.cityBadge}>{venta.ciudad || 'N/A'}</span>
                  </td>
                  <td className={styles.segmentCell}>
                    <span className={`${styles.segmentBadge} ${getSegmentClass(venta.segmento, styles)}`}>
                      {venta.segmento || 'N/A'}
                    </span>
                  </td>
                  <td className={styles.planCell}>{venta.nombre_plan || 'N/A'}</td>
                  <td className={styles.categoryCell}>
                    <span className={`${styles.categoryBadge} ${getCategoryClass(venta.categoria_plan, styles)}`}>
                      {venta.categoria_plan || 'N/A'}
                    </span>
                  </td>
                  <td className={styles.dateCell}>
                    {venta.fecha_inicio ? new Date(venta.fecha_inicio).toLocaleDateString('es-CO') : 'N/A'}
                  </td>
                  <td className={styles.statusCell}>
                    <span className={`${styles.statusBadge} ${getStatusClass(venta.estado_suscripcion, styles)}`}>
                      {venta.estado_suscripcion || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {currentItems.length === 0 && (
            <div className={styles.noData}>
              <div className={styles.noDataIcon}>📭</div>
              <div className={styles.noDataText}>
                No se encontraron registros con los filtros actuales
              </div>
            </div>
          )}
        </div>

        {/* Paginación */}
        {filteredTableData.length > itemsPerPage && (
          <div className={styles.pagination}>
            <button 
              className={styles.paginationBtn}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              ‹ Anterior
            </button>
            
            <div className={styles.paginationInfo}>
              Página {currentPage} de {totalPages}
            </div>

            <button 
              className={styles.paginationBtn}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Siguiente ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}