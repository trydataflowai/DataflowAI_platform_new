import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { fetchDashboardCompras } from '../../api/DashboardsApis/DashboardCompras';

const ApacheEcharts = () => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchDashboardCompras();
        setChartData(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  // Process data for charts
  const barChartData = chartData.reduce((acc, item) => {
    const date = item.fecha_compra;
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += parseFloat(item.valor_total);
    return acc;
  }, {});

  const lineChartData = chartData.reduce((acc, item) => {
    const date = item.fecha_compra;
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += item.cantidad_comprada;
    return acc;
  }, {});

  const pieChartData = chartData.reduce((acc, item) => {
    const year = item.anio;
    if (!acc[year]) {
      acc[year] = 0;
    }
    acc[year] += parseFloat(item.valor_total);
    return acc;
  }, {});

  const comparisonChartData = chartData.reduce((acc, item) => {
    const provider = item.proveedor;
    if (!acc[provider]) {
      acc[provider] = 0;
    }
    acc[provider] += parseFloat(item.valor_total);
    return acc;
  }, {});

  // Bar chart options
  const barChartOptions = {
    xAxis: {
      type: 'category',
      data: Object.keys(barChartData)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        data: Object.values(barChartData),
        type: 'bar'
      }
    ]
  };

  // Line chart options
  const lineChartOptions = {
    xAxis: {
      type: 'category',
      data: Object.keys(lineChartData)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        data: Object.values(lineChartData),
        type: 'line',
        smooth: true
      }
    ]
  };

  // Pie chart options
  const pieChartOptions = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      top: '5%',
      left: 'center'
    },
    series: [
      {
        name: 'Ventas por año',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        padAngle: 5,
        itemStyle: {
          borderRadius: 10
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 18,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: Object.entries(pieChartData).map(([year, value]) => ({
          value,
          name: year.toString()
        }))
      }
    ]
  };

  // Comparison chart options
  const comparisonChartOptions = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: Object.keys(comparisonChartData)
    },
    series: [
      {
        name: 'Compras',
        type: 'bar',
        data: Object.values(comparisonChartData)
      }
    ]
  };

  // Table data
  const tableData = chartData.map(item => ({
    proveedor: item.proveedor,
    cantidad_comprada: item.cantidad_comprada,
    nombre_producto: item.nombre_producto,
    subcategoria: item.subcategoria,
    marca: item.marca
  }));

  return (
    <div>
      <h1>Dashboard de Compras</h1>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ width: '45%' }}>
          <h2>Ventas por fecha</h2>
          <ReactECharts option={barChartOptions} />
        </div>
        
        <div style={{ width: '45%' }}>
          <h2>Cantidades por fecha</h2>
          <ReactECharts option={lineChartOptions} />
        </div>
        
        <div style={{ width: '45%' }}>
          <h2>Ventas por año</h2>
          <ReactECharts option={pieChartOptions} />
        </div>
        
        <div style={{ width: '45%' }}>
          <h2>Compras por proveedor</h2>
          <ReactECharts option={comparisonChartOptions} />
        </div>
      </div>
      
      <div style={{ marginTop: '40px' }}>
        <h2>Tabla de compras</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Proveedor</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Cantidad</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Producto</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Subcategoría</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Marca</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((item, index) => (
              <tr key={index}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.proveedor}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.cantidad_comprada}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.nombre_producto}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.subcategoria}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.marca}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ApacheEcharts;