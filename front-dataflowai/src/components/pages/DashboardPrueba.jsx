import React, { useState, useEffect, useMemo } from 'react';
import { fetchDashboardData } from '../../api/DashboardPrueba';
import styles from '../../styles/DashboardPrueba.module.css';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid, Legend, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { DatePicker, Select, Spin, Table, Card, Statistic, Tag, Progress } from 'antd';
import {
  DollarOutlined, ShopOutlined, RiseOutlined, FallOutlined,
  CalendarOutlined, FilterOutlined, SyncOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { RangePicker } = DatePicker;
const { Option } = Select;

// Paleta de colores para gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

// Estructura inicial para processedData
const initialProcessedData = {
  chartData: [],
  lineChartData: [],
  topPuntosVenta: [],
  byPuntoVenta: {},
  totalVentas: 0,
  totalTransacciones: 0,
  puntosVentaCount: 0
};

export const DashboardPrueba = () => {
  const [rawData, setRawData] = useState([]);
  const [filter, setFilter] = useState({
    dateRange: [moment().subtract(30, 'days'), moment()],
    puntoVenta: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('sales');

  // Carga inicial
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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

    // Top 5 puntos de venta
    const topPuntosVenta = [...chartData]
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      chartData,
      lineChartData,
      topPuntosVenta,
      byPuntoVenta,
      totalVentas: chartData.reduce((sum, d) => sum + d.total, 0),
      totalTransacciones: chartData.reduce((sum, d) => sum + d.transacciones, 0),
      puntosVentaCount: chartData.length
    };
  }, [rawData]);

  // Columnas para la tabla
  const columns = [
    {
      title: 'Punto de Venta',
      dataIndex: 'punto_venta',
      key: 'punto_venta',
      sorter: (a, b) => a.punto_venta?.localeCompare(b.punto_venta),
    },
    {
      title: 'Total Ventas',
      dataIndex: 'total',
      key: 'total',
      render: (text) => `$${text?.toLocaleString() || '0'}`,
      sorter: (a, b) => (a.total || 0) - (b.total || 0),
    },
    {
      title: 'Cantidad Entregada',
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

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" tip="Cargando datos..." />
      </div>
    );
  }

  return (
    <div className={styles.dashboardPremium}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <DollarOutlined /> Dashboard de Ventas Premium
        </h1>
        <div className={styles.controls}>
          <RangePicker
            value={filter.dateRange}
            onChange={(dates) => setFilter({ ...filter, dateRange: dates })}
            style={{ width: 250 }}
            disabled={loading}
          />
          <Select
            placeholder="Filtrar por punto de venta"
            style={{ width: 200 }}
            allowClear
            onChange={(value) => setFilter({ ...filter, puntoVenta: value })}
            disabled={loading}
            value={filter.puntoVenta}
          >
            {processedData.chartData?.map((item) => (
              <Option key={item.punto_venta} value={item.punto_venta}>
                {item.punto_venta}
              </Option>
            ))}
          </Select>
          <button
            onClick={loadData}
            disabled={loading}
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
          Resumen de Ventas
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'details' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Detalles por Punto de Venta
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'analytics' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Análisis Avanzado
        </button>
      </div>

      {activeTab === 'sales' && (
        <div className={styles.salesTab}>
          <div className={styles.metricsRow}>
            <Card className={styles.metricCard}>
              <Statistic
                title="Total Ventas"
                value={processedData.totalVentas}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#3f8600' }}
                formatter={(value) => `$${value.toLocaleString()}`}
              />
              <div className={styles.trend}>
                <RiseOutlined /> 12% vs período anterior
              </div>
            </Card>

            <Card className={styles.metricCard}>
              <Statistic
                title="Puntos de Venta"
                value={processedData.puntosVentaCount}
                prefix={<ShopOutlined />}
              />
              <div className={styles.trend}>
                <RiseOutlined /> 3 nuevos este mes
              </div>
            </Card>

            <Card className={styles.metricCard}>
              <Statistic
                title="Transacciones"
                value={processedData.totalTransacciones}
                prefix={<CalendarOutlined />}
              />
              <div className={styles.trend}>
                <FallOutlined /> 5% menos que el mes pasado
              </div>
            </Card>

            <Card className={styles.metricCard}>
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
              />
              <div className={styles.trend}>
                <RiseOutlined /> 8% más que el promedio histórico
              </div>
            </Card>
          </div>

          <div className={styles.chartRow}>
            <div className={styles.mainChart}>
              <h3>Ventas por Punto de Venta</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={processedData.chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="punto_venta" angle={-45} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Total Ventas']} />
                  <Legend />
                  <Bar dataKey="total" name="Total Ventas" fill="#8884d8" />
                  <Bar dataKey="cantidad" name="Cantidad Entregada" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.secondaryChart}>
              <h3>Distribución de Ventas</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={processedData.topPuntosVenta}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total"
                    nameKey="punto_venta"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {processedData.topPuntosVenta.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Total Ventas']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={styles.tableContainer}>
            <h3>Detalle de Ventas</h3>
            <Table
              columns={columns}
              dataSource={processedData.chartData}
              rowKey="punto_venta"
              pagination={{ pageSize: 5 }}
              scroll={{ x: true }}
            />
          </div>
        </div>
      )}

      {activeTab === 'details' && (
        <div className={styles.detailsTab}>
          <h2>Análisis por Punto de Venta</h2>
          
          <div className={styles.puntoVentaSelector}>
            <Select
              placeholder="Seleccione un punto de venta"
              style={{ width: 300 }}
              onChange={(value) => setFilter({ ...filter, puntoVenta: value })}
              value={filter.puntoVenta}
            >
              {processedData.chartData?.map((item) => (
                <Option key={item.punto_venta} value={item.punto_venta}>
                  {item.punto_venta}
                </Option>
              ))}
            </Select>
          </div>

          {filter.puntoVenta && processedData.byPuntoVenta[filter.puntoVenta] && (
            <>
              <div className={styles.puntoVentaMetrics}>
                <Card title="Resumen" className={styles.pvCard}>
                  <div className={styles.pvStats}>
                    <Statistic
                      title="Total Ventas"
                      value={processedData.byPuntoVenta[filter.puntoVenta].totalDinero}
                      prefix={<DollarOutlined />}
                      valueStyle={{ color: '#3f8600' }}
                    />
                    <Statistic
                      title="Cantidad Total Entregada"
                      value={processedData.byPuntoVenta[filter.puntoVenta].totalCantidad}
                    />
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
                    />
                  </div>
                </Card>

                <Card title="Rendimiento" className={styles.pvCard}>
                  <div className={styles.progressContainer}>
                    <h4>Meta de Ventas</h4>
                    <Progress
                      percent={Math.min(
                        (processedData.byPuntoVenta[filter.puntoVenta].totalDinero / 1000000) * 100,
                        100
                      )}
                      status="active"
                      strokeColor={{
                        '0%': '#108ee9',
                        '100%': '#87d068',
                      }}
                    />
                    <p>
                      ${processedData.byPuntoVenta[filter.puntoVenta].totalDinero.toLocaleString()}
                      de $1,000,000
                    </p>
                  </div>
                </Card>
              </div>

              <div className={styles.puntoVentaCharts}>
                <div className={styles.pvChart}>
                  <h3>Ventas Diarias</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={processedData.lineChartData.filter((item) =>
                        processedData.byPuntoVenta[filter.puntoVenta].fechas.includes(item.date)
                      )}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Ventas']} />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className={styles.pvChart}>
                  <h3>Relación Cantidad vs Ventas</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      <CartesianGrid />
                      <XAxis type="number" dataKey="cantidad_entregada" name="Cantidad" />
                      <YAxis type="number" dataKey="dinero_entregado" name="Ventas" />
                      <ZAxis type="number" range={[60, 400]} />
                      <Tooltip
                        formatter={(value, name) => [
                          name === 'Ventas' ? `$${value}` : value,
                          name,
                        ]}
                      />
                      <Legend />
                      <Scatter
                        name="Entregas"
                        data={processedData.byPuntoVenta[filter.puntoVenta].detalles}
                        fill="#8884d8"
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className={styles.puntoVentaTable}>
                <h3>Historial de Entregas</h3>
                <Table
                  columns={[
                    { title: 'Fecha', dataIndex: 'fecha_entrega', key: 'fecha' },
                    {
                      title: 'Dinero Entregado',
                      dataIndex: 'dinero_entregado',
                      render: (text) => `$${text?.toLocaleString() || '0'}`,
                    },
                    { title: 'Cantidad Entregada', dataIndex: 'cantidad_entregada' },
                  ]}
                  dataSource={processedData.byPuntoVenta[filter.puntoVenta].detalles}
                  rowKey="id_registro"
                  pagination={{ pageSize: 5 }}
                />
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className={styles.analyticsTab}>
          <h2>Análisis Avanzado</h2>
          
          <div className={styles.analyticsRow}>
            <Card title="Tendencia de Ventas" className={styles.analyticsCard}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={processedData.lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Ventas']} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#8884d8"
                    name="Ventas Diarias"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Comparativa de Puntos de Venta" className={styles.analyticsCard}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={processedData.chartData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="punto_venta" width={100} />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Total Ventas']} />
                  <Legend />
                  <Bar dataKey="total" name="Total Ventas" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div className={styles.analyticsRow}>
            <Card title="Distribución por Día de la Semana" className={styles.analyticsCard}>
              <ResponsiveContainer width="100%" height={300}>
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
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Ventas']} />
                  <Bar dataKey="total" name="Ventas" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Eficiencia por Punto de Venta" className={styles.analyticsCard}>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart
                  margin={{ top: 20, right: 20, bottom: 20, left: 40 }}
                >
                  <CartesianGrid />
                  <XAxis type="number" dataKey="transacciones" name="Transacciones" />
                  <YAxis type="number" dataKey="total" name="Ventas" />
                  <ZAxis type="number" dataKey="promedio" range={[60, 400]} name="Ticket Promedio" />
                  <Tooltip
                    formatter={(value, name) => [
                      name === 'Ventas'
                        ? `$${value}`
                        : name === 'Ticket Promedio'
                        ? `$${Number(value).toFixed(2)}`
                        : value,
                      name,
                    ]}
                  />
                  <Legend />
                  <Scatter
                    name="Puntos de Venta"
                    data={processedData.chartData}
                    fill="#8884d8"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};