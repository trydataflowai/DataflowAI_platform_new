import React, { useState, useEffect, useMemo } from 'react';
import { fetchDashboardData } from '../../api/DashboardPrueba';
import styles from '../../styles/DashboardPrueba.module.css';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid, Legend, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { DatePicker, Select, Spin, Table, Card, Statistic, Tag, Progress, Empty } from 'antd';
import {
  DollarOutlined, ShopOutlined, RiseOutlined, FallOutlined,
  CalendarOutlined, FilterOutlined, SyncOutlined, DashboardOutlined,
  BarChartOutlined, PieChartOutlined, LineChartOutlined, DotChartOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { RangePicker } = DatePicker;
const { Option } = Select;

// Paleta de colores premium
const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', '#F59E0B', '#10B981'];

// Estructura inicial para processedData
const initialProcessedData = {
  chartData: [],
  lineChartData: [],
  topPuntosVenta: [],
  byPuntoVenta: {},
  totalVentas: 0,
  totalTransacciones: 0,
  puntosVentaCount: 0,
  minDate: null,
  maxDate: null
};

export const DashboardPrueba = () => {
  const [rawData, setRawData] = useState([]);
  const [filter, setFilter] = useState({
    dateRange: null,
    puntoVenta: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('sales');
  const [dataRange, setDataRange] = useState({
    minDate: null,
    maxDate: null
  });

  // Carga inicial
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await fetchDashboardData();
      setRawData(json || []);
      
      // Calcular rango de fechas de los datos
      if (json && json.length > 0) {
        const dates = json.map(item => moment(item.fecha_entrega)).filter(d => d.isValid());
        const minDate = moment.min(dates);
        const maxDate = moment.max(dates);
        
        setDataRange({ minDate, maxDate });
        setFilter(prev => ({
          ...prev,
          dateRange: [minDate, maxDate]
        }));
      }
    } catch (e) {
      setError(e.message);
      setRawData([]);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    if (!filter.dateRange) return;
    
    setLoading(true);
    setError(null);
    try {
      const start = filter.dateRange[0].format('YYYY-MM-DD');
      const end = filter.dateRange[1].format('YYYY-MM-DD');
      const json = await fetchDashboardData(start, end);
      setRawData(json || []);
    } catch (e) {
      setError(e.message);
      setRawData([]);
    } finally {
      setLoading(false);
    }
  };

  // Datos procesados
  const processedData = useMemo(() => {
    if (!rawData.length) return initialProcessedData;

    // Agrupar por punto de venta
    const byPuntoVenta = rawData.reduce((acc, row) => {
      if (!row.punto_venta) return acc;
      
      if (!acc[row.punto_venta]) {
        acc[row.punto_venta] = {
          totalDinero: 0,
          totalCantidad: 0,
          fechas: [],
          detalles: []
        };
      }
      acc[row.punto_venta].totalDinero += row.dinero_entregado || 0;
      acc[row.punto_venta].totalCantidad += row.cantidad_entregada || 0;
      acc[row.punto_venta].fechas.push(row.fecha_entrega);
      acc[row.punto_venta].detalles.push(row);
      return acc;
    }, {});

    // Datos para gráficos
    const chartData = Object.entries(byPuntoVenta).map(([punto_venta, data]) => ({
      punto_venta,
      id_punto_venta: data.detalles[0]?.id_punto_venta || punto_venta,
      total: data.totalDinero,
      cantidad: data.totalCantidad,
      promedio: data.totalCantidad > 0 ? data.totalDinero / data.totalCantidad : 0,
      transacciones: data.detalles.length
    }));

    // Datos para gráfico de línea temporal
    const dailySales = rawData.reduce((acc, row) => {
      if (!row.fecha_entrega) return acc;
      const date = row.fecha_entrega;
      acc[date] = (acc[date] || 0) + (row.dinero_entregado || 0);
      return acc;
    }, {});

    const lineChartData = Object.entries(dailySales)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Top puntos de venta (máximo 10 para mejor visualización)
    const topPuntosVenta = [...chartData]
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Calcular fechas mínimas y máximas de los datos actuales
    const currentDates = rawData.map(item => moment(item.fecha_entrega)).filter(d => d.isValid());
    const currentMinDate = currentDates.length ? moment.min(currentDates) : null;
    const currentMaxDate = currentDates.length ? moment.max(currentDates) : null;

    return {
      chartData,
      lineChartData,
      topPuntosVenta,
      byPuntoVenta,
      totalVentas: chartData.reduce((sum, d) => sum + d.total, 0),
      totalTransacciones: chartData.reduce((sum, d) => sum + d.transacciones, 0),
      puntosVentaCount: chartData.length,
      minDate: currentMinDate,
      maxDate: currentMaxDate
    };
  }, [rawData]);

  // Columnas para la tabla
  const columns = [
    {
      title: 'ID Punto',
      dataIndex: 'id_punto_venta',
      key: 'id_punto_venta',
      width: 120,
      sorter: (a, b) => (a.id_punto_venta || '').localeCompare(b.id_punto_venta || ''),
    },
    {
      title: 'Punto de Venta',
      dataIndex: 'punto_venta',
      key: 'punto_venta',
      sorter: (a, b) => (a.punto_venta || '').localeCompare(b.punto_venta || ''),
    },
    {
      title: 'Total Ventas',
      dataIndex: 'total',
      key: 'total',
      render: (text) => `$${text?.toLocaleString() || '0'}`,
      sorter: (a, b) => (a.total || 0) - (b.total || 0),
    },
    {
      title: 'Cantidad',
      dataIndex: 'cantidad',
      key: 'cantidad',
      sorter: (a, b) => (a.cantidad || 0) - (b.cantidad || 0),
    },
    {
      title: 'Promedio',
      dataIndex: 'promedio',
      key: 'promedio',
      render: (text) => `$${(text || 0).toFixed(2)}`,
      sorter: (a, b) => (a.promedio || 0) - (b.promedio || 0),
    },
    {
      title: 'Transacciones',
      dataIndex: 'transacciones',
      key: 'transacciones',
      sorter: (a, b) => (a.transacciones || 0) - (b.transacciones || 0),
    },
  ];

  // Manejar cambio de fecha
  const handleDateChange = (dates) => {
    if (!dates || dates.length !== 2) {
      setFilter(prev => ({ ...prev, dateRange: null }));
      return;
    }
    
    // Asegurarse de que las fechas estén dentro del rango de datos
    const adjustedDates = [
      moment.max(dates[0], dataRange.minDate),
      moment.min(dates[1], dataRange.maxDate)
    ];
    
    setFilter(prev => ({ ...prev, dateRange: adjustedDates }));
  };

  if (loading && !rawData.length) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" tip="Cargando datos iniciales..." />
      </div>
    );
  }

  return (
    <div className={styles.dashboardPremium}>
      <div className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.logo}>DF</div>
          <h1 className={styles.title}>
            <span className={styles.brandName}>DataFlow</span>AI Dashboard
          </h1>
        </div>
        <div className={styles.controls}>
          <RangePicker
            value={filter.dateRange}
            onChange={handleDateChange}
            style={{ width: 250 }}
            disabled={loading || !dataRange.minDate}
            allowClear={false}
            disabledDate={(current) => {
              if (!dataRange.minDate || !dataRange.maxDate) return true;
              return current && (
                current < dataRange.minDate.startOf('day') || 
                current > dataRange.maxDate.endOf('day')
              );
            }}
          />
          <Select
            placeholder="Filtrar por punto de venta"
            style={{ width: 250 }}
            allowClear
            onChange={(value) => setFilter({ ...filter, puntoVenta: value })}
            disabled={loading}
            value={filter.puntoVenta}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {processedData.chartData?.map((item) => (
              <Option key={item.punto_venta} value={item.punto_venta}>
                {item.id_punto_venta} - {item.punto_venta}
              </Option>
            ))}
          </Select>
          <button
            onClick={loadData}
            disabled={loading || !filter.dateRange}
            className={styles.filterButton}
          >
            {loading ? <SyncOutlined spin /> : <FilterOutlined />}
            {loading ? 'Cargando...' : 'Aplicar Filtros'}
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.errorAlert}>
          <Tag color="red">Error: {error}</Tag>
        </div>
      )}

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'sales' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          <DashboardOutlined /> Resumen
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'details' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('details')}
        >
          <ShopOutlined /> Puntos de Venta
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'analytics' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChartOutlined /> Análisis
        </button>
      </div>

      {activeTab === 'sales' && (
        <div className={styles.salesTab}>
          <div className={styles.metricsRow}>
            <Card className={styles.metricCard} hoverable>
              <Statistic
                title="Total Ventas"
                value={processedData.totalVentas}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#10B981' }}
                formatter={(value) => `$${value.toLocaleString()}`}
              />
              <div className={styles.trend}>
                <RiseOutlined /> 12% vs período anterior
              </div>
            </Card>

            <Card className={styles.metricCard} hoverable>
              <Statistic
                title="Puntos de Venta"
                value={processedData.puntosVentaCount}
                prefix={<ShopOutlined />}
                valueStyle={{ color: '#6366F1' }}
              />
              <div className={styles.trend}>
                <RiseOutlined /> 3 nuevos este mes
              </div>
            </Card>

            <Card className={styles.metricCard} hoverable>
              <Statistic
                title="Transacciones"
                value={processedData.totalTransacciones}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#8B5CF6' }}
              />
              <div className={styles.trend}>
                <FallOutlined /> 5% menos que el mes pasado
              </div>
            </Card>

            <Card className={styles.metricCard} hoverable>
              <Statistic
                title="Ticket Promedio"
                value={
                  processedData.chartData.length > 0
                    ? processedData.chartData.reduce((sum, d) => sum + d.promedio, 0) /
                      processedData.chartData.length
                    : 0
                }
                prefix={<DollarOutlined />}
                precision={2}
                valueStyle={{ color: '#EC4899' }}
              />
              <div className={styles.trend}>
                <RiseOutlined /> 8% más que el promedio histórico
              </div>
            </Card>
          </div>

          <div className={styles.chartRow}>
            <Card 
              title="Ventas por Punto de Venta" 
              className={styles.chartCard}
              extra={<Tag color="purple">Últimos 30 días</Tag>}
            >
              <ResponsiveContainer width="100%" height={400}>
                {processedData.chartData.length > 0 ? (
                  <BarChart
                    data={processedData.chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    barSize={30}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="punto_venta" 
                      angle={-45} 
                      textAnchor="end" 
                      height={60}
                      tick={{ fontSize: 12 }}
                      interval={0}
                    />
                    <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                    <Tooltip 
                      formatter={(value) => [`$${value.toLocaleString()}`, 'Total Ventas']}
                      contentStyle={{
                        background: 'rgba(255, 255, 255, 0.96)',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="total" 
                      name="Total Ventas" 
                      fill="#6366F1"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                ) : (
                  <Empty description="No hay datos para mostrar" />
                )}
              </ResponsiveContainer>
            </Card>

            <Card 
              title="Distribución de Ventas" 
              className={styles.chartCard}
              extra={<Tag color="cyan">Top 10</Tag>}
            >
              <ResponsiveContainer width="100%" height={400}>
                {processedData.topPuntosVenta.length > 0 ? (
                  <PieChart>
                    <Pie
                      data={processedData.topPuntosVenta}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={120}
                      innerRadius={60}
                      fill="#8884d8"
                      dataKey="total"
                      nameKey="punto_venta"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {processedData.topPuntosVenta.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`$${value.toLocaleString()}`, 'Total Ventas']}
                      contentStyle={{
                        background: 'rgba(255, 255, 255, 0.96)',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                      }}
                    />
                    <Legend 
                      layout="vertical" 
                      align="right" 
                      verticalAlign="middle"
                      wrapperStyle={{ right: -20 }}
                    />
                  </PieChart>
                ) : (
                  <Empty description="No hay datos para mostrar" />
                )}
              </ResponsiveContainer>
            </Card>
          </div>

          <Card 
            title="Detalle de Ventas" 
            className={styles.tableCard}
            extra={
              <span className={styles.tableSummary}>
                Mostrando {Math.min(processedData.chartData.length, 5)} de {processedData.chartData.length} puntos de venta
              </span>
            }
          >
            <Table
              columns={columns}
              dataSource={processedData.chartData}
              rowKey="punto_venta"
              pagination={{ 
                pageSize: 5,
                showSizeChanger: false,
                showTotal: (total) => `Total ${total} puntos de venta`
              }}
              scroll={{ x: true }}
              loading={loading}
              locale={{
                emptyText: <Empty description="No hay datos para mostrar" />
              }}
            />
          </Card>
        </div>
      )}

      {activeTab === 'details' && (
        <div className={styles.detailsTab}>
          <Card title="Análisis por Punto de Venta" className={styles.sectionCard}>
            <div className={styles.puntoVentaSelector}>
              <Select
                placeholder="Seleccione un punto de venta"
                style={{ width: '100%', maxWidth: '400px' }}
                onChange={(value) => setFilter({ ...filter, puntoVenta: value })}
                value={filter.puntoVenta}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {processedData.chartData?.map((item) => (
                  <Option key={item.punto_venta} value={item.punto_venta}>
                    {item.id_punto_venta} - {item.punto_venta}
                  </Option>
                ))}
              </Select>
            </div>

            {filter.puntoVenta && processedData.byPuntoVenta[filter.puntoVenta] ? (
              <>
                <div className={styles.puntoVentaMetrics}>
                  <Card className={styles.pvCard} hoverable>
                    <Statistic
                      title="Total Ventas"
                      value={processedData.byPuntoVenta[filter.puntoVenta].totalDinero}
                      prefix={<DollarOutlined />}
                      valueStyle={{ color: '#10B981' }}
                      formatter={(value) => `$${value.toLocaleString()}`}
                    />
                  </Card>

                  <Card className={styles.pvCard} hoverable>
                    <Statistic
                      title="Cantidad Total Entregada"
                      value={processedData.byPuntoVenta[filter.puntoVenta].totalCantidad}
                      valueStyle={{ color: '#6366F1' }}
                    />
                  </Card>

                  <Card className={styles.pvCard} hoverable>
                    <Statistic
                      title="Promedio por Entrega"
                      value={
                        processedData.byPuntoVenta[filter.puntoVenta].detalles.length > 0
                          ? processedData.byPuntoVenta[filter.puntoVenta].totalDinero /
                            processedData.byPuntoVenta[filter.puntoVenta].detalles.length
                          : 0
                      }
                      prefix={<DollarOutlined />}
                      precision={2}
                      valueStyle={{ color: '#EC4899' }}
                    />
                  </Card>

                  <Card className={styles.pvCard} hoverable>
                    <Statistic
                      title="Transacciones"
                      value={processedData.byPuntoVenta[filter.puntoVenta].detalles.length}
                      valueStyle={{ color: '#8B5CF6' }}
                    />
                  </Card>
                </div>

                <div className={styles.puntoVentaCharts}>
                  <Card title="Ventas Diarias" className={styles.pvChart}>
                    <ResponsiveContainer width="100%" height={300}>
                      {processedData.lineChartData.filter((item) =>
                        processedData.byPuntoVenta[filter.puntoVenta].fechas.includes(item.date)
                      ).length > 0 ? (
                        <LineChart
                          data={processedData.lineChartData.filter((item) =>
                            processedData.byPuntoVenta[filter.puntoVenta].fechas.includes(item.date)
                          )}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" />
                          <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                          <Tooltip 
                            formatter={(value) => [`$${value.toLocaleString()}`, 'Ventas']}
                            contentStyle={{
                              background: 'rgba(255, 255, 255, 0.96)',
                              border: 'none',
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="total"
                            stroke="#6366F1"
                            strokeWidth={2}
                            activeDot={{ r: 8 }}
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      ) : (
                        <Empty description="No hay datos para mostrar" />
                      )}
                    </ResponsiveContainer>
                  </Card>

                  <Card title="Relación Cantidad vs Ventas" className={styles.pvChart}>
                    <ResponsiveContainer width="100%" height={300}>
                      {processedData.byPuntoVenta[filter.puntoVenta].detalles.length > 0 ? (
                        <ScatterChart
                          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis type="number" dataKey="cantidad_entregada" name="Cantidad" />
                          <YAxis type="number" dataKey="dinero_entregado" name="Ventas" />
                          <ZAxis type="number" range={[60, 400]} />
                          <Tooltip
                            formatter={(value, name) => [
                              name === 'Ventas' ? `$${value}` : value,
                              name,
                            ]}
                            contentStyle={{
                              background: 'rgba(255, 255, 255, 0.96)',
                              border: 'none',
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                            }}
                          />
                          <Legend />
                          <Scatter
                            name="Entregas"
                            data={processedData.byPuntoVenta[filter.puntoVenta].detalles}
                            fill="#6366F1"
                            shape="circle"
                          />
                        </ScatterChart>
                      ) : (
                        <Empty description="No hay datos para mostrar" />
                      )}
                    </ResponsiveContainer>
                  </Card>
                </div>

                <Card 
                  title="Historial de Entregas" 
                  className={styles.tableCard}
                  extra={
                    <span className={styles.tableSummary}>
                      Mostrando {Math.min(processedData.byPuntoVenta[filter.puntoVenta].detalles.length, 5)} de {processedData.byPuntoVenta[filter.puntoVenta].detalles.length} transacciones
                    </span>
                  }
                >
                  <Table
                    columns={[
                      { 
                        title: 'Fecha', 
                        dataIndex: 'fecha_entrega', 
                        key: 'fecha',
                        sorter: (a, b) => new Date(a.fecha_entrega) - new Date(b.fecha_entrega)
                      },
                      {
                        title: 'Dinero Entregado',
                        dataIndex: 'dinero_entregado',
                        key: 'dinero',
                        render: (text) => `$${text?.toLocaleString() || '0'}`,
                        sorter: (a, b) => (a.dinero_entregado || 0) - (b.dinero_entregado || 0),
                      },
                      { 
                        title: 'Cantidad Entregada', 
                        dataIndex: 'cantidad_entregada',
                        key: 'cantidad',
                        sorter: (a, b) => (a.cantidad_entregada || 0) - (b.cantidad_entregada || 0),
                      },
                    ]}
                    dataSource={processedData.byPuntoVenta[filter.puntoVenta].detalles}
                    rowKey="id_registro"
                    pagination={{ 
                      pageSize: 5,
                      showSizeChanger: false
                    }}
                  />
                </Card>
              </>
            ) : (
              <Empty 
                description={
                  filter.puntoVenta 
                    ? "No se encontraron datos para este punto de venta" 
                    : "Seleccione un punto de venta para ver los detalles"
                }
                style={{ margin: '40px 0' }}
              />
            )}
          </Card>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className={styles.analyticsTab}>
          <Card title="Análisis Avanzado" className={styles.sectionCard}>
            <div className={styles.analyticsRow}>
              <Card title="Tendencia de Ventas" className={styles.analyticsChart}>
                <ResponsiveContainer width="100%" height={300}>
                  {processedData.lineChartData.length > 0 ? (
                    <LineChart data={processedData.lineChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                      <Tooltip 
                        formatter={(value) => [`$${value.toLocaleString()}`, 'Ventas']}
                        contentStyle={{
                          background: 'rgba(255, 255, 255, 0.96)',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#6366F1"
                        name="Ventas Diarias"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  ) : (
                    <Empty description="No hay datos para mostrar" />
                  )}
                </ResponsiveContainer>
              </Card>

              <Card title="Comparativa de Puntos de Venta" className={styles.analyticsChart}>
                <ResponsiveContainer width="100%" height={300}>
                  {processedData.chartData.length > 0 ? (
                    <BarChart
                      data={processedData.chartData.slice(0, 10)} // Mostrar solo los primeros 10 para mejor visualización
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tickFormatter={(value) => `$${value.toLocaleString()}`} />
                      <YAxis 
                        type="category" 
                        dataKey="punto_venta" 
                        width={100} 
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value) => [`$${value.toLocaleString()}`, 'Total Ventas']}
                        contentStyle={{
                          background: 'rgba(255, 255, 255, 0.96)',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="total" 
                        name="Total Ventas" 
                        fill="#6366F1"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  ) : (
                    <Empty description="No hay datos para mostrar" />
                  )}
                </ResponsiveContainer>
              </Card>
            </div>

            <div className={styles.analyticsRow}>
              <Card title="Distribución por Día de la Semana" className={styles.analyticsChart}>
                <ResponsiveContainer width="100%" height={300}>
                  {rawData.length > 0 ? (
                    <BarChart
                      data={Object.entries(
                        rawData.reduce((acc, row) => {
                          if (!row.fecha_entrega) return acc;
                          const day = moment(row.fecha_entrega).format('dddd');
                          acc[day] = (acc[day] || 0) + (row.dinero_entregado || 0);
                          return acc;
                        }, {})
                      ).map(([day, total]) => ({ day, total }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="day" />
                      <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                      <Tooltip 
                        formatter={(value) => [`$${value.toLocaleString()}`, 'Ventas']}
                        contentStyle={{
                          background: 'rgba(255, 255, 255, 0.96)',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                        }}
                      />
                      <Bar 
                        dataKey="total" 
                        name="Ventas" 
                        fill="#6366F1"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  ) : (
                    <Empty description="No hay datos para mostrar" />
                  )}
                </ResponsiveContainer>
              </Card>

              <Card title="Eficiencia por Punto de Venta" className={styles.analyticsChart}>
                <ResponsiveContainer width="100%" height={300}>
                  {processedData.chartData.length > 0 ? (
                    <ScatterChart
                      margin={{ top: 20, right: 20, bottom: 20, left: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        type="number" 
                        dataKey="transacciones" 
                        name="Transacciones" 
                        label={{ value: 'Transacciones', position: 'insideBottomRight', offset: 0 }}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="total" 
                        name="Ventas" 
                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                      />
                      <ZAxis 
                        type="number" 
                        dataKey="promedio" 
                        range={[60, 400]} 
                        name="Ticket Promedio" 
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          name === 'Ventas'
                            ? `$${value}`
                            : name === 'Ticket Promedio'
                            ? `$${Number(value).toFixed(2)}`
                            : value,
                          name,
                        ]}
                        contentStyle={{
                          background: 'rgba(255, 255, 255, 0.96)',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                        }}
                      />
                      <Legend />
                      <Scatter
                        name="Puntos de Venta"
                        data={processedData.chartData}
                        fill="#6366F1"
                        shape="circle"
                      />
                    </ScatterChart>
                  ) : (
                    <Empty description="No hay datos para mostrar" />
                  )}
                </ResponsiveContainer>
              </Card>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};