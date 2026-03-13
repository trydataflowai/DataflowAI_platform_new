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
import { obtenerPrediccionUpselling } from '../../../api/DashboardsApis/dashboards-conetcom/Predicciones';

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
  const [upsellHorizon, setUpsellHorizon] = useState(3);
  const [upsellData, setUpsellData] = useState(null);
  const [upsellLoading, setUpsellLoading] = useState(false);
  const [upsellError, setUpsellError] = useState('');

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

  useEffect(() => {
    let mounted = true;

    const cargarPrediccion = async () => {
      try {
        setUpsellLoading(true);
        setUpsellError('');
        const data = await obtenerPrediccionUpselling({ horizonte: upsellHorizon });
        if (!mounted) return;
        setUpsellData(data);
      } catch (err) {
        if (!mounted) return;
        setUpsellData(null);
        setUpsellError(err?.message || 'No se pudo obtener la prediccion de upselling.');
      } finally {
        if (mounted) setUpsellLoading(false);
      }
    };

    cargarPrediccion();
    return () => {
      mounted = false;
    };
  }, [upsellHorizon]);

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
  const formatMonthLabel = (ano, mes) => {
    const label = MESES[mes - 1] || '';
    const shortYear = String(ano).slice(-2);
    return `${label.slice(0, 3)} ${shortYear}`;
  };

  const upsellBaseYear = upsellData?.base_year;
  const upsellBaseMonth = upsellData?.base_month;
  const upsellLastLabel =
    upsellBaseYear && upsellBaseMonth
      ? `${MESES[upsellBaseMonth - 1]} ${upsellBaseYear}`
      : '';
  const showForecast = Boolean(upsellData && upsellBaseYear === selectedYear);

  const ventasForecastData = useMemo(() => {
    if (!upsellData || !showForecast || !Array.isArray(upsellData.historico_facturacion)) {
      return ventasSeries.map((item) => ({
        label: item.mes,
        facturado: item.facturado,
        forecast: null,
      }));
    }

    const historico = upsellData.historico_facturacion;
    const data = historico.map((item) => ({
      label: formatMonthLabel(item.ano, item.mes),
      facturado: item.total_facturado,
      forecast: null,
    }));

    const lastHist = historico[historico.length - 1];
    if (lastHist && data.length) {
      data[data.length - 1].forecast = lastHist.total_facturado;
    }

    (upsellData.predicciones_facturacion || []).forEach((pred) => {
      data.push({
        label: formatMonthLabel(pred.ano, pred.mes),
        facturado: null,
        forecast: pred.total_facturado,
      });
    });

    return data;
  }, [upsellData, ventasSeries, showForecast]);

  const upsellRows = useMemo(() => {
    if (!upsellData || !Array.isArray(upsellData.oportunidades)) return [];
    return upsellData.oportunidades.map((item) => ({
      id: item.id_cliente,
      nombre: item.nombre_cliente,
      oportunidad: item.oportunidad,
    }));
  }, [upsellData]);
  const periodoLabel = `${MESES[selectedMonth]} ${selectedYear}`;

  return (
    <div className="container_vta_conetcom">
      <header className="header_vta_conetcom">
        <div className="headerText_vta_conetcom">
          <p className="eyebrow_vta_conetcom">Conetcom</p>
          <h1 className="title_vta_conetcom">Dashboard de ventas</h1>
          <p className="subtitle_vta_conetcom">
            Seguimiento de facturacion, recaudo y campanas para el periodo seleccionado.
          </p>
        </div>
        <div className="headerActions_vta_conetcom">
          <div className="headerBadge_vta_conetcom">
            <span className="badgeLabel_vta_conetcom">Periodo</span>
            <strong className="badgeValue_vta_conetcom">{periodoLabel}</strong>
          </div>
          <div className="headerBadge_vta_conetcom">
            <span className="badgeLabel_vta_conetcom">Conversion</span>
            <strong className="badgeValue_vta_conetcom">{formatPercent(conversionRateMes)}</strong>
          </div>
        </div>
      </header>

      {error ? <div className="errorBanner_vta_conetcom">{error}</div> : null}

      <section className="section_vta_conetcom">
        <div className="sectionHeader_vta_conetcom">
          <h2 className="sectionTitle_vta_conetcom">Filtros</h2>
          <p className="sectionHint_vta_conetcom">Selecciona el mes y ano para actualizar el reporte.</p>
        </div>
        <div className="filterRow_vta_conetcom">
          <div className="filterGroup_vta_conetcom">
            <span className="filterLabel_vta_conetcom">Mes</span>
            <select
              className="filterControl_vta_conetcom"
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
          <div className="filterGroup_vta_conetcom">
            <span className="filterLabel_vta_conetcom">Ano</span>
            <input
              className="filterControl_vta_conetcom"
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value) || now.getFullYear())}
            />
          </div>
          <div className="filterGroup_vta_conetcom">
            <span className="filterLabel_vta_conetcom">Prediccion (meses)</span>
            <div className="predictionButtons_vta_conetcom">
              {[1, 3, 6].map((valor) => (
                <button
                  key={valor}
                  type="button"
                  className={`predictionButton_vta_conetcom ${upsellHorizon === valor ? 'predictionButtonActive_vta_conetcom' : ''}`}
                  onClick={() => setUpsellHorizon(valor)}
                >
                  {valor}
                </button>
              ))}
            </div>
          </div>
          <div className="filterGroup_vta_conetcom">
            <span className="filterLabel_vta_conetcom">Interacciones</span>
            {loading ? (
              <span className="filterValueMuted_vta_conetcom">Cargando...</span>
            ) : error ? (
              <span className="filterValueMuted_vta_conetcom">--</span>
            ) : (
              <span className="filterValue_vta_conetcom">{interaccionesMesTotal}</span>
            )}
          </div>
          <div className="filterGroup_vta_conetcom">
            <span className="filterLabel_vta_conetcom">Ingresos campanas</span>
            {loading ? (
              <span className="filterValueMuted_vta_conetcom">Cargando...</span>
            ) : error ? (
              <span className="filterValueMuted_vta_conetcom">--</span>
            ) : (
              <span className="filterValue_vta_conetcom">{formatCurrency(ingresosCampanasMes)}</span>
            )}
          </div>
        </div>
      </section>

      <section className="section_vta_conetcom">
        <div className="sectionHeader_vta_conetcom">
          <h2 className="sectionTitle_vta_conetcom">Indicadores</h2>
          <p className="sectionHint_vta_conetcom">Resumen del mes seleccionado.</p>
        </div>
        <div className="kpiGrid_vta_conetcom">
          <article className="card_vta_conetcom">
            <p className="cardLabel_vta_conetcom">Facturacion del mes</p>
            {loading ? (
              <p className="cardValueMuted_vta_conetcom">Cargando...</p>
            ) : error ? (
              <p className="cardValueMuted_vta_conetcom">--</p>
            ) : (
              <p className="cardValue_vta_conetcom">{formatCurrency(totalFacturadoMes)}</p>
            )}
          </article>
          <article className="card_vta_conetcom">
            <p className="cardLabel_vta_conetcom">Recaudo del mes</p>
            {loading ? (
              <p className="cardValueMuted_vta_conetcom">Cargando...</p>
            ) : error ? (
              <p className="cardValueMuted_vta_conetcom">--</p>
            ) : (
              <p className="cardValue_vta_conetcom">{formatCurrency(totalRecaudadoMes)}</p>
            )}
          </article>
          <article className="card_vta_conetcom">
            <p className="cardLabel_vta_conetcom">Ticket promedio</p>
            {loading ? (
              <p className="cardValueMuted_vta_conetcom">Cargando...</p>
            ) : error ? (
              <p className="cardValueMuted_vta_conetcom">--</p>
            ) : (
              <p className="cardValue_vta_conetcom">{formatCurrency(ticketPromedio)}</p>
            )}
          </article>
          <article className="card_vta_conetcom">
            <p className="cardLabel_vta_conetcom">Nuevos clientes</p>
            {loading ? (
              <p className="cardValueMuted_vta_conetcom">Cargando...</p>
            ) : error ? (
              <p className="cardValueMuted_vta_conetcom">--</p>
            ) : (
              <p className="cardValue_vta_conetcom">{nuevosClientes}</p>
            )}
            <p className="cardHint_vta_conetcom">Altas registradas en el periodo.</p>
          </article>
        </div>
      </section>

      <section className="section_vta_conetcom">
        <div className="sectionHeader_vta_conetcom">
          <h2 className="sectionTitle_vta_conetcom">Ventas y recaudo</h2>
          <p className="sectionHint_vta_conetcom">Evolucion mensual para el ano seleccionado.</p>
        </div>
        <div className="chartGrid_vta_conetcom">
          <div className="chartCard_vta_conetcom">
            <div className="chartHeader_vta_conetcom">
              <h3 className="chartTitle_vta_conetcom">Facturacion mensual</h3>
              <span className="chartBadge_vta_conetcom">{showForecast ? upsellBaseYear : selectedYear}</span>
            </div>
            {upsellLoading ? (
              <p className="chartMeta_vta_conetcom">Cargando prediccion...</p>
            ) : upsellError ? (
              <p className="chartMetaError_vta_conetcom">{upsellError}</p>
            ) : upsellData && showForecast ? (
              <p className="chartMeta_vta_conetcom">
                Prediccion {upsellHorizon} meses - Ultimo dato: {upsellLastLabel}
              </p>
            ) : upsellData ? (
              <p className="chartMeta_vta_conetcom">Prediccion disponible para {upsellBaseYear}.</p>
            ) : null}
            {loading ? (
              <p className="chartLoading_vta_conetcom">Cargando grafica...</p>
            ) : error ? (
              <p className="chartLoading_vta_conetcom">Sin datos.</p>
            ) : (
              <div className="chartBody_vta_conetcom">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={ventasForecastData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    {showForecast ? <Legend /> : null}
                    <Line
                      type="monotone"
                      dataKey="facturado"
                      name="Facturado"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    {showForecast ? (
                      <Line
                        type="monotone"
                        dataKey="forecast"
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
          <div className="chartCard_vta_conetcom">
            <div className="chartHeader_vta_conetcom">
              <h3 className="chartTitle_vta_conetcom">Recaudo mensual</h3>
              <span className="chartBadge_vta_conetcom">{selectedYear}</span>
            </div>
            {loading ? (
              <p className="chartLoading_vta_conetcom">Cargando grafica...</p>
            ) : error ? (
              <p className="chartLoading_vta_conetcom">Sin datos.</p>
            ) : (
              <div className="chartBody_vta_conetcom">
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
          <div className="chartCard_vta_conetcom">
            <div className="chartHeader_vta_conetcom">
              <h3 className="chartTitle_vta_conetcom">Conversion de campanas</h3>
              <span className="chartBadge_vta_conetcom">{selectedYear}</span>
            </div>
            {loading ? (
              <p className="chartLoading_vta_conetcom">Cargando grafica...</p>
            ) : error ? (
              <p className="chartLoading_vta_conetcom">Sin datos.</p>
            ) : (
              <div className="chartBody_vta_conetcom">
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

      <section className="section_vta_conetcom">
        <div className="sectionHeader_vta_conetcom">
          <h2 className="sectionTitle_vta_conetcom">Upselling</h2>
          <p className="sectionHint_vta_conetcom">Oportunidad de recompra o mejora de plan por cliente.</p>
        </div>
        <div className="tableGrid_vta_conetcom">
          <div className="tableCard_vta_conetcom">
            <div className="chartHeader_vta_conetcom">
              <h3 className="tableTitle_vta_conetcom">Tabla de oportunidades</h3>
              {upsellData ? <span className="chartBadge_vta_conetcom">{upsellData.base_year}</span> : null}
            </div>
            {upsellLoading ? (
              <p className="tableEmpty_vta_conetcom">Cargando prediccion...</p>
            ) : upsellError ? (
              <p className="tableEmpty_vta_conetcom">{upsellError}</p>
            ) : upsellRows.length === 0 ? (
              <p className="tableEmpty_vta_conetcom">Sin datos de oportunidad.</p>
            ) : (
              <div className="tableWrap_vta_conetcom">
                <table className="table_vta_conetcom">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>% Oportunidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upsellRows.map((row) => (
                      <tr key={row.id} className={row.oportunidad >= 70 ? 'predictionRow_vta_conetcom' : undefined}>
                        <td>{row.nombre}</td>
                        <td>{formatPercent(row.oportunidad)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section_vta_conetcom">
        <div className="sectionHeader_vta_conetcom">
          <h2 className="sectionTitle_vta_conetcom">Canales y campanas</h2>
          <p className="sectionHint_vta_conetcom">Distribucion de ventas y funnel de interacciones.</p>
        </div>
        <div className="chartGrid_vta_conetcom">
          <div className="chartCard_vta_conetcom">
            <div className="chartHeader_vta_conetcom">
              <h3 className="chartTitle_vta_conetcom">Ventas por canal</h3>
              <span className="chartBadge_vta_conetcom">{periodoLabel}</span>
            </div>
            {loading ? (
              <p className="chartLoading_vta_conetcom">Cargando grafica...</p>
            ) : error ? (
              <p className="chartLoading_vta_conetcom">Sin datos.</p>
            ) : ventasPorCanal.length === 0 ? (
              <p className="chartLoading_vta_conetcom">Sin ventas para el periodo.</p>
            ) : (
              <div className="chartBody_vta_conetcom">
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
          <div className="chartCard_vta_conetcom">
            <div className="chartHeader_vta_conetcom">
              <h3 className="chartTitle_vta_conetcom">Funnel de campanas</h3>
              <span className="chartBadge_vta_conetcom">{periodoLabel}</span>
            </div>
            {loading ? (
              <p className="chartLoading_vta_conetcom">Cargando grafica...</p>
            ) : error ? (
              <p className="chartLoading_vta_conetcom">Sin datos.</p>
            ) : (
              <div className="chartBody_vta_conetcom">
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

      <section className="section_vta_conetcom">
        <div className="sectionHeader_vta_conetcom">
          <h2 className="sectionTitle_vta_conetcom">Detalle por clientes y campanas</h2>
          <p className="sectionHint_vta_conetcom">Top clientes y rendimiento de campanas.</p>
        </div>
        <div className="tableGrid_vta_conetcom">
          <div className="tableCard_vta_conetcom">
            <h3 className="tableTitle_vta_conetcom">Top clientes por facturacion</h3>
            {loading ? (
              <p className="tableEmpty_vta_conetcom">Cargando clientes...</p>
            ) : error ? (
              <p className="tableEmpty_vta_conetcom">Sin datos.</p>
            ) : (
              <div className="tableWrap_vta_conetcom">
                <table className="table_vta_conetcom">
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
          <div className="tableCard_vta_conetcom">
            <h3 className="tableTitle_vta_conetcom">Campanas con mayor rendimiento</h3>
            {loading ? (
              <p className="tableEmpty_vta_conetcom">Cargando campanas...</p>
            ) : error ? (
              <p className="tableEmpty_vta_conetcom">Sin datos.</p>
            ) : (
              <div className="tableWrap_vta_conetcom">
                <table className="table_vta_conetcom">
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
