import React, { useEffect, useMemo, useState } from 'react';
import {
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
import styles from '../../../styles/Dashboards/dashboards-conetcom/DashboardGeneral.module.css';
import { obtenerConetcomFacturacion } from '../../../api/DashboardsApis/dashboards-conetcom/Dashboardconetcom_facturacion';
import { obtenerConetcomPagos } from '../../../api/DashboardsApis/dashboards-conetcom/Dashboardconetcom_pagos';
import { obtenerConetcomClientes } from '../../../api/DashboardsApis/dashboards-conetcom/Dashboardconetcomclientes';

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

const CARTERA_COLORS = ['#2563eb', '#38bdf8', '#f59e0b', '#ef4444'];

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

const parseInputDate = (value, endOfDay = false) => {
  if (!value) return null;
  const parts = value.split('-').map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return null;
  const [year, month, day] = parts;
  if (endOfDay) return new Date(year, month - 1, day, 23, 59, 59, 999);
  return new Date(year, month - 1, day);
};

const isInMonth = (value, year, month) => {
  const d = toDate(value);
  if (!d) return false;
  return d.getFullYear() === year && d.getMonth() === month;
};

const isInYear = (value, year) => {
  const d = toDate(value);
  if (!d) return false;
  return d.getFullYear() === year;
};

const isInRange = (value, start, end) => {
  const d = toDate(value);
  if (!d) return false;
  if (start && d < start) return false;
  if (end && d > end) return false;
  return true;
};

const DashboardFinancieroConetcom = () => {
  const now = new Date();
  const [facturas, setFacturas] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');

  useEffect(() => {
    let mounted = true;
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError('');
        const [facturasRes, pagosRes, clientesRes] = await Promise.all([
          obtenerConetcomFacturacion(),
          obtenerConetcomPagos(),
          obtenerConetcomClientes(),
        ]);
        if (!mounted) return;
        setFacturas(toList(facturasRes));
        setPagos(toList(pagosRes));
        setClientes(toList(clientesRes));
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || 'No se pudo cargar la informacion financiera.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    cargarDatos();
    return () => {
      mounted = false;
    };
  }, []);

  const {
    facturacionMes,
    facturacionSeries,
    carteraSeries,
    carteraTotal,
    diasPromedioPago,
    tasaRecaudoMes,
    tasaRecaudoSeries,
    clientesRiesgo,
    recaudoPorMetodo,
  } = useMemo(() => {
    const rangeStartDate = parseInputDate(rangeStart);
    const rangeEndDate = parseInputDate(rangeEnd, true);
    const hoy = new Date();
    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    const isUnpaid = (factura) => {
      const pagado = toNumber(factura?.valor_pagado);
      return pagado <= 0 && !factura?.fecha_pago;
    };

    const facturasSinPago = facturas.filter(isUnpaid);
    const facturasMes = facturasSinPago.filter((factura) =>
      isInMonth(factura?.fecha_emision, selectedYear, selectedMonth),
    );
    const facturacionMesValue = facturasMes.reduce(
      (acc, factura) => acc + toNumber(factura?.valor_total_facturado),
      0,
    );

    const facturacionSeriesValue = MESES.map((mes, index) => {
      const total = facturasSinPago
        .filter((factura) => isInMonth(factura?.fecha_emision, selectedYear, index))
        .reduce((acc, factura) => acc + toNumber(factura?.valor_total_facturado), 0);
      return { mes: mes.slice(0, 3), total };
    });

    const facturasYear = facturas.filter((factura) =>
      isInYear(factura?.fecha_emision, selectedYear),
    );

    const carteraBuckets = {
      '0-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0,
    };

    const facturasCartera = facturasYear.filter((factura) => {
      const estado = String(factura?.estado_factura || '').toLowerCase();
      return estado === 'pendiente' || estado === 'vencida';
    });

    facturasCartera.forEach((factura) => {
      const fechaEmision = toDate(factura?.fecha_emision);
      if (!fechaEmision) return;
      const dias = Math.max(0, Math.floor((hoy - fechaEmision) / MS_PER_DAY));
      const saldo = Math.max(
        0,
        toNumber(factura?.valor_total_facturado) - toNumber(factura?.valor_pagado),
      );
      if (!saldo) return;
      if (dias <= 30) carteraBuckets['0-30'] += saldo;
      else if (dias <= 60) carteraBuckets['31-60'] += saldo;
      else if (dias <= 90) carteraBuckets['61-90'] += saldo;
      else carteraBuckets['90+'] += saldo;
    });

    const carteraSeriesValue = Object.entries(carteraBuckets).map(([name, value]) => ({
      name,
      value,
    }));

    const carteraTotalValue = carteraSeriesValue.reduce((acc, item) => acc + item.value, 0);

    let totalDiasPago = 0;
    let conteoPagos = 0;
    facturas.forEach((factura) => {
      const fechaPago = toDate(factura?.fecha_pago);
      const fechaEmision = toDate(factura?.fecha_emision);
      if (!fechaPago || !fechaEmision) return;
      if (fechaPago.getFullYear() !== selectedYear) return;
      if ((rangeStartDate || rangeEndDate) && !isInRange(fechaPago, rangeStartDate, rangeEndDate)) return;
      const dias = Math.max(0, Math.round((fechaPago - fechaEmision) / MS_PER_DAY));
      totalDiasPago += dias;
      conteoPagos += 1;
    });
    const diasPromedioPagoValue = conteoPagos > 0 ? totalDiasPago / conteoPagos : 0;

    const facturasMesRecaudo = facturas.filter((factura) =>
      isInMonth(factura?.fecha_emision, selectedYear, selectedMonth),
    );
    const totalFacturadoMes = facturasMesRecaudo.reduce(
      (acc, factura) => acc + toNumber(factura?.valor_total_facturado),
      0,
    );
    const totalPagadoMes = facturasMesRecaudo.reduce(
      (acc, factura) => acc + toNumber(factura?.valor_pagado),
      0,
    );
    const tasaRecaudoMesValue =
      totalFacturadoMes > 0 ? (totalPagadoMes / totalFacturadoMes) * 100 : 0;

    const tasaRecaudoSeriesValue = MESES.map((mes, index) => {
      const facturasDelMes = facturas.filter((factura) =>
        isInMonth(factura?.fecha_emision, selectedYear, index),
      );
      const facturado = facturasDelMes.reduce(
        (acc, factura) => acc + toNumber(factura?.valor_total_facturado),
        0,
      );
      const pagado = facturasDelMes.reduce((acc, factura) => acc + toNumber(factura?.valor_pagado), 0);
      const tasa = facturado > 0 ? (pagado / facturado) * 100 : 0;
      return { mes: mes.slice(0, 3), tasa, facturado, pagado };
    });

    const clientesPorId = new Map(
      clientes.map((cliente) => [String(cliente?.id_cliente || ''), cliente]),
    );
    const riesgoMap = new Map();

    facturasCartera.forEach((factura) => {
      const saldo = Math.max(
        0,
        toNumber(factura?.valor_total_facturado) - toNumber(factura?.valor_pagado),
      );
      if (!saldo) return;
      const fechaEmision = toDate(factura?.fecha_emision);
      if (!fechaEmision) return;
      const dias = Math.max(0, Math.floor((hoy - fechaEmision) / MS_PER_DAY));
      const idCliente = String(factura?.id_cliente || 'sin_cliente');
      const actual = riesgoMap.get(idCliente) || {
        id_cliente: idCliente,
        totalPendiente: 0,
        facturasPendientes: 0,
        maxDias: 0,
      };
      actual.totalPendiente += saldo;
      actual.facturasPendientes += 1;
      actual.maxDias = Math.max(actual.maxDias, dias);
      riesgoMap.set(idCliente, actual);
    });

    const clientesRiesgoValue = Array.from(riesgoMap.values())
      .map((item) => ({
        ...item,
        nombre: clientesPorId.get(item.id_cliente)?.nombre_cliente || item.id_cliente,
      }))
      .sort((a, b) => {
        if (b.totalPendiente !== a.totalPendiente) return b.totalPendiente - a.totalPendiente;
        return b.maxDias - a.maxDias;
      })
      .slice(0, 10);

    const pagosFiltrados = pagos.filter((pago) => {
      const fechaPago = toDate(pago?.fecha_pago);
      if (!fechaPago) return false;
      if (rangeStartDate || rangeEndDate) return isInRange(fechaPago, rangeStartDate, rangeEndDate);
      return fechaPago.getFullYear() === selectedYear;
    });

    const pagoPorMetodo = new Map();
    pagosFiltrados.forEach((pago) => {
      const medio = pago?.medio_de_pago || pago?.metodo_de_pago || 'Sin medio';
      const valor = toNumber(pago?.valor_pagado);
      pagoPorMetodo.set(medio, (pagoPorMetodo.get(medio) || 0) + valor);
    });

    const recaudoPorMetodoValue = Array.from(pagoPorMetodo.entries())
      .map(([medio, total]) => ({ medio, total }))
      .sort((a, b) => b.total - a.total);

    return {
      facturacionMes: facturacionMesValue,
      facturacionSeries: facturacionSeriesValue,
      carteraSeries: carteraSeriesValue,
      carteraTotal: carteraTotalValue,
      diasPromedioPago: diasPromedioPagoValue,
      tasaRecaudoMes: tasaRecaudoMesValue,
      tasaRecaudoSeries: tasaRecaudoSeriesValue,
      clientesRiesgo: clientesRiesgoValue,
      recaudoPorMetodo: recaudoPorMetodoValue,
    };
  }, [facturas, pagos, clientes, rangeStart, rangeEnd, selectedYear, selectedMonth]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value || 0);

  const formatPercent = (value) => `${(value || 0).toFixed(2)}%`;

  const rangoLabel =
    rangeStart || rangeEnd ? `${rangeStart || '...'} a ${rangeEnd || '...'}` : 'Sin rango';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.eyebrow}>Conetcom</p>
          <h1 className={styles.title}>Dashboard financiero</h1>
          <p className={styles.subtitle}>
            Indicadores de facturacion, cartera y recaudo con filtros por fecha y rango.
          </p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.headerBadge}>
            <span className={styles.badgeLabel}>Mes</span>
            <strong className={styles.badgeValue}>
              {MESES[selectedMonth]} {selectedYear}
            </strong>
          </div>
          <div className={styles.headerBadge}>
            <span className={styles.badgeLabel}>Rango</span>
            <strong className={styles.badgeValue}>{rangoLabel}</strong>
          </div>
        </div>
      </header>

      {error ? <div className={styles.errorBanner}>{error}</div> : null}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Filtros</h2>
          <p className={styles.sectionHint}>
            Mes y ano aplican a facturacion y recaudo. Rango de fechas aplica a dias promedio de pago.
          </p>
        </div>
        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Mes</span>
            <select
              className={styles.filterControl}
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
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Ano</span>
            <input
              className={styles.filterControl}
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value) || now.getFullYear())}
            />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Desde</span>
            <input
              className={styles.filterControl}
              type="date"
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Hasta</span>
            <input
              className={styles.filterControl}
              type="date"
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Indicadores</h2>
          <p className={styles.sectionHint}>Resumen del mes seleccionado y rango aplicado.</p>
        </div>
        <div className={styles.kpiGrid}>
          <article className={styles.card}>
            <p className={styles.cardLabel}>Facturacion total mensual</p>
            {loading ? (
              <p className={styles.cardValueMuted}>Cargando...</p>
            ) : error ? (
              <p className={styles.cardValueMuted}>--</p>
            ) : (
              <p className={styles.cardValue}>{formatCurrency(facturacionMes)}</p>
            )}
            <p className={styles.cardHint}>Facturas sin pago registrado.</p>
          </article>
          <article className={styles.card}>
            <p className={styles.cardLabel}>Dias promedio de pago</p>
            {loading ? (
              <p className={styles.cardValueMuted}>Cargando...</p>
            ) : error ? (
              <p className={styles.cardValueMuted}>--</p>
            ) : (
              <p className={styles.cardValue}>{diasPromedioPago.toFixed(1)} dias</p>
            )}
          </article>
          <article className={styles.card}>
            <p className={styles.cardLabel}>Tasa de recaudo</p>
            {loading ? (
              <p className={styles.cardValueMuted}>Cargando...</p>
            ) : error ? (
              <p className={styles.cardValueMuted}>--</p>
            ) : (
              <p className={styles.cardValue}>{formatPercent(tasaRecaudoMes)}</p>
            )}
            <p className={styles.cardHint}>Pagos sobre total facturado.</p>
          </article>
          <article className={styles.card}>
            <p className={styles.cardLabel}>Cartera vencida total</p>
            {loading ? (
              <p className={styles.cardValueMuted}>Cargando...</p>
            ) : error ? (
              <p className={styles.cardValueMuted}>--</p>
            ) : (
              <p className={styles.cardValue}>{formatCurrency(carteraTotal)}</p>
            )}
            <p className={styles.cardHint}>Pendiente o vencida del ano.</p>
          </article>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Facturacion y recaudo por mes</h2>
          <p className={styles.sectionHint}>Grafica mensual del ano seleccionado.</p>
        </div>
        <div className={styles.chartGrid}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>Facturacion mensual</h3>
              <span className={styles.chartBadge}>{selectedYear}</span>
            </div>
            {loading ? (
              <p className={styles.chartLoading}>Cargando grafica...</p>
            ) : error ? (
              <p className={styles.chartLoading}>Sin datos.</p>
            ) : (
              <div className={styles.chartBody}>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={facturacionSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>Tasa de recaudo</h3>
              <span className={styles.chartBadge}>{selectedYear}</span>
            </div>
            {loading ? (
              <p className={styles.chartLoading}>Cargando grafica...</p>
            ) : error ? (
              <p className={styles.chartLoading}>Sin datos.</p>
            ) : (
              <div className={styles.chartBody}>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={tasaRecaudoSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
                    <Line
                      type="monotone"
                      dataKey="tasa"
                      stroke="#0f766e"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Cartera vencida (30/60/90 dias)</h2>
          <p className={styles.sectionHint}>Pendiente o vencida del ano seleccionado.</p>
        </div>
        <div className={styles.chartGrid}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>Distribucion por rangos</h3>
              <span className={styles.chartBadge}>{selectedYear}</span>
            </div>
            {loading ? (
              <p className={styles.chartLoading}>Cargando grafica...</p>
            ) : error ? (
              <p className={styles.chartLoading}>Sin datos.</p>
            ) : (
              <div className={styles.chartBody}>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={carteraSeries}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {carteraSeries.map((entry, index) => (
                        <Cell key={entry.name} fill={CARTERA_COLORS[index % CARTERA_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Clientes y recaudo</h2>
          <p className={styles.sectionHint}>Tablas con riesgo de impago y recaudo por metodo.</p>
        </div>
        <div className={styles.tableGrid}>
          <div className={styles.tableCard}>
            <h3 className={styles.tableTitle}>Clientes con alto riesgo de impago</h3>
            {loading ? (
              <p className={styles.tableEmpty}>Cargando clientes...</p>
            ) : error ? (
              <p className={styles.tableEmpty}>Sin datos.</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Facturas pendientes</th>
                      <th>Max dias vencidos</th>
                      <th>Total pendiente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesRiesgo.length === 0 ? (
                      <tr>
                        <td colSpan="4">Sin clientes en riesgo con el filtro actual.</td>
                      </tr>
                    ) : (
                      clientesRiesgo.map((cliente) => (
                        <tr key={cliente.id_cliente}>
                          <td>{cliente.nombre}</td>
                          <td>{cliente.facturasPendientes}</td>
                          <td>{cliente.maxDias}</td>
                          <td>{formatCurrency(cliente.totalPendiente)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className={styles.tableCard}>
            <h3 className={styles.tableTitle}>Recaudo por metodo de pago</h3>
            {loading ? (
              <p className={styles.tableEmpty}>Cargando recaudo...</p>
            ) : error ? (
              <p className={styles.tableEmpty}>Sin datos.</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Medio</th>
                      <th>Total pagado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recaudoPorMetodo.length === 0 ? (
                      <tr>
                        <td colSpan="2">Sin recaudo en el rango seleccionado.</td>
                      </tr>
                    ) : (
                      recaudoPorMetodo.map((item) => (
                        <tr key={item.medio}>
                          <td>{item.medio}</td>
                          <td>{formatCurrency(item.total)}</td>
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

export default DashboardFinancieroConetcom;
