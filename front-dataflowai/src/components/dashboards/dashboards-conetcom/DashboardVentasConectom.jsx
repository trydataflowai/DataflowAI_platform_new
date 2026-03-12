import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import '../../../styles/Dashboards/dashboards-conetcom/DashboardVentasConetcom.css';
import { obtenerConetcomClientes } from '../../../api/DashboardsApis/dashboards-conetcom/Dashboardconetcomclientes';
import { obtenerConetcomFacturacion } from '../../../api/DashboardsApis/dashboards-conetcom/Dashboardconetcom_facturacion';
import { obtenerConetcomPagos } from '../../../api/DashboardsApis/dashboards-conetcom/Dashboardconetcom_pagos';
import { obtenerConetcomCampanas } from '../../../api/DashboardsApis/dashboards-conetcom/Dashboardconetcom_campanas';
import { obtenerConetcomInteraccionesCampanas } from '../../../api/DashboardsApis/dashboards-conetcom/Dashboardconetcom_interacciones_campanas';

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const CANAL_COLORS = ['#2563eb', '#38bdf8', '#f59e0b', '#10b981', '#ef4444', '#a855f7', '#f97316'];

const toList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const toDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const isInMonth = (value, year, month) => {
  const d = toDate(value);
  if (!d) return false;
  return d.getFullYear() === year && d.getMonth() === month;
};

const isTruthy = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'si';
  }
  return false;
};

const getId = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    return String(
      value.id_cliente ||
        value.id_campana ||
        value.id_factura ||
        value.id_pago ||
        value.id ||
        '',
    );
  }
  return String(value);
};

const DashboardVentasConetcom = () => {
  const now = new Date();
  const [clientes, setClientes] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [campanas, setCampanas] = useState([]);
  const [interacciones, setInteracciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  useEffect(() => {
    let mounted = true;
    const cargar = async () => {
      try {
        setLoading(true);
        setError('');
        const [clientesRes, facturasRes, pagosRes, campanasRes, interaccionesRes] = await Promise.all([
          obtenerConetcomClientes(),
          obtenerConetcomFacturacion(),
          obtenerConetcomPagos(),
          obtenerConetcomCampanas(),
          obtenerConetcomInteraccionesCampanas(),
        ]);
        if (!mounted) return;
        setClientes(toList(clientesRes));
        setFacturas(toList(facturasRes));
        setPagos(toList(pagosRes));
        setCampanas(toList(campanasRes));
        setInteracciones(toList(interaccionesRes));
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || 'No se pudo cargar la informacion de ventas.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    cargar();
    return () => {
      mounted = false;
    };
  }, []);

  const {
    totalFacturadoMes,
    totalRecaudadoMes,
    ticketPromedio,
    nuevosClientes,
    conversionRateMes,
    interaccionesMesTotal,
    ingresosCampanasMes,
    ventasSeries,
    recaudoSeries,
    conversionSeries,
    ventasPorCanal,
    topClientes,
    funnelData,
    campanasResumen,
  } = useMemo(() => {
    const clientesPorId = new Map(
      clientes.map((cliente) => [
        String(cliente?.id_cliente || ''),
        {
          nombre: cliente?.nombre_cliente || cliente?.id_cliente || 'Sin nombre',
          canal: cliente?.canal_adquisicion || 'Sin canal',
          region: cliente?.region_departamento || 'Sin region',
        },
      ]),
    );

    const facturasMes = facturas.filter((factura) =>
      isInMonth(factura?.fecha_emision, selectedYear, selectedMonth),
    );

    const pagosMes = pagos.filter((pago) =>
      isInMonth(pago?.fecha_pago, selectedYear, selectedMonth),
    );

    const interaccionesMes = interacciones.filter((interaccion) =>
      isInMonth(interaccion?.fecha_envio, selectedYear, selectedMonth),
    );

    const totalFacturadoMesValue = facturasMes.reduce(
      (acc, factura) => acc + toNumber(factura?.valor_total_facturado),
      0,
    );

    const totalRecaudadoMesValue = pagosMes.reduce(
      (acc, pago) => acc + toNumber(pago?.valor_pagado),
      0,
    );

    const ticketPromedioValue =
      facturasMes.length > 0 ? totalFacturadoMesValue / facturasMes.length : 0;

    const nuevosClientesValue = clientes.filter((cliente) =>
      isInMonth(cliente?.fecha_alta_cliente, selectedYear, selectedMonth),
    ).length;

    const conversionesMes = interaccionesMes.filter((item) => isTruthy(item?.genero_conversion)).length;
    const conversionRateMesValue =
      interaccionesMes.length > 0 ? (conversionesMes / interaccionesMes.length) * 100 : 0;

    const ingresosCampanasMesValue = interaccionesMes.reduce(
      (acc, item) => acc + toNumber(item?.ingresos_generados),
      0,
    );

    const ventasSeriesValue = MESES.map((mes, index) => {
      const total = facturas
        .filter((factura) => isInMonth(factura?.fecha_emision, selectedYear, index))
        .reduce((acc, factura) => acc + toNumber(factura?.valor_total_facturado), 0);
      return { mes: mes.slice(0, 3), facturado: total };
    });

    const recaudoSeriesValue = MESES.map((mes, index) => {
      const total = pagos
        .filter((pago) => isInMonth(pago?.fecha_pago, selectedYear, index))
        .reduce((acc, pago) => acc + toNumber(pago?.valor_pagado), 0);
      return { mes: mes.slice(0, 3), recaudo: total };
    });

    const conversionSeriesValue = MESES.map((mes, index) => {
      const interaccionesDelMes = interacciones.filter((item) =>
        isInMonth(item?.fecha_envio, selectedYear, index),
      );
      const conversiones = interaccionesDelMes.filter((item) => isTruthy(item?.genero_conversion)).length;
      const tasa = interaccionesDelMes.length > 0 ? (conversiones / interaccionesDelMes.length) * 100 : 0;
      return { mes: mes.slice(0, 3), tasa };
    });

    const ventasPorCanalMap = new Map();
    facturasMes.forEach((factura) => {
      const idCliente = getId(factura?.id_cliente);
      const canal = clientesPorId.get(idCliente)?.canal || 'Sin canal';
      ventasPorCanalMap.set(canal, (ventasPorCanalMap.get(canal) || 0) + toNumber(factura?.valor_total_facturado));
    });

    const ventasPorCanalValue = Array.from(ventasPorCanalMap.entries())
      .map(([canal, total]) => ({ canal, total }))
      .sort((a, b) => b.total - a.total);

    const topClientesMap = new Map();
    facturasMes.forEach((factura) => {
      const idCliente = getId(factura?.id_cliente);
      const total = topClientesMap.get(idCliente) || 0;
      topClientesMap.set(idCliente, total + toNumber(factura?.valor_total_facturado));
    });

    const topClientesValue = Array.from(topClientesMap.entries())
      .map(([id, total]) => ({
        id,
        total,
        nombre: clientesPorId.get(id)?.nombre || id,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    const campanasPorId = new Map(
      campanas.map((campana) => [getId(campana?.id_campana), campana]),
    );

    let abrieron = 0;
    let clics = 0;
    interaccionesMes.forEach((item) => {
      if (isTruthy(item?.abrio_mensaje)) abrieron += 1;
      if (isTruthy(item?.hizo_clic)) clics += 1;
    });

    const funnelDataValue = [
      { etapa: 'Enviados', total: interaccionesMes.length },
      { etapa: 'Abrieron', total: abrieron },
      { etapa: 'Clics', total: clics },
      { etapa: 'Conversiones', total: conversionesMes },
    ];

    const resumenCampanas = new Map();
    interaccionesMes.forEach((item) => {
      const idCampana = getId(item?.id_campana);
      const campana = campanasPorId.get(idCampana);
      const nombre = campana?.nombre_campana || idCampana || 'Sin campana';
      const actual = resumenCampanas.get(nombre) || { nombre, total: 0, conversiones: 0, ingresos: 0 };
      actual.total += 1;
      if (isTruthy(item?.genero_conversion)) actual.conversiones += 1;
      actual.ingresos += toNumber(item?.ingresos_generados);
      resumenCampanas.set(nombre, actual);
    });

    const campanasResumenValue = Array.from(resumenCampanas.values())
      .sort((a, b) => {
        if (b.ingresos !== a.ingresos) return b.ingresos - a.ingresos;
        return b.conversiones - a.conversiones;
      })
      .slice(0, 8);

    return {
      totalFacturadoMes: totalFacturadoMesValue,
      totalRecaudadoMes: totalRecaudadoMesValue,
      ticketPromedio: ticketPromedioValue,
      nuevosClientes: nuevosClientesValue,
      conversionRateMes: conversionRateMesValue,
      interaccionesMesTotal: interaccionesMes.length,
      ingresosCampanasMes: ingresosCampanasMesValue,
      ventasSeries: ventasSeriesValue,
      recaudoSeries: recaudoSeriesValue,
      conversionSeries: conversionSeriesValue,
      ventasPorCanal: ventasPorCanalValue,
      topClientes: topClientesValue,
      funnelData: funnelDataValue,
      campanasResumen: campanasResumenValue,
    };
  }, [campanas, clientes, facturas, interacciones, pagos, selectedMonth, selectedYear]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value || 0);

  const formatPercent = (value) => `${(value || 0).toFixed(2)}%`;
  const periodoLabel = `${MESES[selectedMonth]} ${selectedYear}`;

  return (
    <div className="container">
      <header className="header">
        <div className="headerText">
          <p className="eyebrow">Conetcom</p>
          <h1 className="title">Dashboard de ventas</h1>
          <p className="subtitle">
            Seguimiento de facturacion, recaudo y campanas para el periodo seleccionado.
          </p>
        </div>
        <div className="headerActions">
          <div className="headerBadge">
            <span className="badgeLabel">Periodo</span>
            <strong className="badgeValue">{periodoLabel}</strong>
          </div>
          <div className="headerBadge">
            <span className="badgeLabel">Conversion</span>
            <strong className="badgeValue">{formatPercent(conversionRateMes)}</strong>
          </div>
        </div>
      </header>

      {error ? <div className="errorBanner">{error}</div> : null}

      <section className="section">
        <div className="sectionHeader">
          <h2 className="sectionTitle">Filtros</h2>
          <p className="sectionHint">Selecciona el mes y ano para actualizar el reporte.</p>
        </div>
        <div className="filterRow">
          <div className="filterGroup">
            <span className="filterLabel">Mes</span>
            <select
              className="filterControl"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {MESES.map((mes, index) => (
                <option key={mes} value={index}>
                  {mes}
                </option>
              ))}
            </select>
          </div>
          <div className="filterGroup">
            <span className="filterLabel">Ano</span>
            <input
              className="filterControl"
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value) || now.getFullYear())}
            />
          </div>
          <div className="filterGroup">
            <span className="filterLabel">Interacciones</span>
            {loading ? (
              <span className="filterValueMuted">Cargando...</span>
            ) : error ? (
              <span className="filterValueMuted">--</span>
            ) : (
              <span className="filterValue">{interaccionesMesTotal}</span>
            )}
          </div>
          <div className="filterGroup">
            <span className="filterLabel">Ingresos campanas</span>
            {loading ? (
              <span className="filterValueMuted">Cargando...</span>
            ) : error ? (
              <span className="filterValueMuted">--</span>
            ) : (
              <span className="filterValue">{formatCurrency(ingresosCampanasMes)}</span>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <h2 className="sectionTitle">Indicadores</h2>
          <p className="sectionHint">Resumen del mes seleccionado.</p>
        </div>
        <div className="kpiGrid">
          <article className="card">
            <p className="cardLabel">Facturacion del mes</p>
            {loading ? (
              <p className="cardValueMuted">Cargando...</p>
            ) : error ? (
              <p className="cardValueMuted">--</p>
            ) : (
              <p className="cardValue">{formatCurrency(totalFacturadoMes)}</p>
            )}
          </article>
          <article className="card">
            <p className="cardLabel">Recaudo del mes</p>
            {loading ? (
              <p className="cardValueMuted">Cargando...</p>
            ) : error ? (
              <p className="cardValueMuted">--</p>
            ) : (
              <p className="cardValue">{formatCurrency(totalRecaudadoMes)}</p>
            )}
          </article>
          <article className="card">
            <p className="cardLabel">Ticket promedio</p>
            {loading ? (
              <p className="cardValueMuted">Cargando...</p>
            ) : error ? (
              <p className="cardValueMuted">--</p>
            ) : (
              <p className="cardValue">{formatCurrency(ticketPromedio)}</p>
            )}
          </article>
          <article className="card">
            <p className="cardLabel">Nuevos clientes</p>
            {loading ? (
              <p className="cardValueMuted">Cargando...</p>
            ) : error ? (
              <p className="cardValueMuted">--</p>
            ) : (
              <p className="cardValue">{nuevosClientes}</p>
            )}
            <p className="cardHint">Altas registradas en el periodo.</p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <h2 className="sectionTitle">Ventas y recaudo</h2>
          <p className="sectionHint">Evolucion mensual para el ano seleccionado.</p>
        </div>
        <div className="chartGrid">
          <div className="chartCard">
            <div className="chartHeader">
              <h3 className="chartTitle">Facturacion mensual</h3>
              <span className="chartBadge">{selectedYear}</span>
            </div>
            {loading ? (
              <p className="chartLoading">Cargando grafica...</p>
            ) : error ? (
              <p className="chartLoading">Sin datos.</p>
            ) : (
              <div className="chartBody">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={ventasSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Line type="monotone" dataKey="facturado" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <div className="chartCard">
            <div className="chartHeader">
              <h3 className="chartTitle">Recaudo mensual</h3>
              <span className="chartBadge">{selectedYear}</span>
            </div>
            {loading ? (
              <p className="chartLoading">Cargando grafica...</p>
            ) : error ? (
              <p className="chartLoading">Sin datos.</p>
            ) : (
              <div className="chartBody">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={recaudoSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Line type="monotone" dataKey="recaudo" stroke="#0f766e" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <div className="chartCard">
            <div className="chartHeader">
              <h3 className="chartTitle">Conversion de campanas</h3>
              <span className="chartBadge">{selectedYear}</span>
            </div>
            {loading ? (
              <p className="chartLoading">Cargando grafica...</p>
            ) : error ? (
              <p className="chartLoading">Sin datos.</p>
            ) : (
              <div className="chartBody">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={conversionSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
                    <Line type="monotone" dataKey="tasa" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <h2 className="sectionTitle">Canales y campanas</h2>
          <p className="sectionHint">Distribucion de ventas y funnel de interacciones.</p>
        </div>
        <div className="chartGrid">
          <div className="chartCard">
            <div className="chartHeader">
              <h3 className="chartTitle">Ventas por canal</h3>
              <span className="chartBadge">{periodoLabel}</span>
            </div>
            {loading ? (
              <p className="chartLoading">Cargando grafica...</p>
            ) : error ? (
              <p className="chartLoading">Sin datos.</p>
            ) : ventasPorCanal.length === 0 ? (
              <p className="chartLoading">Sin ventas para el periodo.</p>
            ) : (
              <div className="chartBody">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={ventasPorCanal} dataKey="total" nameKey="canal" innerRadius={55} outerRadius={95}>
                      {ventasPorCanal.map((entry, index) => (
                        <Cell key={entry.canal} fill={CANAL_COLORS[index % CANAL_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <div className="chartCard">
            <div className="chartHeader">
              <h3 className="chartTitle">Funnel de campanas</h3>
              <span className="chartBadge">{periodoLabel}</span>
            </div>
            {loading ? (
              <p className="chartLoading">Cargando grafica...</p>
            ) : error ? (
              <p className="chartLoading">Sin datos.</p>
            ) : (
              <div className="chartBody">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={funnelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="etapa" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#2563eb" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <h2 className="sectionTitle">Detalle por clientes y campanas</h2>
          <p className="sectionHint">Top clientes y rendimiento de campanas.</p>
        </div>
        <div className="tableGrid">
          <div className="tableCard">
            <h3 className="tableTitle">Top clientes por facturacion</h3>
            {loading ? (
              <p className="tableEmpty">Cargando clientes...</p>
            ) : error ? (
              <p className="tableEmpty">Sin datos.</p>
            ) : (
              <div className="tableWrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Total facturado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topClientes.length === 0 ? (
                      <tr>
                        <td colSpan="2">Sin facturacion para el periodo.</td>
                      </tr>
                    ) : (
                      topClientes.map((cliente) => (
                        <tr key={cliente.id}>
                          <td>{cliente.nombre}</td>
                          <td>{formatCurrency(cliente.total)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="tableCard">
            <h3 className="tableTitle">Campanas con mayor rendimiento</h3>
            {loading ? (
              <p className="tableEmpty">Cargando campanas...</p>
            ) : error ? (
              <p className="tableEmpty">Sin datos.</p>
            ) : (
              <div className="tableWrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Campana</th>
                      <th>Interacciones</th>
                      <th>Conversiones</th>
                      <th>Ingresos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campanasResumen.length === 0 ? (
                      <tr>
                        <td colSpan="4">No hay interacciones registradas en el periodo.</td>
                      </tr>
                    ) : (
                      campanasResumen.map((item) => (
                        <tr key={item.nombre}>
                          <td>{item.nombre}</td>
                          <td>{item.total}</td>
                          <td>{item.conversiones}</td>
                          <td>{formatCurrency(item.ingresos)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardVentasConetcom;
