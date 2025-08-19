// src/components/dashboards/SalesDashboard.jsx
import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { fetchDashboardSales } from '../../api/DashboardsApis/SalesDashboard';
import { obtenerInfoUsuario } from '../../api/Usuario';

const SalesDashboard = () => {
  const [rawData, setRawData] = useState([]);
  const [data, setData] = useState([]); // datos filtrados por empresa (o demo)
  const [usandoDatosReferencia, setUsandoDatosReferencia] = useState(false);
  const DEMO_COMPANY_ID = 56; // id a usar si no hay datos de la empresa del usuario

  useEffect(() => {
    async function load() {
      try {
        const usuario = await obtenerInfoUsuario();
        const idEmpresaUsuario = usuario?.empresa?.id;

        const all = await fetchDashboardSales(); // llama a tu API sin filtros (puedes pasar fechas si quieres)
        setRawData(all || []);

        let filtered = [];
        if (idEmpresaUsuario !== undefined && idEmpresaUsuario !== null) {
          filtered = (all || []).filter((it) => it.id_empresa === idEmpresaUsuario);
        }

        if (!filtered || filtered.length === 0) {
          // usar datos de referencia
          filtered = (all || []).filter((it) => it.id_empresa === DEMO_COMPANY_ID);
          if (filtered && filtered.length > 0) {
            setUsandoDatosReferencia(true);
          } else {
            // si tampoco hay datos demo, usa todo el set original
            filtered = all || [];
            setUsandoDatosReferencia(true);
          }
        }

        setData(filtered);
      } catch (err) {
        console.error('Error cargando datos del dashboard:', err);
        // En caso de error, dejamos data vacío
        setRawData([]);
        setData([]);
      }
    }

    load();
  }, []);

  // --- Helpers para agrupar y sumar montos (sales_amount viene como string) ---
  const toNumber = (v) => {
    if (v === null || v === undefined) return 0;
    const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[,]/g, ''));
    return isNaN(n) ? 0 : n;
  };

  // Line chart: ventas por mes (label: "YYYY-MM")
  const buildLineOption = () => {
    // agrupar por year-month
    const map = {};
    data.forEach((r) => {
      const year = r.year ?? new Date(r.sale_date).getFullYear();
      const month = r.month ?? (new Date(r.sale_date).getMonth() + 1);
      const key = `${year}-${String(month).padStart(2, '0')}`;
      map[key] = (map[key] || 0) + toNumber(r.sales_amount);
    });

    // ordenar keys
    const keys = Object.keys(map).sort();
    const values = keys.map((k) => map[k]);

    return {
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: keys.length ? keys : ['No data']
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          data: values.length ? values : [0],
          type: 'line',
          areaStyle: {}
        }
      ],
      tooltip: { trigger: 'axis' }
    };
  };

  // Bar chart: ventas por producto en el año más reciente del set (por producto_name)
  const buildBarOption = () => {
    if (!data || data.length === 0) {
      return {
        xAxis: { type: 'category', data: ['No data'] },
        yAxis: { type: 'value' },
        series: [{ data: [0], type: 'bar' }]
      };
    }

    const years = [...new Set(data.map((r) => r.year ?? new Date(r.sale_date).getFullYear()))].map(Number);
    const targetYear = Math.max(...years);

    const map = {};
    data.forEach((r) => {
      const y = r.year ?? new Date(r.sale_date).getFullYear();
      if (Number(y) !== Number(targetYear)) return;
      const prod = r.product_name ?? r.sku ?? 'Unknown';
      map[prod] = (map[prod] || 0) + toNumber(r.sales_amount);
    });

    const products = Object.keys(map).sort((a, b) => map[b] - map[a]); // ordenar por valor descendente
    const values = products.map((p) => map[p]);

    return {
      xAxis: { type: 'category', data: products.length ? products : ['No data'] },
      yAxis: { type: 'value' },
      series: [{ data: values.length ? values : [0], type: 'bar' }],
      tooltip: { trigger: 'axis' },
      title: { text: `Ventas por producto (${targetYear})`, left: 'center' }
    };
  };

  // Pie chart: ventas por año (suma de sales_amount por year)
  const buildPieOption = () => {
    const map = {};
    data.forEach((r) => {
      const y = r.year ?? new Date(r.sale_date).getFullYear();
      map[y] = (map[y] || 0) + toNumber(r.sales_amount);
    });

    const pieData = Object.keys(map).map((k) => ({ value: map[k], name: String(k) }));

    return {
      tooltip: { trigger: 'item' },
      legend: { top: '5%', left: 'center' },
      series: [
        {
          name: 'Ventas por año',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          padAngle: 5,
          itemStyle: { borderRadius: 10 },
          label: { show: false, position: 'center' },
          emphasis: { label: { show: true, fontSize: 18, fontWeight: 'bold' } },
          labelLine: { show: false },
          data: pieData.length ? pieData : [{ value: 0, name: 'No data' }]
        }
      ]
    };
  };

  // columnas solicitadas para la tabla (usé exactamente los campos que enviaste)
  const columns = [
    'id_registro',
    'id_empresa',
    'id_producto',
    'point_of_sale_id',
    'point_of_sale',
    'channel',
    'city',
    'region',
    'quantity_sold',
    'sales_amount',
    'average_ticket',
    'promoted_units',
    'total_discount',
    'number_transactions',
    'returns',
    'return_amount',
    'sale_date',
    'month',
    'year',
    'weekday',
    'hour',
    'sku',
    'product_name',
    'category',
    'subcategory',
    'brand',
    'customer_type',
    'customer_segment',
    'customer_gender',
    'customer_age',
    'gross_profit',
    'total_cost',
    'profit_margin',
    'notes'
  ];

  return (
    <div style={{ padding: 10 }}>
      <h2>Dashboard de Ventas</h2>

      {usandoDatosReferencia && (
        <div style={{ border: '1px solid #f5c6cb', background: '#fff0f0', padding: 10, marginBottom: 12 }}>
          <strong>⚠️ Datos de Referencia</strong>
          <div>
            Estás viendo datos de demostración (empresa id = {DEMO_COMPANY_ID}) porque tu empresa no tiene registros asociados.
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        <div>
          <h3>Ventas — línea por mes</h3>
          <ReactECharts option={buildLineOption()} style={{ height: 300 }} />
        </div>

        <div>
          <h3>Ventas por producto (barra) — año seleccionado automáticamente</h3>
          <ReactECharts option={buildBarOption()} style={{ height: 320 }} />
        </div>

        <div>
          <h3>Ventas por año (torta)</h3>
          <ReactECharts option={buildPieOption()} style={{ height: 320 }} />
        </div>

        <div>
          <h3>Tabla de registros</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c} style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'left' }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data && data.length ? (
                  data.map((row, idx) => (
                    <tr key={idx}>
                      {columns.map((c) => (
                        <td key={c} style={{ border: '1px solid #eee', padding: '6px' }}>
                          {row[c] !== undefined && row[c] !== null ? String(row[c]) : ''}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} style={{ padding: 12 }}>No hay registros para mostrar.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
