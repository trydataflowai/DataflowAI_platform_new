
// front-dataflowai/src/components/dashboards/DashboardSalesreview.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';
import { fetchDashboardSalesreview } from '../../api/DashboardsApis/DashboardSalesreview';
import '../../styles/Dashboards/DashboardSalesreview.css';

const COLORS = ['#7C3AED', '#06B6D4', '#F59E0B', '#EF4444', '#10B981', '#A78BFA', '#F472B6'];

export default function DashboardSalesreview() {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);

  // filtros
  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');
  const [filterSemana, setFilterSemana] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterLinea, setFilterLinea] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterFuente, setFilterFuente] = useState('');

  // modo: 'unidades' | 'ingresos'
  const [mode, setMode] = useState('ingresos');

  // seleccion interactiva
  const [selection, setSelection] = useState({ tipo: '', valor: '' });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchDashboardSalesreview()
      .then((data) => {
        if (!mounted) return;
        const normalized = data.map((r) => ({
          ...r,
          unidades: Number(r.unidades),
          ingresos_antes_iva: Number(r.ingresos_antes_iva),
          fecha_compra: r.fecha_compra
        }));
        setRawData(normalized);
      })
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

  const filteredData = useMemo(() => {
    return rawData.filter((r) => {
      if (filterFechaDesde && r.fecha_compra < filterFechaDesde) return false;
      if (filterFechaHasta && r.fecha_compra > filterFechaHasta) return false;
      if (filterSemana && r.semana !== filterSemana) return false;
      if (filterEstado && r.estado !== filterEstado) return false;
      if (filterLinea && r.linea !== filterLinea) return false;
      if (filterCategoria && r.categoria !== filterCategoria) return false;
      if (filterFuente && r.fuente !== filterFuente) return false;
      if (selection.tipo === 'estado' && selection.valor && r.estado !== selection.valor) return false;
      if (selection.tipo === 'fuente' && selection.valor && r.fuente !== selection.valor) return false;
      if (selection.tipo === 'categoria' && selection.valor && r.categoria !== selection.valor) return false;
      return true;
    });
  }, [rawData, filterFechaDesde, filterFechaHasta, filterSemana, filterEstado, filterLinea, filterCategoria, filterFuente, selection]);

  const listUnica = (campo) => Array.from(new Set(rawData.map((r) => r[campo]))).filter(Boolean);

  const totalMetric = useMemo(() => {
    return filteredData.reduce((s, r) => s + (mode === 'unidades' ? r.unidades : r.ingresos_antes_iva), 0);
  }, [filteredData, mode]);

  const pieData = useMemo(() => {
    const map = {};
    filteredData.forEach((r) => {
      const key = r.estado || 'SIN_ESTADO';
      map[key] = (map[key] || 0) + (mode === 'unidades' ? r.unidades : r.ingresos_antes_iva);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredData, mode]);

  const barData = useMemo(() => {
    const map = {};
    filteredData.forEach((r) => {
      const key = r.fuente || 'SIN_FUENTE';
      map[key] = (map[key] || 0) + (mode === 'unidades' ? r.unidades : r.ingresos_antes_iva);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredData, mode]);

  const heatmapData = useMemo(() => {
    const categorias = Array.from(new Set(rawData.map((r) => r.categoria))).filter(Boolean);
    const semanas = Array.from(new Set(rawData.map((r) => r.semana))).sort();
    const matrix = categorias.map((cat) => {
      const row = { categoria: cat };
      semanas.forEach((s) => {
        const suma = rawData
          .filter((r) => r.categoria === cat && r.semana === s)
          .reduce((acc, cur) => acc + (mode === 'unidades' ? cur.unidades : cur.ingresos_antes_iva), 0);
        row[s] = suma;
      });
      return row;
    });
    return { categorias, semanas, matrix };
  }, [rawData, mode]);

  const [expandedEstados, setExpandedEstados] = useState({});

  const groupedByEstado = useMemo(() => {
    const map = {};
    filteredData.forEach((r) => {
      if (!map[r.estado]) map[r.estado] = {};
      if (!map[r.estado][r.fuente]) map[r.estado][r.fuente] = [];
      map[r.estado][r.fuente].push(r);
    });
    return map;
  }, [filteredData]);

  const toggleEstado = (estado) => {
    setExpandedEstados((s) => ({ ...s, [estado]: !s[estado] }));
  };

  const onPieClick = (data, index) => {
    if (!data || !data.name) return;
    setSelection((sel) => (sel.tipo === 'estado' && sel.valor === data.name ? { tipo: '', valor: '' } : { tipo: 'estado', valor: data.name }));
  };

  const onBarClick = (data, index) => {
    if (!data || !data.name) return;
    setSelection((sel) => (sel.tipo === 'fuente' && sel.valor === data.name ? { tipo: '', valor: '' } : { tipo: 'fuente', valor: data.name }));
  };

  if (loading) return <div className="dsr-root">Cargando...</div>;

  return (
    <div className="dsr-root">
      <div className="dsr-header">
        <h2>Sales Review - Dashboard</h2>
        <div className="dsr-controls">
          <div className="dsr-filter-row">
            <label>Desde: <input type="date" value={filterFechaDesde} onChange={(e) => setFilterFechaDesde(e.target.value)} /></label>
            <label>Hasta: <input type="date" value={filterFechaHasta} onChange={(e) => setFilterFechaHasta(e.target.value)} /></label>
            <label>Semana:
              <select value={filterSemana} onChange={(e) => setFilterSemana(e.target.value)}>
                <option value="">Todas</option>
                {listUnica('semana').map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </label>
            <label>Estado:
              <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
                <option value="">Todos</option>
                {listUnica('estado').map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </label>
            <label>Linea:
              <select value={filterLinea} onChange={(e) => setFilterLinea(e.target.value)}>
                <option value="">Todas</option>
                {listUnica('linea').map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </label>
            <label>Categoria:
              <select value={filterCategoria} onChange={(e) => setFilterCategoria(e.target.value)}>
                <option value="">Todas</option>
                {listUnica('categoria').map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </label>
            <label>Fuente:
              <select value={filterFuente} onChange={(e) => setFilterFuente(e.target.value)}>
                <option value="">Todas</option>
                {listUnica('fuente').map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </label>
          </div>

          <div className="dsr-switch">
            <span>Ingresos</span>
            <label className="switch">
              <input type="checkbox" checked={mode === 'unidades'} onChange={() => setMode((m) => (m === 'unidades' ? 'ingresos' : 'unidades'))} />
              <span className="slider" />
            </label>
            <span>Unidades</span>
          </div>
        </div>
      </div>

      <div className="dsr-grid">
        {/* Primera fila: Pie (6 columnas) + Heatmap (6 columnas) */}
        <div className="card dsr-pie">
          <h3>Participacion por Estado</h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} onClick={onPieClick}>
                {pieData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} style={{ cursor: 'pointer', stroke: selection.tipo === 'estado' && selection.valor === entry.name ? '#fff' : 'none', strokeWidth: 2 }} />
                ))}
              </Pie>
              <ReTooltip formatter={(val) => new Intl.NumberFormat('es-CO').format(val)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="dsr-pie-legend">
            {pieData.map((p, i) => (
              <div key={p.name} className="legend-item" onClick={() => onPieClick(p)}>
                <span className="swatch" style={{ background: COLORS[i % COLORS.length] }} />
                <div>
                  <div className="legend-title">{p.name}</div>
                  <div className="legend-sub">{((p.value / (totalMetric || 1)) * 100).toFixed(2)}% — {mode === 'unidades' ? p.value : new Intl.NumberFormat('es-CO').format(p.value)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card dsr-heatmap">
          <h3>Heatmap: Categoria x Semana</h3>
          <div className="heatmap-wrapper">
            <div className="heatmap-grid">
              <div className="heatmap-row header">
                <div className="cell corner">Categoria / Semana</div>
                {heatmapData.semanas.map((s) => (
                  <div key={s} className="cell header">{s}</div>
                ))}
              </div>

              {heatmapData.matrix.map((row) => (
                <div key={row.categoria} className="heatmap-row">
                  <div className="cell bold">{row.categoria}</div>
                  {heatmapData.semanas.map((s, i) => {
                    const val = row[s] || 0;
                    const maxVal = Math.max(...heatmapData.matrix.flatMap((r) => heatmapData.semanas.map((ss) => r[ss] || 0)), 1);
                    const intensity = val / maxVal;
                    return (
                      <div
                        key={s}
                        className="cell heatcell"
                        style={{ background: `rgba(124,58,237, ${Math.max(0.08, intensity)})` }}
                        onClick={() => setSelection((sel) => (sel.tipo === 'categoria' && sel.valor === row.categoria ? { tipo: '', valor: '' } : { tipo: 'categoria', valor: row.categoria }))}
                        title={`${row.categoria} / Semana ${s}: ${mode === 'unidades' ? val : new Intl.NumberFormat('es-CO').format(val)} (${((val / (totalMetric || 1)) * 100).toFixed(2)}%)`}
                      >
                        <div className="heatcell-label">{mode === 'unidades' ? val : new Intl.NumberFormat('es-CO').format(val)}</div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Segunda fila: Bar chart ocupa ancho completo */}
        <div className="card dsr-bar">
  <h3>Acumulado por Fuente</h3>
  <ResponsiveContainer width="100%" height={340}>
    <BarChart
      data={barData}
      margin={{ top: 20, right: 30, left: -20, bottom: 5 }}
      barCategoryGap="0%"
      barGap={0}
    >
      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
      
      <XAxis
        dataKey="name"
        tick={{ fill: '#fff', fontSize: 12 }}
        axisLine={{ stroke: '#fff' }}
        tickLine={{ stroke: '#fff' }}
      />
      
      <YAxis
        tick={{ fill: '#fff', fontSize: 12 }}
        axisLine={{ stroke: '#fff' }}
        tickLine={{ stroke: '#fff' }}
      />

      {/* Tooltip con porcentaje */}
      <ReTooltip
      formatter={(val) => {
        const total = barData.reduce((acc, cur) => acc + cur.value, 0);
        const porcentaje = ((val / total) * 100).toFixed(1) + "%";
        return `${new Intl.NumberFormat('es-CO').format(val)} (${porcentaje})`;
      }}
      contentStyle={{ backgroundColor: '#fff', borderRadius: 6, padding: '8px 10px' }}
      itemStyle={{ color: '#000' }}
      labelStyle={{ color: '#000' }}
      cursor={{ fill: 'rgba(0,0,0,0.04)' }}/>

      
      <Bar dataKey="value" onClick={(e) => onBarClick(e)} barSize={60}>
        {barData.map((entry, i) => (
          <Cell
            key={`cell-bar-${i}`}
            fill={COLORS[i % COLORS.length]}
            style={{ cursor: 'pointer' }}
          />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
</div>

        {/* Tabla expandible (full width) */}
        <div className="card dsr-table" style={{ minHeight: 200 }}>
          <h3>Tabla Matriz (expandible)</h3>
          <div className="table-scroll">
            {Object.keys(groupedByEstado).length === 0 && <div>No hay datos</div>}
            {Object.entries(groupedByEstado).map(([estado, fuentes]) => (
              <div key={estado} className="estado-block">
                <div className="estado-row" onClick={() => toggleEstado(estado)}>
                  <button className="btn-expand">{expandedEstados[estado] ? '-' : '+'}</button>
                  <div className="estado-title">{estado}</div>
                </div>
                {expandedEstados[estado] && (
                  <div className="fuentes-block">
                    {Object.entries(fuentes).map(([fuente, pedidos]) => (
                      <div key={fuente} className="fuente-block">
                        <div className="fuente-row">
                          <div className="fuente-title">{fuente} — {pedidos.length} pedidos</div>
                        </div>
                        <table className="detail-table">
                          <thead>
                            <tr>
                              <th>Estado</th>
                              <th>Fuente</th>
                              <th>Nº PEDIDO</th>
                              <th>Categoria</th>
                              <th>SKU ENVIADO</th>
                              <th>PRODUCTO</th>
                              <th>PRECIO UNIDAD</th>
                              <th>UNIDADES</th>
                              <th>INGRESOS ANTES IVA</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pedidos.map((p) => (
                              <tr key={p.numero_pedido}>
                                <td>{p.estado}</td>
                                <td>{p.fuente}</td>
                                <td>{p.numero_pedido}</td>
                                <td>{p.categoria}</td>
                                <td>{p.sku_enviado}</td>
                                <td>{p.producto}</td>
                                <td>{new Intl.NumberFormat('es-CO').format(Number(p.precio_unidad_antes_iva))}</td>
                                <td>{p.unidades}</td>
                                <td>{new Intl.NumberFormat('es-CO').format(Number(p.ingresos_antes_iva))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="dsr-footer">Total {mode === 'unidades' ? 'Unidades' : 'Ingresos antes de IVA'}: {mode === 'unidades' ? totalMetric : new Intl.NumberFormat('es-CO').format(totalMetric)}</div>
    </div>
  );
}
