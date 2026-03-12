import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import styles from '../../../styles/Dashboards/dashboards-conetcom/DashboardGeneral.module.css';
import { obtenerConetcomClientes } from '../../../api/DashboardsApis/dashboards-conetcom/Dashboardconetcomclientes';
import { obtenerConetcomPlanes } from '../../../api/DashboardsApis/dashboards-conetcom/Dashboardconetcom_planes';
import { obtenerConetcomFacturacion } from '../../../api/DashboardsApis/dashboards-conetcom/Dashboardconetcom_facturacion';
import { obtenerPrediccionChurnRate } from '../../../api/DashboardsApis/dashboards-conetcom/Predicciones';

const toList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

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

const DashboardGeneralConectcom = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [loadingMrr, setLoadingMrr] = useState(false);
  const [mrrError, setMrrError] = useState('');
  const [showAccesos, setShowAccesos] = useState(false);
  const now = new Date();
  const [churnMonth, setChurnMonth] = useState(now.getMonth());
  const [churnYear, setChurnYear] = useState(now.getFullYear());
  const [predictionHorizon, setPredictionHorizon] = useState(3);
  const [prediccionChurn, setPrediccionChurn] = useState(null);
  const [predLoading, setPredLoading] = useState(false);
  const [predError, setPredError] = useState('');

  const accesos = [
    { label: 'Conetcom Clientes', path: '/Crud/Dashboard/ConetcomClientes' },
    { label: 'Conetcom Campana', path: '/Crud/Dashboard/ConetcomCampana' },
    { label: 'Conetcom Facturacion', path: '/Crud/Dashboard/ConetcomFacturacion' },
    { label: 'Conetcom Interacciones Campanas', path: '/Crud/Dashboard/ConetcomInteraccionesCampanas' },
    { label: 'Conetcom Pagos', path: '/Crud/Dashboard/ConetcomPagos' },
    { label: 'Conetcom Planes', path: '/Crud/Dashboard/ConetcomPlanes' },
    { label: 'Conetcom Tickets Soporte', path: '/Crud/Dashboard/ConetcomTicketsSoporte' },
    { label: 'Conetcom Trafico Consumo', path: '/Crud/Dashboard/ConetcomTraficoConsumo' },
  ];

  useEffect(() => {
    const cargarMrr = async () => {
      try {
        setLoadingMrr(true);
        setMrrError('');
        const [clientesRes, planesRes, facturasRes] = await Promise.all([
          obtenerConetcomClientes(),
          obtenerConetcomPlanes(),
          obtenerConetcomFacturacion(),
        ]);
        setClientes(toList(clientesRes));
        setPlanes(toList(planesRes));
        setFacturas(toList(facturasRes));
      } catch (err) {
        setMrrError(err?.message || 'No se pudo calcular el MRR.');
      } finally {
        setLoadingMrr(false);
      }
    };

    cargarMrr();
  }, []);

  useEffect(() => {
    let activo = true;

    const cargarPrediccion = async () => {
      try {
        setPredLoading(true);
        setPredError('');
        const data = await obtenerPrediccionChurnRate({ horizonte: predictionHorizon });
        if (!activo) return;
        setPrediccionChurn(data);
      } catch (err) {
        if (!activo) return;
        setPrediccionChurn(null);
        setPredError(err?.message || 'No se pudo obtener la prediccion de churn rate.');
      } finally {
        if (!activo) return;
        setPredLoading(false);
      }
    };

    cargarPrediccion();
    return () => {
      activo = false;
    };
  }, [predictionHorizon]);

  const {
    mrr,
    arpuTeorico,
    arpuReal,
    churnRate,
    churnRateSeries,
    netGrowthCount,
    netGrowthMoney,
    netGrowthSeries,
    ventasPorCanal,
    ventasPorRegion,
    activosActuales,
    canceladosActuales,
  } = useMemo(() => {
    const toDate = (value) => {
      if (!value) return null;
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    const planesPorId = new Map(
      planes.map((plan) => [String(plan.id_plan), Number(plan.precio_mensual) || 0]),
    );

    const activos = clientes.filter((c) => String(c.estado_cliente || '').toLowerCase() === 'activo');
    const activosCount = activos.length;

    const totalMrr = activos.reduce((acc, cliente) => {
      const idPlan = cliente?.id_plan_contratado ? String(cliente.id_plan_contratado) : '';
      return acc + (planesPorId.get(idPlan) || 0);
    }, 0);

    const arpuTeoricoValue = activosCount > 0 ? totalMrr / activosCount : 0;

    const activosIds = new Set(activos.map((cliente) => String(cliente.id_cliente || '')));
    const totalPagado = facturas.reduce((acc, factura) => {
      const idCliente = factura?.id_cliente ? String(factura.id_cliente) : '';
      if (!activosIds.has(idCliente)) return acc;
      return acc + (Number(factura.valor_pagado) || 0);
    }, 0);
    const arpuRealValue = activosCount > 0 ? totalPagado / activosCount : 0;

    const isInMonth = (value, year, month) => {
      const d = toDate(value);
      if (!d) return false;
      const inicio = new Date(year, month, 1);
      const siguiente = new Date(year, month + 1, 1);
      return d >= inicio && d < siguiente;
    };

    const computeChurnRateForMonth = (year, month) => {
      const inicio = new Date(year, month, 1);
      const siguiente = new Date(year, month + 1, 1);

      const clientesInicioMes = clientes.filter((cliente) => {
        const fechaAlta = toDate(cliente.fecha_alta_cliente);
        const fechaFin = toDate(cliente.fecha_finalizacion_contrato);
        const altaAntesDeMes = Boolean(fechaAlta && fechaAlta < inicio);
        const noCanceladoAntesDeMes = !fechaFin || fechaFin >= inicio;
        return altaAntesDeMes && noCanceladoAntesDeMes;
      });

      const canceladosMes = clientes.filter((cliente) => {
        const cancelado = String(cliente.estado_cliente || '').toLowerCase() === 'cancelado';
        const fechaFin = toDate(cliente.fecha_finalizacion_contrato);
        const canceladoEnMes = Boolean(fechaFin && fechaFin >= inicio && fechaFin < siguiente);
        return cancelado && canceladoEnMes;
      });

      const activosInicioMesCount = clientesInicioMes.length;
      const canceladosMesCount = canceladosMes.length;
      return activosInicioMesCount > 0 ? (canceladosMesCount / activosInicioMesCount) * 100 : 0;
    };

    const sumValorPagadoForIdsInMonth = (ids, year, month) =>
      facturas.reduce((acc, factura) => {
        const idCliente = factura?.id_cliente ? String(factura.id_cliente) : '';
        if (!ids.has(idCliente)) return acc;
        const fecha = factura.fecha_pago || factura.fecha_emision;
        if (!isInMonth(fecha, year, month)) return acc;
        return acc + (Number(factura.valor_pagado) || 0);
      }, 0);

    const computeNetGrowthForMonth = (year, month) => {
      const altasIds = new Set(
        clientes
          .filter((cliente) => isInMonth(cliente.fecha_alta_cliente, year, month))
          .map((cliente) => String(cliente.id_cliente || '')),
      );

      const canceladosIds = new Set(
        clientes
          .filter((cliente) => {
            const cancelado = String(cliente.estado_cliente || '').toLowerCase() === 'cancelado';
            return cancelado && isInMonth(cliente.fecha_finalizacion_contrato, year, month);
          })
          .map((cliente) => String(cliente.id_cliente || '')),
      );

      const netCountValue = altasIds.size - canceladosIds.size;
      const totalPagadoAltas = sumValorPagadoForIdsInMonth(altasIds, year, month);
      const totalPagadoCancelados = sumValorPagadoForIdsInMonth(canceladosIds, year, month);
      const netMoneyValue = totalPagadoAltas - totalPagadoCancelados;

      return { netCount: netCountValue, netMoney: netMoneyValue };
    };

    const churnRateSeriesValue = MESES.map((mes, index) => ({
      mes: mes.slice(0, 3),
      churnRate: computeChurnRateForMonth(churnYear, index),
    }));

    const churnRateValue = churnRateSeriesValue[churnMonth]?.churnRate ?? 0;
    const netGrowthSeriesValue = MESES.map((mes, index) => {
      const net = computeNetGrowthForMonth(churnYear, index);
      return { mes: mes.slice(0, 3), netCount: net.netCount, netMoney: net.netMoney };
    });
    const selectedNet = netGrowthSeriesValue[churnMonth] || { netCount: 0, netMoney: 0 };

    const clientesPorId = new Map(
      clientes.map((cliente) => [
        String(cliente.id_cliente),
        {
          canal: cliente.canal_adquisicion || 'sin_canal',
          region: cliente.region_departamento || 'sin_region',
        },
      ]),
    );

    const ventasPorCanalMap = new Map();
    const ventasPorRegionMap = new Map();

    facturas.forEach((factura) => {
      const fecha = factura.fecha_pago || factura.fecha_emision;
      if (!isInMonth(fecha, churnYear, churnMonth)) return;
      const idCliente = factura?.id_cliente ? String(factura.id_cliente) : '';
      const clienteInfo = clientesPorId.get(idCliente) || { canal: 'sin_canal', region: 'sin_region' };
      const valor = Number(factura.valor_total_facturado) || 0;

      ventasPorCanalMap.set(clienteInfo.canal, (ventasPorCanalMap.get(clienteInfo.canal) || 0) + valor);
      ventasPorRegionMap.set(clienteInfo.region, (ventasPorRegionMap.get(clienteInfo.region) || 0) + valor);
    });

    const ventasPorCanalValue = Array.from(ventasPorCanalMap.entries())
      .map(([canal, valor]) => ({ canal, valor }))
      .sort((a, b) => b.valor - a.valor);

    const ventasPorRegionValue = Array.from(ventasPorRegionMap.entries())
      .map(([region, valor]) => ({ region, valor }))
      .sort((a, b) => b.valor - a.valor);

    const activosActualesCount = activosCount;
    const canceladosActualesCount = clientes.filter(
      (cliente) => String(cliente.estado_cliente || '').toLowerCase() === 'cancelado',
    ).length;

    return {
      mrr: totalMrr,
      arpuTeorico: arpuTeoricoValue,
      arpuReal: arpuRealValue,
      churnRate: churnRateValue,
      churnRateSeries: churnRateSeriesValue,
      netGrowthCount: selectedNet.netCount,
      netGrowthMoney: selectedNet.netMoney,
      netGrowthSeries: netGrowthSeriesValue,
      ventasPorCanal: ventasPorCanalValue,
      ventasPorRegion: ventasPorRegionValue,
      activosActuales: activosActualesCount,
      canceladosActuales: canceladosActualesCount,
    };
  }, [clientes, planes, facturas, churnMonth, churnYear]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value || 0);

  const formatPercent = (value) => `${(value || 0).toFixed(2)}%`;
  const formatMonthLabel = (ano, mes) => {
    const label = MESES[mes - 1] || '';
    const shortYear = String(ano).slice(-2);
    return `${label.slice(0, 3)} ${shortYear}`;
  };

  const predictionBaseYear = prediccionChurn?.base_year;
  const predictionBaseMonth = prediccionChurn?.base_month;
  const predictionLastLabel =
    predictionBaseYear && predictionBaseMonth
      ? `${MESES[predictionBaseMonth - 1]} ${predictionBaseYear}`
      : '';
  const showPrediction = Boolean(prediccionChurn && predictionBaseYear === churnYear);

  const churnChartData = useMemo(() => {
    if (!prediccionChurn || !showPrediction || !Array.isArray(prediccionChurn.historico_base)) {
      return churnRateSeries.map((item) => ({
        label: item.mes,
        churnRate: item.churnRate,
        churnPred: null,
      }));
    }

    const historico = prediccionChurn.historico_base;
    const chartData = historico.map((item) => ({
      label: formatMonthLabel(item.ano, item.mes),
      churnRate: item.churn_rate,
      churnPred: null,
    }));

    const lastHist = historico[historico.length - 1];
    if (lastHist && chartData.length) {
      chartData[chartData.length - 1].churnPred = lastHist.churn_rate;
    }

    (prediccionChurn.predicciones || []).forEach((pred) => {
      chartData.push({
        label: formatMonthLabel(pred.ano, pred.mes),
        churnRate: null,
        churnPred: pred.churn_rate,
      });
    });

    return chartData;
  }, [prediccionChurn, churnRateSeries, showPrediction]);

  const churnTableRows = useMemo(() => {
    if (!prediccionChurn || !Array.isArray(prediccionChurn.historico_base)) return [];
    const historico = prediccionChurn.historico_base.map((item) => ({
      ano: item.ano,
      mes: MESES[item.mes - 1] || '',
      churn_rate: item.churn_rate,
      tipo: 'historico',
    }));
    const predRows = (prediccionChurn.predicciones || []).map((item) => ({
      ano: item.ano,
      mes: MESES[item.mes - 1] || '',
      churn_rate: item.churn_rate,
      tipo: 'prediccion',
    }));
    return [...historico, ...predRows];
  }, [prediccionChurn]);
  const selectedPeriod = `${MESES[churnMonth]} ${churnYear}`;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.eyebrow}>Conetcom</p>
          <h1 className={styles.title}>Dashboard general</h1>
          <p className={styles.subtitle}>Indicadores clave y desempeno mensual.</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.headerBadge}>
            <span className={styles.badgeLabel}>Periodo</span>
            <strong className={styles.badgeValue}>{selectedPeriod}</strong>
          </div>
          <div className={styles.accessMenu}>
            <button
              type="button"
              className={styles.accessButton}
              onClick={() => setShowAccesos((prev) => !prev)}
              aria-expanded={showAccesos}
              aria-haspopup="menu"
            >
              Accesos rapido
            </button>
            {showAccesos ? (
              <div className={styles.accessDropdown} role="menu">
                {accesos.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    className={styles.accessItem}
                    onClick={() => {
                      setShowAccesos(false);
                      navigate(item.path);
                    }}
                    role="menuitem"
                  >
                    <span>{item.label}</span>
                    <span className={styles.quickArrow}>&gt;</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {mrrError ? <div className={styles.errorBanner}>{mrrError}</div> : null}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Indicadores</h2>
          <p className={styles.sectionHint}>Valores calculados con clientes activos y facturacion.</p>
        </div>
        <div className={styles.kpiGrid}>
          <article className={styles.card}>
            <p className={styles.cardLabel}>Ingresos mensuales recurrentes (MRR)</p>
            {loadingMrr ? (
              <p className={styles.cardValueMuted}>Cargando...</p>
            ) : mrrError ? (
              <p className={styles.cardValueMuted}>--</p>
            ) : (
              <p className={styles.cardValue}>{formatCurrency(mrr)}</p>
            )}
          </article>
          <article className={styles.card}>
            <p className={styles.cardLabel}>Ingreso promedio por cliente (ARPU)</p>
            {loadingMrr ? (
              <p className={styles.cardValueMuted}>Cargando...</p>
            ) : mrrError ? (
              <p className={styles.cardValueMuted}>--</p>
            ) : (
              <p className={styles.cardValue}>{formatCurrency(arpuTeorico)}</p>
            )}
          </article>
          <article className={styles.card}>
            <p className={styles.cardLabel}>ARPU real</p>
            {loadingMrr ? (
              <p className={styles.cardValueMuted}>Cargando...</p>
            ) : mrrError ? (
              <p className={styles.cardValueMuted}>--</p>
            ) : (
              <p className={styles.cardValue}>{formatCurrency(arpuReal)}</p>
            )}
          </article>
          <article className={styles.card}>
            <p className={styles.cardLabel}>Clientes activos vs cancelados</p>
            {loadingMrr ? (
              <p className={styles.cardValueMuted}>Cargando...</p>
            ) : mrrError ? (
              <p className={styles.cardValueMuted}>--</p>
            ) : (
              <p className={styles.cardValue}>
                {activosActuales} / {canceladosActuales}
              </p>
            )}
            <p className={styles.cardHint}>Activos / Cancelados</p>
          </article>
          <article className={styles.card}>
            <p className={styles.cardLabel}>Crecimiento neto del mes</p>
            {loadingMrr ? (
              <p className={styles.cardValueMuted}>Cargando...</p>
            ) : mrrError ? (
              <p className={styles.cardValueMuted}>--</p>
            ) : (
              <div className={styles.cardRow}>
                <div>
                  <span className={styles.cardMeta}>Cantidad</span>
                  <span className={styles.cardValueSm}>{netGrowthCount}</span>
                </div>
                <div>
                  <span className={styles.cardMeta}>Dinero</span>
                  <span className={styles.cardValueSm}>{formatCurrency(netGrowthMoney)}</span>
                </div>
              </div>
            )}
          </article>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Churn y crecimiento</h2>
          <p className={styles.sectionHint}>Filtra por mes y ano para actualizar los calculos.</p>
        </div>
        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Mes</span>
            <select
              className={styles.filterControl}
              value={churnMonth}
              onChange={(e) => setChurnMonth(Number(e.target.value))}
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
              value={churnYear}
              onChange={(e) => setChurnYear(Number(e.target.value))}
            />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Prediccion (meses)</span>
            <div className={styles.predictionButtons}>
              {[1, 3, 6].map((valor) => (
                <button
                  key={valor}
                  type="button"
                  className={`${styles.predictionButton} ${
                    predictionHorizon === valor ? styles.predictionButtonActive : ''
                  }`}
                  onClick={() => setPredictionHorizon(valor)}
                >
                  {valor}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Churn Rate</span>
            {loadingMrr ? (
              <span className={styles.filterValueMuted}>Cargando...</span>
            ) : mrrError ? (
              <span className={styles.filterValueMuted}>--</span>
            ) : (
              <span className={styles.filterValue}>{formatPercent(churnRate)}</span>
            )}
          </div>
        </div>
        <div className={styles.chartGrid}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>Churn Rate por mes</h3>
              <span className={styles.chartBadge}>
                {showPrediction ? predictionBaseYear : churnYear}
              </span>
            </div>
            {predLoading ? (
              <p className={styles.chartMeta}>Cargando prediccion...</p>
            ) : predError ? (
              <p className={styles.chartMetaError}>{predError}</p>
            ) : prediccionChurn && showPrediction ? (
              <p className={styles.chartMeta}>
                Prediccion {predictionHorizon} meses - Ultimo dato: {predictionLastLabel}
              </p>
            ) : prediccionChurn ? (
              <p className={styles.chartMeta}>
                Prediccion disponible para {predictionBaseYear}.
              </p>
            ) : null}
            {loadingMrr ? (
              <p className={styles.chartLoading}>Cargando grafica...</p>
            ) : mrrError ? (
              <p className={styles.chartLoading}>Sin datos.</p>
            ) : (
              <div className={styles.chartBody}>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={churnChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
                    {showPrediction ? <Legend /> : null}
                    <Line
                      type="monotone"
                      dataKey="churnRate"
                      name="Churn rate"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    {showPrediction ? (
                      <Line
                        type="monotone"
                        dataKey="churnPred"
                        name="Prediccion"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        strokeDasharray="5 5"
                      />
                    ) : null}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>Crecimiento neto por mes</h3>
              <span className={styles.chartBadge}>{churnYear}</span>
            </div>
            {loadingMrr ? (
              <p className={styles.chartLoading}>Cargando grafica...</p>
            ) : mrrError ? (
              <p className={styles.chartLoading}>Sin datos.</p>
            ) : (
              <div className={styles.chartBody}>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={netGrowthSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      formatter={(value, name) =>
                        name === 'Dinero' ? formatCurrency(value) : value
                      }
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="netCount"
                      name="Cantidad"
                      stroke="#0f766e"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="netMoney"
                      name="Dinero"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
        <div className={styles.tableGrid}>
          <div className={styles.tableCard}>
            <div className={styles.chartHeader}>
              <h3 className={styles.tableTitle}>Tabla churn rate + prediccion</h3>
              {prediccionChurn ? (
                <span className={styles.chartBadge}>{prediccionChurn.base_year}</span>
              ) : null}
            </div>
            {predLoading ? (
              <p className={styles.tableEmpty}>Cargando prediccion...</p>
            ) : predError ? (
              <p className={styles.tableEmpty}>{predError}</p>
            ) : churnTableRows.length === 0 ? (
              <p className={styles.tableEmpty}>Sin datos de prediccion.</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Ano</th>
                      <th>Mes</th>
                      <th>% Churn Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {churnTableRows.map((row, index) => (
                      <tr
                        key={`${row.ano}-${row.mes}-${index}`}
                        className={row.tipo === 'prediccion' ? styles.predictionRow : undefined}
                      >
                        <td>{row.ano}</td>
                        <td>{row.mes}</td>
                        <td>{formatPercent(row.churn_rate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Ventas facturadas</h2>
          <p className={styles.sectionHint}>Valores por canal y region del mes seleccionado.</p>
        </div>
        <div className={styles.tableGrid}>
          <div className={styles.tableCard}>
            <h3 className={styles.tableTitle}>Ventas por canal</h3>
            {loadingMrr ? (
              <p className={styles.tableEmpty}>Cargando ventas por canal...</p>
            ) : mrrError ? (
              <p className={styles.tableEmpty}>Sin datos.</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Canal</th>
                      <th>Valor facturado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventasPorCanal.length === 0 ? (
                      <tr>
                        <td colSpan="2">Sin datos del mes seleccionado.</td>
                      </tr>
                    ) : (
                      ventasPorCanal.map((item) => (
                        <tr key={item.canal}>
                          <td>{item.canal}</td>
                          <td>{formatCurrency(item.valor)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className={styles.tableCard}>
            <h3 className={styles.tableTitle}>Ventas por region</h3>
            {loadingMrr ? (
              <p className={styles.tableEmpty}>Cargando ventas por region...</p>
            ) : mrrError ? (
              <p className={styles.tableEmpty}>Sin datos.</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Region</th>
                      <th>Valor facturado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventasPorRegion.length === 0 ? (
                      <tr>
                        <td colSpan="2">Sin datos del mes seleccionado.</td>
                      </tr>
                    ) : (
                      ventasPorRegion.map((item) => (
                        <tr key={item.region}>
                          <td>{item.region}</td>
                          <td>{formatCurrency(item.valor)}</td>
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

export default DashboardGeneralConectcom;
