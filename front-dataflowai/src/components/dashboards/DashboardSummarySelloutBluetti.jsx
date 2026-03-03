import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactECharts from "echarts-for-react";
import { useNavigate } from "react-router-dom";
import {
  getDashboardSummarySelloutBluettiData,
  monthKey,
  normalizeDate,
  toNumber,
} from "../../api/DashboardsApis/DashboardSummarySelloutBluetti";
import "../../styles/Dashboards/DashboardSummarySelloutBluetti.css";
import { BLUETTI_MODULE_LINKS } from "../../constants/moduleMenus";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const numberFmt = new Intl.NumberFormat("es-CO");
const decimalFmt = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function formatMonth(month) {
  if (!month || month.length !== 7) return month || "-";
  const [year, m] = month.split("-");
  return `${m}/${year}`;
}

function formatVariation(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "N/A";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function daysBetweenInclusive(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

export default function DashboardSummarySelloutBluetti() {
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const [rawData, setRawData] = useState({ ventas: [], inventarios: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [filters, setFilters] = useState({
    fechaDesde: "",
    fechaHasta: "",
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getDashboardSummarySelloutBluettiData();
        if (!mounted) return;
        setRawData({
          ventas: Array.isArray(data?.ventas) ? data.ventas : [],
          inventarios: Array.isArray(data?.inventarios) ? data.inventarios : [],
        });
      } catch (err) {
        if (!mounted) return;
        setError("No fue posible cargar el Dashboard Summary Sellout Bluetti.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!showMenu) return;
    const onOutside = (event) => {
      if (!menuRef.current || menuRef.current.contains(event.target)) return;
      setShowMenu(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [showMenu]);

  const ventasEnriched = useMemo(() => {
    return rawData.ventas.map((v) => ({
      ...v,
      fecha_venta_norm: normalizeDate(v.fecha_venta),
      cantidad_num: toNumber(v.cantidad),
      total_ventas_num: toNumber(v.total_ventas),
      producto_key: (v.producto || v.sku || "Sin producto").trim(),
      tienda_key: (v.punto_venta || "Sin tienda").trim(),
    }));
  }, [rawData.ventas]);

  const inventariosEnriched = useMemo(() => {
    return rawData.inventarios.map((i) => ({
      ...i,
      fecha_inventario_norm: normalizeDate(i.fecha_inventario),
      unidades_inventario_num: toNumber(i.unidades_inventario),
      producto_key: (i.producto || i.sku || "Sin producto").trim(),
      tienda_key: (i.punto_venta || "Sin tienda").trim(),
    }));
  }, [rawData.inventarios]);

  const ventasFiltradas = useMemo(() => {
    return ventasEnriched.filter((v) => {
      if (filters.fechaDesde && v.fecha_venta_norm && v.fecha_venta_norm < filters.fechaDesde) return false;
      if (filters.fechaHasta && v.fecha_venta_norm && v.fecha_venta_norm > filters.fechaHasta) return false;
      return true;
    });
  }, [ventasEnriched, filters]);

  const inventariosFiltrados = useMemo(() => {
    return inventariosEnriched.filter((i) => {
      if (filters.fechaDesde && i.fecha_inventario_norm && i.fecha_inventario_norm < filters.fechaDesde) return false;
      if (filters.fechaHasta && i.fecha_inventario_norm && i.fecha_inventario_norm > filters.fechaHasta) return false;
      return true;
    });
  }, [inventariosEnriched, filters]);

  const totalUnidadesVendidas = useMemo(
    () => ventasFiltradas.reduce((acc, v) => acc + v.cantidad_num, 0),
    [ventasFiltradas]
  );

  const diasPeriodoAnalisis = useMemo(() => {
    if (filters.fechaDesde && filters.fechaHasta) {
      return daysBetweenInclusive(filters.fechaDesde, filters.fechaHasta);
    }
    const fechasVentas = ventasFiltradas.map((v) => v.fecha_venta_norm).filter(Boolean).sort();
    if (!fechasVentas.length) {
      if (filters.fechaDesde || filters.fechaHasta) {
        const start = filters.fechaDesde || filters.fechaHasta;
        const end = filters.fechaHasta || filters.fechaDesde;
        return daysBetweenInclusive(start, end);
      }
      return 0;
    }
    const fechaInicio = filters.fechaDesde || fechasVentas[0];
    const fechaFin = filters.fechaHasta || fechasVentas[fechasVentas.length - 1];
    return daysBetweenInclusive(fechaInicio, fechaFin);
  }, [filters, ventasFiltradas]);

  const unidadesMesActual = useMemo(() => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return ventasEnriched
      .filter((v) => monthKey(v.fecha_venta_norm) === month)
      .reduce((acc, v) => acc + v.cantidad_num, 0);
  }, [ventasEnriched]);

  const ventasDiariasPromedio = useMemo(() => {
    if (!diasPeriodoAnalisis) return 0;
    return totalUnidadesVendidas / diasPeriodoAnalisis;
  }, [totalUnidadesVendidas, diasPeriodoAnalisis]);

  const topProducto = useMemo(() => {
    const agg = {};
    ventasFiltradas.forEach((v) => {
      if (!agg[v.producto_key]) {
        agg[v.producto_key] = { producto: v.producto_key, unidades: 0, ventas: 0 };
      }
      agg[v.producto_key].unidades += v.cantidad_num;
      agg[v.producto_key].ventas += v.total_ventas_num;
    });
    const rows = Object.values(agg).sort((a, b) => b.unidades - a.unidades);
    return rows[0] || null;
  }, [ventasFiltradas]);

  const topTiendas = useMemo(() => {
    const agg = {};
    ventasFiltradas.forEach((v) => {
      if (!agg[v.tienda_key]) {
        agg[v.tienda_key] = { tienda: v.tienda_key, unidades: 0, ventas: 0 };
      }
      agg[v.tienda_key].unidades += v.cantidad_num;
      agg[v.tienda_key].ventas += v.total_ventas_num;
    });
    return Object.values(agg).sort((a, b) => b.ventas - a.ventas).slice(0, 10);
  }, [ventasFiltradas]);

  const historicoMes = useMemo(() => {
    const agg = {};
    ventasFiltradas.forEach((v) => {
      const month = monthKey(v.fecha_venta_norm);
      if (!month) return;
      if (!agg[month]) {
        agg[month] = { month, ventas: 0, unidades: 0 };
      }
      agg[month].ventas += v.total_ventas_num;
      agg[month].unidades += v.cantidad_num;
    });
    const rows = Object.values(agg).sort((a, b) => a.month.localeCompare(b.month));
    return rows.map((row, index) => {
      if (index === 0) return { ...row, variacion_pct: null };
      const prev = rows[index - 1].ventas;
      if (prev === 0) return { ...row, variacion_pct: null };
      return { ...row, variacion_pct: ((row.ventas - prev) / prev) * 100 };
    });
  }, [ventasFiltradas]);

  const totalVentas = useMemo(
    () => ventasFiltradas.reduce((acc, v) => acc + v.total_ventas_num, 0),
    [ventasFiltradas]
  );

  const analisisInventarioRows = useMemo(() => {
    const ventasAgg = {};
    ventasFiltradas.forEach((v) => {
      const key = `${v.tienda_key}||${v.producto_key}`;
      if (!ventasAgg[key]) {
        ventasAgg[key] = {
          punto_venta: v.tienda_key,
          producto: v.producto_key,
          unidades_vendidas: 0,
        };
      }
      ventasAgg[key].unidades_vendidas += v.cantidad_num;
    });

    const ultInventario = {};
    inventariosFiltrados.forEach((i) => {
      const key = `${i.tienda_key}||${i.producto_key}`;
      const prev = ultInventario[key];
      if (!prev || i.fecha_inventario_norm > prev.fecha_ultimo_inventario) {
        ultInventario[key] = {
          punto_venta: i.tienda_key,
          producto: i.producto_key,
          fecha_ultimo_inventario: i.fecha_inventario_norm,
          ultimo_inventario: i.unidades_inventario_num,
        };
      }
    });

    const keys = new Set([...Object.keys(ventasAgg), ...Object.keys(ultInventario)]);
    return Array.from(keys)
      .map((key) => {
        const venta = ventasAgg[key];
        const inv = ultInventario[key];
        const unidadesVendidas = venta?.unidades_vendidas ?? 0;
        const ventasPromedioDia = diasPeriodoAnalisis > 0 ? unidadesVendidas / diasPeriodoAnalisis : 0;
        const ultimoInventario = inv?.ultimo_inventario ?? null;
        const diasInventario =
          ventasPromedioDia > 0 && ultimoInventario !== null ? ultimoInventario / ventasPromedioDia : null;

        return {
          key,
          punto_venta: inv?.punto_venta || venta?.punto_venta || "Sin tienda",
          producto: inv?.producto || venta?.producto || "Sin producto",
          unidades_vendidas: unidadesVendidas,
          ventas_promedio_dia: ventasPromedioDia,
          ultimo_inventario: ultimoInventario,
          fecha_ultimo_inventario: inv?.fecha_ultimo_inventario || "",
          dias_inventario: diasInventario,
        };
      })
      .sort((a, b) => {
        if (b.unidades_vendidas !== a.unidades_vendidas) return b.unidades_vendidas - a.unidades_vendidas;
        return a.punto_venta.localeCompare(b.punto_venta);
      });
  }, [ventasFiltradas, inventariosFiltrados, diasPeriodoAnalisis]);

  const totalUltimoInventario = useMemo(
    () => analisisInventarioRows.reduce((acc, row) => acc + toNumber(row.ultimo_inventario), 0),
    [analisisInventarioRows]
  );

  const diasInventarioEstimadosTotales = useMemo(() => {
    if (!ventasDiariasPromedio) return null;
    return totalUltimoInventario / ventasDiariasPromedio;
  }, [totalUltimoInventario, ventasDiariasPromedio]);

  const topTiendasOption = useMemo(
    () => ({
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params) => {
          const item = Array.isArray(params) ? params[0] : params;
          if (!item) return "";
          return `<strong>${item.name}</strong><br/>Ventas: ${currency.format(toNumber(item.value))}`;
        },
      },
      xAxis: {
        type: "value",
        axisLabel: {
          color: "#93a5c6",
          formatter: (value) => `${Math.round(value / 1000000)}M`,
        },
      },
      yAxis: {
        type: "category",
        inverse: true,
        axisLabel: { color: "#dbe7ff", fontSize: 11 },
        data: topTiendas.map((t) => t.tienda),
      },
      grid: { top: 20, right: 18, bottom: 20, left: 170 },
      series: [
        {
          type: "bar",
          data: topTiendas.map((t) => Number(t.ventas.toFixed(2))),
          itemStyle: { color: "#22d3ee" },
          barMaxWidth: 16,
        },
      ],
    }),
    [topTiendas]
  );

  const historicoOption = useMemo(
    () => ({
      tooltip: {
        trigger: "axis",
        formatter: (params) => {
          const rows = Array.isArray(params) ? params : [params];
          const title = rows[0]?.axisValueLabel || "";
          const lines = [`<strong>${title}</strong>`];
          rows.forEach((row) => {
            if (row.seriesName === "Variacion %") {
              lines.push(`${row.marker}${row.seriesName}: ${formatVariation(toNumber(row.value))}`);
            } else {
              lines.push(`${row.marker}${row.seriesName}: ${currency.format(toNumber(row.value))}`);
            }
          });
          return lines.join("<br/>");
        },
      },
      legend: {
        top: 0,
        textStyle: { color: "#93a5c6" },
      },
      xAxis: {
        type: "category",
        data: historicoMes.map((m) => formatMonth(m.month)),
        axisLabel: { color: "#dbe7ff" },
      },
      yAxis: [
        {
          type: "value",
          name: "Ventas",
          axisLabel: {
            color: "#93a5c6",
            formatter: (value) => `${Math.round(value / 1000000)}M`,
          },
          splitLine: { lineStyle: { color: "rgba(147,165,198,.2)" } },
        },
        {
          type: "value",
          name: "Variacion %",
          axisLabel: {
            color: "#93a5c6",
            formatter: (value) => `${value}%`,
          },
          splitLine: { show: false },
        },
      ],
      grid: { left: 50, right: 50, top: 40, bottom: 36 },
      series: [
        {
          name: "Ventas",
          type: "line",
          smooth: true,
          data: historicoMes.map((m) => Number(m.ventas.toFixed(2))),
          lineStyle: { color: "#3b82f6", width: 3 },
          itemStyle: { color: "#60a5fa" },
          areaStyle: { color: "rgba(59,130,246,.2)" },
        },
        {
          name: "Variacion %",
          type: "bar",
          yAxisIndex: 1,
          data: historicoMes.map((m) => (m.variacion_pct === null ? null : Number(m.variacion_pct.toFixed(2)))),
          itemStyle: {
            color: (params) => (toNumber(params.value) >= 0 ? "#22c55e" : "#ef4444"),
          },
          barMaxWidth: 18,
        },
      ],
    }),
    [historicoMes]
  );

  if (loading) {
    return (
      <div className="DashboardSummarySelloutBluetti">
        <div className="DashboardSummarySelloutBluetti_loading">Cargando Dashboard Summary Sell Out...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="DashboardSummarySelloutBluetti">
        <div className="DashboardSummarySelloutBluetti_error">{error}</div>
      </div>
    );
  }

  return (
    <div className="DashboardSummarySelloutBluetti">
      <header className="DashboardSummarySelloutBluetti_header">
        <div className="DashboardSummarySelloutBluetti_header_top">
          <h2>Dashboard Summary Sell Out Bluetti</h2>
          <div className="DashboardSummarySelloutBluetti_nav_wrapper" ref={menuRef}>
            <button className="DashboardSummarySelloutBluetti_nav_btn" onClick={() => setShowMenu((v) => !v)}>
              Menu de modulos
            </button>
            {showMenu && (
              <div className="DashboardSummarySelloutBluetti_nav_menu">
                {BLUETTI_MODULE_LINKS.map((link) => (
                  <button
                    key={link.path}
                    onClick={() => {
                      setShowMenu(false);
                      navigate(link.path);
                    }}
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <p>Analisis comercial de ventas Sell Out por producto y por punto de venta.</p>
      </header>

      <section className="DashboardSummarySelloutBluetti_filters">
        <div className="field">
          <label>Fecha desde</label>
          <input
            type="date"
            value={filters.fechaDesde}
            onChange={(e) => setFilters((prev) => ({ ...prev, fechaDesde: e.target.value }))}
          />
        </div>
        <div className="field">
          <label>Fecha hasta</label>
          <input
            type="date"
            value={filters.fechaHasta}
            onChange={(e) => setFilters((prev) => ({ ...prev, fechaHasta: e.target.value }))}
          />
        </div>
      </section>

      <section className="DashboardSummarySelloutBluetti_kpis">
        <article className="card">
          <h4>Producto mas vendido</h4>
          <p>{topProducto ? topProducto.producto : "-"}</p>
          <small>{topProducto ? `${numberFmt.format(topProducto.unidades)} uds` : "Sin datos"}</small>
        </article>
        <article className="card">
          <h4>Unidades vendidas</h4>
          <p>{numberFmt.format(totalUnidadesVendidas)}</p>
          <small>Total periodo</small>
        </article>
        <article className="card">
          <h4>Ventas totales</h4>
          <p>{currency.format(totalVentas)}</p>
          <small>Total periodo</small>
        </article>
      </section>

      <section className="DashboardSummarySelloutBluetti_grid">
        <article className="panel">
          <h3>Top tiendas con mas ventas</h3>
          <ReactECharts option={topTiendasOption} style={{ height: 360 }} />
        </article>
        <article className="panel">
          <h3>Historico de ventas mes a mes</h3>
          <ReactECharts option={historicoOption} style={{ height: 360 }} />
        </article>
      </section>

      <section className="panel">
        <h3>Variacion mensual vs mes anterior</h3>
        <div className="DashboardSummarySelloutBluetti_tableWrap">
          <table className="DashboardSummarySelloutBluetti_table">
            <thead>
              <tr>
                <th>Mes</th>
                <th>Ventas</th>
                <th>Unidades</th>
                <th>Variacion %</th>
              </tr>
            </thead>
            <tbody>
              {historicoMes.length ? (
                historicoMes.map((row) => (
                  <tr key={row.month}>
                    <td>{formatMonth(row.month)}</td>
                    <td>{currency.format(row.ventas)}</td>
                    <td>{numberFmt.format(row.unidades)}</td>
                    <td className={row.variacion_pct !== null && row.variacion_pct < 0 ? "neg" : "pos"}>
                      {formatVariation(row.variacion_pct)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>No hay datos para el rango seleccionado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="DashboardSummarySelloutBluetti_kpis DashboardSummarySelloutBluetti_kpis_bottom">
        <article className="card">
          <h4>Unidades vendidas mes actual</h4>
          <p>{numberFmt.format(unidadesMesActual)}</p>
          <small>{`${String(new Date().getMonth() + 1).padStart(2, "0")}/${new Date().getFullYear()}`}</small>
        </article>
        <article className="card">
          <h4>Ventas diarias promedio (unidades)</h4>
          <p>{`${decimalFmt.format(ventasDiariasPromedio)} uds/dia`}</p>
          <small>{diasPeriodoAnalisis ? `${numberFmt.format(diasPeriodoAnalisis)} dias analizados` : "Sin rango valido"}</small>
        </article>
        <article className="card">
          <h4>Dias de inventario estimados</h4>
          <p>{diasInventarioEstimadosTotales === null ? "N/A" : `${decimalFmt.format(diasInventarioEstimadosTotales)} dias`}</p>
          <small>Total inventario ultimo cargado</small>
        </article>
      </section>

      <section className="panel">
        <h3>Analisis de inventario por punto de venta y producto</h3>
        <div className="DashboardSummarySelloutBluetti_tableWrap">
          <table className="DashboardSummarySelloutBluetti_table">
            <thead>
              <tr>
                <th>Punto de venta</th>
                <th>Producto</th>
                <th>Unidades vendidas</th>
                <th>Ventas promedio dia</th>
                <th>Ultimo inventario</th>
                <th>Fecha ultimo inventario</th>
                <th>Dias de inventario</th>
              </tr>
            </thead>
            <tbody>
              {analisisInventarioRows.length ? (
                analisisInventarioRows.map((row) => (
                  <tr key={row.key}>
                    <td>{row.punto_venta}</td>
                    <td>{row.producto}</td>
                    <td>{numberFmt.format(row.unidades_vendidas)}</td>
                    <td>{decimalFmt.format(row.ventas_promedio_dia)}</td>
                    <td>{row.ultimo_inventario === null ? "-" : numberFmt.format(row.ultimo_inventario)}</td>
                    <td>{row.fecha_ultimo_inventario || "-"}</td>
                    <td className={row.dias_inventario === null ? "" : row.dias_inventario < 15 ? "neg" : "pos"}>
                      {row.dias_inventario === null ? "N/A" : decimalFmt.format(row.dias_inventario)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>No hay datos para el rango seleccionado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
