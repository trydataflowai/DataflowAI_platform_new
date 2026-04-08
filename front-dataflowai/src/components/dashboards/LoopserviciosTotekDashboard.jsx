import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ReactECharts from "echarts-for-react";
import { LOOPSERVICIOSTOTEK_MODULE_LINKS } from "../../constants/moduleMenus";
import { getLoopserviciosTotek } from "../../api/DashboardsCrudApis/Loopserviciostotek";
import "../../styles/Dashboards/LoopserviciosTotekDashboard.css";

// ─── KPI Card ────────────────────────────────────────────────
const LoopKpiCard = ({ label, value, sub, color = "#00c27c", icon }) => (
  <div className="Loopdb_kpi_card">
    <div className="Loopdb_kpi_icon" style={{ background: `${color}22`, color }}>
      {icon}
    </div>
    <div>
      <div className="Loopdb_kpi_value" style={{ color }}>{value}</div>
      <div className="Loopdb_kpi_label">{label}</div>
      {sub && <div className="Loopdb_kpi_sub">{sub}</div>}
    </div>
  </div>
);

// ─── Loading ──────────────────────────────────────────────────
const LoopLoading = () => (
  <div className="Loopdb_loading">
    <div className="Loopdb_spinner" />
    <p>Cargando indicadores LOOP...</p>
  </div>
);

// ─── Empty ────────────────────────────────────────────────────
const LoopEmpty = () => (
  <div className="Loopdb_empty">
    <p>Sin datos disponibles. Carga registros desde el módulo de Servicios Totek.</p>
  </div>
);

// ─── Colores LOOP ─────────────────────────────────────────────
const LOOP_GREEN  = "#00c27c";
const LOOP_TEAL   = "#00a86b";
const LOOP_DARK   = "#006644";
const COLORS_CHART = ["#00c27c","#00a86b","#33d494","#66e0b0","#99ecc9","#ccf5e4","#006644","#004d33","#80e0b8","#1aff95"];

const normalizeText = (value) => String(value ?? "").trim();
const formatNumber = (value) => Number(value || 0).toLocaleString("es-CO");
const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

const parseDateFlexible = (value) => {
  const txt = normalizeText(value);
  if (!txt) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(txt)) {
    const [y, m, d] = txt.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(txt)) {
    const [d, m, y] = txt.split("/").map(Number);
    return new Date(y, m - 1, d);
  }
  const parsed = new Date(txt);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export default function LoopserviciosTotekDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [filters, setFilters] = useState({
    fechaDesde: "",
    fechaHasta: "",
    estado: "",
    tipoEmpresa: "",
    categoria: "",
    ciudadPrincipal: "",
    instalador: "",
    satisfaccion: "",
  });
  const containerRef = useRef(null);
  const chartRefs = useRef([]);

  const resizeCharts = useCallback(() => {
    chartRefs.current.forEach((ref) => {
      if (!ref || typeof ref.getEchartsInstance !== "function") return;
      try {
        ref.getEchartsInstance().resize();
      } catch (e) {
        // ignore resize errors
      }
    });
  }, []);

  const registerChartRef = useCallback((index) => (el) => {
    chartRefs.current[index] = el;
  }, []);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLoopserviciosTotek();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Error cargando datos. Verifica que el backend esté corriendo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const clearFilters = useCallback(() => {
    setFilters({
      fechaDesde: "",
      fechaHasta: "",
      estado: "",
      tipoEmpresa: "",
      categoria: "",
      ciudadPrincipal: "",
      instalador: "",
      satisfaccion: "",
    });
  }, []);

  const filterOptions = useMemo(() => {
    const uniq = (field) => Array.from(
      new Set(items.map((row) => normalizeText(row?.[field])).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, "es"));

    return {
      estados: uniq("estado_servicio"),
      tiposEmpresa: uniq("tipo_empresa"),
      categorias: uniq("categoria_servicio"),
      ciudadesPrincipales: uniq("ciudad_principal"),
      instaladores: uniq("nombre_instalador"),
      satisfacciones: uniq("satisfaccion_cliente"),
    };
  }, [items]);

  const dateRange = useMemo(() => {
    let from = parseDateFlexible(filters.fechaDesde);
    let to = parseDateFlexible(filters.fechaHasta);
    if (from && to && from > to) {
      const tmp = from;
      from = to;
      to = tmp;
    }
    return { from, to };
  }, [filters.fechaDesde, filters.fechaHasta]);

  const filteredItems = useMemo(() => {
    const { from, to } = dateRange;
    return items.filter((row) => {
      const estado = normalizeText(row.estado_servicio).toUpperCase();
      const tipoEmpresa = normalizeText(row.tipo_empresa);
      const categoria = normalizeText(row.categoria_servicio);
      const ciudadPrincipal = normalizeText(row.ciudad_principal);
      const instalador = normalizeText(row.nombre_instalador);
      const satisfaccion = normalizeText(row.satisfaccion_cliente).toUpperCase();

      if (filters.estado && estado !== normalizeText(filters.estado).toUpperCase()) return false;
      if (filters.tipoEmpresa && tipoEmpresa !== normalizeText(filters.tipoEmpresa)) return false;
      if (filters.categoria && categoria !== normalizeText(filters.categoria)) return false;
      if (filters.ciudadPrincipal && ciudadPrincipal !== normalizeText(filters.ciudadPrincipal)) return false;
      if (filters.instalador && instalador !== normalizeText(filters.instalador)) return false;
      if (filters.satisfaccion && satisfaccion !== normalizeText(filters.satisfaccion).toUpperCase()) return false;

      if (from || to) {
        const d = parseDateFlexible(row.fecha_servicio);
        if (!d) return false;
        if (from && d < from) return false;
        if (to && d > to) return false;
      }
      return true;
    });
  }, [items, filters, dateRange]);

  const kpis = useMemo(() => {
    const groupBy = (rows, field, emptyLabel) => {
      const map = new Map();
      rows.forEach((row) => {
        const key = normalizeText(row?.[field]) || emptyLabel;
        map.set(key, (map.get(key) || 0) + 1);
      });
      return Array.from(map.entries())
        .map(([value, total]) => ({ [field]: value, total }))
        .sort((a, b) => b.total - a.total);
    };

    const byEstado = (rows, target) => rows.filter((row) =>
      normalizeText(row.estado_servicio).toUpperCase() === target
    );

    const finalizados = byEstado(filteredItems, "FINALIZADO");
    const cancelados = byEstado(filteredItems, "CANCELADO");
    const reprogramados = byEstado(filteredItems, "REPROGRAMADO");

    const satisfaccionRows = filteredItems.filter((row) => {
      const val = Number(row.satisfaccion_cliente);
      return !isNaN(val) && val >= 1 && val <= 5;
    });
    const totalConRespuesta = satisfaccionRows.length;
    const promedio = totalConRespuesta > 0
      ? Number((satisfaccionRows.reduce((acc, row) => acc + Number(row.satisfaccion_cliente), 0) / totalConRespuesta).toFixed(2))
      : 0;
    const distribucion = [1, 2, 3, 4, 5].map((val) => ({
      calificacion: val,
      total: satisfaccionRows.filter((row) => Number(row.satisfaccion_cliente) === val).length,
    }));

    const totalAlta    = distribucion.filter((d) => d.calificacion >= 4).reduce((a, d) => a + d.total, 0);
    const totalBaja    = distribucion.filter((d) => d.calificacion <= 2).reduce((a, d) => a + d.total, 0);
    const totalNeutral = distribucion.find((d) => d.calificacion === 3)?.total || 0;
    const pctAlta    = totalConRespuesta > 0 ? Number(((totalAlta    / totalConRespuesta) * 100).toFixed(1)) : 0;
    const pctBaja    = totalConRespuesta > 0 ? Number(((totalBaja    / totalConRespuesta) * 100).toFixed(1)) : 0;
    const pctNeutral = totalConRespuesta > 0 ? Number(((totalNeutral / totalConRespuesta) * 100).toFixed(1)) : 0;

    return {
      total_instalaciones: finalizados.length,
      por_tipo_empresa: groupBy(finalizados, "tipo_empresa", "Sin tipo"),
      por_categoria: groupBy(finalizados, "categoria_servicio", "Sin categoría"),
      por_ciudad_principal: groupBy(finalizados, "ciudad_principal", "Otra"),
      por_instalador: groupBy(finalizados, "nombre_instalador", "Sin nombre"),
      por_descripcion: groupBy(finalizados, "descripcion_servicio", "Sin descripción"),
      ot_cancelados: {
        total: cancelados.length,
        por_motivo: groupBy(cancelados, "motivo_cancelacion", "Sin motivo"),
      },
      ot_reprogramados: {
        total: reprogramados.length,
        por_motivo: groupBy(reprogramados, "motivo_reprogramacion", "Sin motivo"),
      },
      satisfaccion: {
        promedio,
        total_con_respuesta: totalConRespuesta,
        distribucion,
        total_alta: totalAlta,
        total_baja: totalBaja,
        total_neutral: totalNeutral,
        pct_alta: pctAlta,
        pct_baja: pctBaja,
        pct_neutral: pctNeutral,
      },
      por_ciudad: groupBy(finalizados, "ciudad", "Sin ciudad"),
      por_codigo_ot: groupBy(finalizados, "codigo_ot", "—"),
    };
  }, [filteredItems]);

  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => resizeCharts());
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [resizeCharts]);

  useEffect(() => {
    const handleWindowResize = () => resizeCharts();
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [resizeCharts]);

  useEffect(() => {
    const t = setTimeout(() => resizeCharts(), 0);
    return () => clearTimeout(t);
  }, [filteredItems, resizeCharts]);

  // ── Opciones ECharts ────────────────────────────────────────

  const chartTipoEmpresaTotal = (kpis.por_tipo_empresa || []).reduce((acc, d) => acc + (Number(d.total) || 0), 0);
  const chartCategoriaTotal = (kpis.por_categoria || []).reduce((acc, d) => acc + (Number(d.total) || 0), 0);
  const chartCiudadTotal = (kpis.por_ciudad_principal || []).reduce((acc, d) => acc + (Number(d.total) || 0), 0);
  const chartInstaladorTotal = (kpis.por_instalador || []).reduce((acc, d) => acc + (Number(d.total) || 0), 0);
  const chartDescripcionTotal = (kpis.por_descripcion || []).reduce((acc, d) => acc + (Number(d.total) || 0), 0);

  const chartTipoEmpresa = kpis ? {
    tooltip: {
      trigger: "item",
      appendToBody: true,
      formatter: (params) => {
        const val = Number(params.value || 0);
        const pct = params.percent ?? (chartTipoEmpresaTotal ? (val / chartTipoEmpresaTotal) * 100 : 0);
        return `${params.name}<br/>${formatNumber(val)} (${formatPercent(pct)})`;
      },
    },
    legend: { bottom: 0, textStyle: { color: "#ccc", fontSize: 11 } },
    series: [{
      type: "pie", radius: ["45%", "70%"],
      data: (kpis.por_tipo_empresa || []).map((d, i) => ({
        name: d.tipo_empresa || "Sin tipo",
        value: d.total,
        itemStyle: { color: COLORS_CHART[i % COLORS_CHART.length] },
      })),
      label: { color: "#fff", fontSize: 11 },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: LOOP_GREEN } },
    }],
  } : {};

  const chartCategoria = kpis ? {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      appendToBody: true,
      formatter: (params) => {
        const row = Array.isArray(params) ? params[0] : params;
        if (!row) return "";
        const val = Number(row.value || 0);
        const pct = chartCategoriaTotal ? (val / chartCategoriaTotal) * 100 : 0;
        return `${row.name}<br/>${formatNumber(val)} (${formatPercent(pct)})`;
      },
    },
    grid: { left: "3%", right: "8%", bottom: "3%", containLabel: true },
    xAxis: { type: "value", axisLabel: { color: "#aaa" }, splitLine: { lineStyle: { color: "#1e293b" } } },
    yAxis: {
      type: "category",
      data: (kpis.por_categoria || []).map((d) => d.categoria_servicio || "Sin categoría"),
      axisLabel: { color: "#ccc", fontSize: 10 },
    },
    series: [{
      type: "bar", barMaxWidth: 30,
      data: (kpis.por_categoria || []).map((d, i) => ({
        value: d.total,
        itemStyle: { color: COLORS_CHART[i % COLORS_CHART.length], borderRadius: [0, 6, 6, 0] },
      })),
      label: { show: true, position: "right", color: "#fff", fontSize: 10, formatter: "{c}" },
    }],
  } : {};

  const chartCiudadPrincipal = kpis ? {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      appendToBody: true,
      formatter: (params) => {
        const row = Array.isArray(params) ? params[0] : params;
        if (!row) return "";
        const val = Number(row.value || 0);
        const pct = chartCiudadTotal ? (val / chartCiudadTotal) * 100 : 0;
        return `${row.name}<br/>${formatNumber(val)} (${formatPercent(pct)})`;
      },
    },
    grid: { left: "3%", right: "8%", bottom: "3%", containLabel: true },
    xAxis: {
      type: "category",
      data: (kpis.por_ciudad_principal || []).map((d) => d.ciudad_principal || "Otra"),
      axisLabel: { color: "#ccc", fontSize: 9, rotate: 30 },
    },
    yAxis: { type: "value", axisLabel: { color: "#aaa" }, splitLine: { lineStyle: { color: "#1e293b" } } },
    series: [{
      type: "bar", barMaxWidth: 35,
      data: (kpis.por_ciudad_principal || []).map((d, i) => ({
        value: d.total,
        itemStyle: { color: COLORS_CHART[i % COLORS_CHART.length], borderRadius: [6, 6, 0, 0] },
      })),
      label: { show: true, position: "top", color: "#fff", fontSize: 10, formatter: "{c}" },
    }],
  } : {};

  const chartInstaladores = kpis ? {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      appendToBody: true,
      formatter: (params) => {
        const row = Array.isArray(params) ? params[0] : params;
        if (!row) return "";
        const val = Number(row.value || 0);
        const pct = chartInstaladorTotal ? (val / chartInstaladorTotal) * 100 : 0;
        return `${row.name}<br/>${formatNumber(val)} (${formatPercent(pct)})`;
      },
    },
    grid: { left: "3%", right: "10%", bottom: "3%", containLabel: true },
    xAxis: { type: "value", axisLabel: { color: "#aaa" }, splitLine: { lineStyle: { color: "#1e293b" } } },
    yAxis: {
      type: "category",
      data: (kpis.por_instalador || []).slice(0, 10).map((d) => d.nombre_instalador || "Sin nombre"),
      axisLabel: { color: "#ccc", fontSize: 10 },
    },
    series: [{
      type: "bar", barMaxWidth: 22,
      data: (kpis.por_instalador || []).slice(0, 10).map((d) => ({
        value: d.total,
        itemStyle: { color: LOOP_GREEN, borderRadius: [0, 6, 6, 0] },
      })),
      label: { show: true, position: "right", color: "#fff", fontSize: 10, formatter: "{c}" },
    }],
  } : {};

  const chartDescripcion = kpis ? {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      appendToBody: true,
      formatter: (params) => {
        const row = Array.isArray(params) ? params[0] : params;
        if (!row) return "";
        const val = Number(row.value || 0);
        const pct = chartDescripcionTotal ? (val / chartDescripcionTotal) * 100 : 0;
        return `${row.name}<br/>${formatNumber(val)} (${formatPercent(pct)})`;
      },
    },
    grid: { left: "3%", right: "8%", bottom: "3%", containLabel: true },
    xAxis: { type: "value", axisLabel: { color: "#aaa" }, splitLine: { lineStyle: { color: "#1e293b" } } },
    yAxis: {
      type: "category",
      data: (kpis.por_descripcion || []).slice(0, 12).map((d) => {
        const s = d.descripcion_servicio || "Sin descripción";
        return s.length > 40 ? s.substring(0, 40) + "..." : s;
      }),
      axisLabel: { color: "#ccc", fontSize: 9 },
    },
    series: [{
      type: "bar", barMaxWidth: 20,
      data: (kpis.por_descripcion || []).slice(0, 12).map((d, i) => ({
        value: d.total,
        itemStyle: { color: COLORS_CHART[i % COLORS_CHART.length], borderRadius: [0, 6, 6, 0] },
      })),
      label: { show: true, position: "right", color: "#fff", fontSize: 10, formatter: "{c}" },
    }],
  } : {};


  const SAT_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#00c27c"];
  const SAT_LABELS = ["Muy insatisfecho", "Insatisfecho", "Neutral", "Satisfecho", "Muy satisfecho"];

  const chartSatisfaccionDistrib = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      appendToBody: true,
      formatter: (params) => {
        const row = Array.isArray(params) ? params[0] : params;
        if (!row) return "";
        const val = Number(row.value || 0);
        const total = kpis.satisfaccion?.total_con_respuesta || 0;
        const pct = total > 0 ? ((val / total) * 100).toFixed(1) : "0.0";
        return `${row.axisValueLabel} — ${SAT_LABELS[row.dataIndex]}<br/>${formatNumber(val)} respuestas (${pct}%)`;
      },
    },
    grid: { left: "3%", right: "8%", bottom: "3%", containLabel: true },
    xAxis: {
      type: "category",
      data: ["1 ★", "2 ★", "3 ★", "4 ★", "5 ★"],
      axisLabel: { color: "#ccc", fontSize: 12 },
    },
    yAxis: { type: "value", axisLabel: { color: "#aaa" }, splitLine: { lineStyle: { color: "#1e293b" } } },
    series: [{
      type: "bar", barMaxWidth: 55,
      data: (kpis.satisfaccion?.distribucion || []).map((d, i) => ({
        value: d.total,
        itemStyle: { color: SAT_COLORS[i], borderRadius: [6, 6, 0, 0] },
      })),
      label: { show: true, position: "top", color: "#fff", fontSize: 11, formatter: "{c}" },
    }],
  };

  // ────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="Loopdb_container" ref={containerRef} style={{ width: "100%", maxWidth: "100%", minWidth: 0 }}>
      <LoopLoading />
    </div>
  );
  if (error) return (
    <div className="Loopdb_container" ref={containerRef} style={{ width: "100%", maxWidth: "100%", minWidth: 0 }}>
      <div className="Loopdb_error">
        <p>⚠ {error}</p>
        <button onClick={cargar} className="Loopdb_btn_reload">Reintentar</button>
      </div>
    </div>
  );
  const hasData = filteredItems.length > 0;

  return (
    <div className="Loopdb_container" ref={containerRef} style={{ width: "100%", maxWidth: "100%", minWidth: 0 }}>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div className="Loopdb_header">
        <div className="Loopdb_header_left">
          <div className="Loopdb_logo">
            <span className="Loopdb_logo_text">LOOP</span>
          </div>
          <div>
            <h1 className="Loopdb_title">Dashboard — Servicios Totek</h1>
            <p className="Loopdb_subtitle">Indicadores de instalación, cancelaciones y satisfacción del cliente</p>
          </div>
        </div>

        <div className="Loopdb_header_right">
          <button className="Loopdb_btn_reload" onClick={cargar}>↻ Actualizar</button>
          <div className="Loopdb_nav_wrapper">
            <button className="Loopdb_nav_btn" onClick={() => setMenuOpen((p) => !p)}>
              ☰ Módulos
            </button>
            {menuOpen && (
              <div className="Loopdb_nav_menu">
                {LOOPSERVICIOSTOTEK_MODULE_LINKS.map((link) => (
                  <button key={link.path} onClick={() => { navigate(link.path); setMenuOpen(false); }}>
                    {link.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="Loopdb_filters">
        <div className="Loopdb_filter_field">
          <label>Fecha desde</label>
          <input
            type="date"
            value={filters.fechaDesde}
            onChange={(e) => setFilters((p) => ({ ...p, fechaDesde: e.target.value }))}
          />
        </div>
        <div className="Loopdb_filter_field">
          <label>Fecha hasta</label>
          <input
            type="date"
            value={filters.fechaHasta}
            onChange={(e) => setFilters((p) => ({ ...p, fechaHasta: e.target.value }))}
          />
        </div>
        <div className="Loopdb_filter_field">
          <label>Estado</label>
          <select
            value={filters.estado}
            onChange={(e) => setFilters((p) => ({ ...p, estado: e.target.value }))}
          >
            <option value="">Todos</option>
            {filterOptions.estados.map((estado) => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>
        </div>
        <div className="Loopdb_filter_field">
          <label>Tipo empresa</label>
          <select
            value={filters.tipoEmpresa}
            onChange={(e) => setFilters((p) => ({ ...p, tipoEmpresa: e.target.value }))}
          >
            <option value="">Todas</option>
            {filterOptions.tiposEmpresa.map((tipo) => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </div>
        <div className="Loopdb_filter_field">
          <label>Categoría</label>
          <select
            value={filters.categoria}
            onChange={(e) => setFilters((p) => ({ ...p, categoria: e.target.value }))}
          >
            <option value="">Todas</option>
            {filterOptions.categorias.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="Loopdb_filter_field">
          <label>Ciudad principal</label>
          <select
            value={filters.ciudadPrincipal}
            onChange={(e) => setFilters((p) => ({ ...p, ciudadPrincipal: e.target.value }))}
          >
            <option value="">Todas</option>
            {filterOptions.ciudadesPrincipales.map((ciudad) => (
              <option key={ciudad} value={ciudad}>{ciudad}</option>
            ))}
          </select>
        </div>
        <div className="Loopdb_filter_field">
          <label>Instalador</label>
          <select
            value={filters.instalador}
            onChange={(e) => setFilters((p) => ({ ...p, instalador: e.target.value }))}
          >
            <option value="">Todos</option>
            {filterOptions.instaladores.map((inst) => (
              <option key={inst} value={inst}>{inst}</option>
            ))}
          </select>
        </div>
        <div className="Loopdb_filter_field">
          <label>Satisfacción</label>
          <select
            value={filters.satisfaccion}
            onChange={(e) => setFilters((p) => ({ ...p, satisfaccion: e.target.value }))}
          >
            <option value="">Todas</option>
            {filterOptions.satisfacciones.map((sat) => (
              <option key={sat} value={sat}>{sat}</option>
            ))}
          </select>
        </div>
        <div className="Loopdb_filter_actions">
          <button type="button" className="Loopdb_btn_clear" onClick={clearFilters}>
            Limpiar filtros
          </button>
          <div className="Loopdb_filter_count">
            {filteredItems.length.toLocaleString("es-CO")} registros filtrados de {items.length.toLocaleString("es-CO")}
          </div>
        </div>
      </section>

      {!hasData && <LoopEmpty />}

      {hasData && (
        <>
          {/* ── KPI CARDS ──────────────────────────────────── */}
          <div className="Loopdb_kpi_grid">
            <LoopKpiCard
              label="Total Instalaciones"
              value={kpis.total_instalaciones?.toLocaleString("es-CO")}
              sub="Servicios finalizados"
              color={LOOP_GREEN}
              icon="🔧"
            />
            <LoopKpiCard
              label="OT Cancelados"
              value={kpis.ot_cancelados?.total?.toLocaleString("es-CO") ?? 0}
              sub="Órdenes canceladas"
              color="#ef4444"
              icon="✗"
            />
            <LoopKpiCard
              label="OT Reprogramados"
              value={kpis.ot_reprogramados?.total?.toLocaleString("es-CO") ?? 0}
              sub="Órdenes reprogramadas"
              color="#f59e0b"
              icon="↻"
            />
            <LoopKpiCard
              label="Satisfacción Cliente"
              value={`${(kpis.satisfaccion?.promedio ?? 0).toFixed(1)} / 5`}
              sub={`${kpis.satisfaccion?.total_con_respuesta ?? 0} respuestas registradas`}
              color={LOOP_TEAL}
              icon="★"
            />
            <LoopKpiCard
              label="Ciudades Cubiertas"
              value={(kpis.por_ciudad_principal || []).length}
              sub="Ciudades principales activas"
              color={LOOP_DARK}
              icon="📍"
            />
            <LoopKpiCard
              label="Instaladores Activos"
              value={(kpis.por_instalador || []).length}
              sub="Técnicos con servicios"
              color="#6366f1"
              icon="👷"
            />
          </div>

          {/* ── FILA 1: Tipo empresa + Ciudad Principal ─────── */}
          <div className="Loopdb_row_2">
            <div className="Loopdb_card">
              <h3 className="Loopdb_card_title">Instalaciones por Tipo de Empresa</h3>
              {(kpis.por_tipo_empresa || []).length > 0 ? (
                <ReactECharts ref={registerChartRef(0)} option={chartTipoEmpresa} style={{ width: "100%", height: 240 }} theme="dark" />
              ) : <p className="Loopdb_no_data">Sin datos</p>}
            </div>

            <div className="Loopdb_card">
              <h3 className="Loopdb_card_title">Instalaciones por Ciudad Principal</h3>
              {(kpis.por_ciudad_principal || []).length > 0 ? (
                <ReactECharts ref={registerChartRef(1)} option={chartCiudadPrincipal} style={{ width: "100%", height: 240 }} theme="dark" />
              ) : <p className="Loopdb_no_data">Sin datos</p>}
            </div>
          </div>

          {/* ── FILA 2: Categoría + Descripción ─── */}
          <div className="Loopdb_row_2">
            <div className="Loopdb_card">
              <h3 className="Loopdb_card_title">Instalaciones por Categoría de Servicio</h3>
              {(kpis.por_categoria || []).length > 0 ? (
                <ReactECharts ref={registerChartRef(2)} option={chartCategoria} style={{ width: "100%", height: 240 }} theme="dark" />
              ) : <p className="Loopdb_no_data">Sin datos</p>}
            </div>

            <div className="Loopdb_card">
              <h3 className="Loopdb_card_title">Top Servicios por Descripción (instalaciones finalizadas)</h3>
              {(kpis.por_descripcion || []).length > 0 ? (
                <ReactECharts ref={registerChartRef(3)} option={chartDescripcion} style={{ width: "100%", height: 240 }} theme="dark" />
              ) : <p className="Loopdb_no_data">Sin datos</p>}
            </div>
          </div>

          {/* ── FILA 4: Cancelaciones + Reprogramaciones ─────── */}
          <div className="Loopdb_row_2">
            <div className="Loopdb_card">
              <h3 className="Loopdb_card_title">
                OT Cancelados — Motivos
                <span className="Loopdb_badge_danger">{kpis.ot_cancelados?.total ?? 0}</span>
              </h3>
              {(kpis.ot_cancelados?.por_motivo || []).length > 0 ? (
                <div className="Loopdb_table_wrapper">
                  <table className="Loopdb_table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Motivo</th>
                        <th>Cantidad</th>
                        <th>% Participación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(kpis.ot_cancelados.por_motivo).map((row, i) => {
                        const pct = kpis.ot_cancelados.total > 0
                          ? ((row.total / kpis.ot_cancelados.total) * 100).toFixed(1)
                          : "0.0";
                        return (
                          <tr key={i}>
                            <td>{i + 1}</td>
                            <td>{row.motivo_cancelacion || "Sin motivo"}</td>
                            <td style={{ color: LOOP_GREEN, fontWeight: 600 }}>{row.total}</td>
                            <td style={{ color: "#66e0b0" }}>{pct}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : <p className="Loopdb_no_data">Sin cancelaciones</p>}
            </div>

            <div className="Loopdb_card">
              <h3 className="Loopdb_card_title">
                OT Reprogramados — Motivos
                <span className="Loopdb_badge_warn">{kpis.ot_reprogramados?.total ?? 0}</span>
              </h3>
              {(kpis.ot_reprogramados?.por_motivo || []).length > 0 ? (
                <div className="Loopdb_table_wrapper">
                  <table className="Loopdb_table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Motivo</th>
                        <th>Cantidad</th>
                        <th>% Participación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(kpis.ot_reprogramados.por_motivo).map((row, i) => {
                        const pct = kpis.ot_reprogramados.total > 0
                          ? ((row.total / kpis.ot_reprogramados.total) * 100).toFixed(1)
                          : "0.0";
                        return (
                          <tr key={i}>
                            <td>{i + 1}</td>
                            <td>{row.motivo_reprogramacion || "Sin motivo"}</td>
                            <td style={{ color: LOOP_GREEN, fontWeight: 600 }}>{row.total}</td>
                            <td style={{ color: "#66e0b0" }}>{pct}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : <p className="Loopdb_no_data">Sin reprogramaciones</p>}
            </div>
          </div>

          {/* ── FILA 5: Top instaladores — en par 2x2 ─── */}
          <div className="Loopdb_row_2">
            <div className="Loopdb_card">
              <h3 className="Loopdb_card_title">Top 10 Instaladores por Servicios Realizados</h3>
              {(kpis.por_instalador || []).length > 0 ? (
                <ReactECharts ref={registerChartRef(6)} option={chartInstaladores} style={{ width: "100%", height: 240 }} theme="dark" />
              ) : <p className="Loopdb_no_data">Sin datos de instaladores</p>}
            </div>
            <div className="Loopdb_card">
              <h3 className="Loopdb_card_title">
                Distribución de Satisfacción (1–5)
                <span style={{ fontSize: 12, color: LOOP_TEAL, marginLeft: 8 }}>
                  Promedio: {(kpis.satisfaccion?.promedio ?? 0).toFixed(1)} / 5
                </span>
              </h3>
              {(kpis.satisfaccion?.total_con_respuesta ?? 0) > 0 ? (
                <ReactECharts ref={registerChartRef(5)} option={chartSatisfaccionDistrib} style={{ width: "100%", height: 240 }} theme="dark" />
              ) : <p className="Loopdb_no_data">Sin respuestas de satisfacción registradas</p>}
            </div>
          </div>

          {/* ── FILA 6: Tabla ciudades detalle ───────────────── */}
          <div className="Loopdb_row_2">
            <div className="Loopdb_card">
              <h3 className="Loopdb_card_title">Ciudades — Detalle de Instalaciones</h3>
              <div className="Loopdb_table_wrapper">
                <table className="Loopdb_table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Ciudad</th>
                      <th>Instalaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(kpis.por_ciudad || []).map((d, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{d.ciudad || "Sin ciudad"}</td>
                        <td style={{ color: LOOP_GREEN, fontWeight: 600 }}>{d.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabla top OTs */}
            <div className="Loopdb_card">
              <h3 className="Loopdb_card_title">Top Órdenes de Trabajo (OT)</h3>
              <div className="Loopdb_table_wrapper">
                <table className="Loopdb_table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Código OT</th>
                      <th>Registros</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(kpis.por_codigo_ot || []).map((d, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td style={{ fontFamily: "monospace", color: "#66e0b0" }}>{d.codigo_ot || "—"}</td>
                        <td style={{ color: LOOP_GREEN, fontWeight: 600 }}>{d.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── SATISFACCIÓN DETALLE ─────────────────────────── */}
          <div className="Loopdb_row_1">
            <div className="Loopdb_card Loopdb_satisfaccion_card">
              <h3 className="Loopdb_card_title">Detalle de Satisfacción del Cliente</h3>

              <div className="Loopdb_satisfaccion_row">
                {/* Promedio */}
                <div className="Loopdb_satisfaccion_item">
                  <div className="Loopdb_satisfaccion_num" style={{
                    color: (kpis.satisfaccion?.promedio ?? 0) >= 4 ? LOOP_GREEN
                         : (kpis.satisfaccion?.promedio ?? 0) >= 3 ? "#f59e0b"
                         : "#ef4444"
                  }}>
                    {(kpis.satisfaccion?.promedio ?? 0).toFixed(1)} <span style={{ fontSize: 14 }}>/ 5</span>
                  </div>
                  <div className="Loopdb_satisfaccion_lbl">Promedio General</div>
                </div>

                <div className="Loopdb_satisfaccion_divider" />

                {/* Alta satisfacción 4-5 */}
                <div className="Loopdb_satisfaccion_item">
                  <div className="Loopdb_satisfaccion_num" style={{ color: LOOP_GREEN }}>
                    {kpis.satisfaccion?.pct_alta ?? 0}%
                  </div>
                  <div className="Loopdb_satisfaccion_lbl">Satisfacción Alta (4–5)</div>
                  <div className="Loopdb_satisfaccion_sub">{kpis.satisfaccion?.total_alta ?? 0} respuestas</div>
                </div>

                <div className="Loopdb_satisfaccion_divider" />

                {/* Neutral 3 */}
                <div className="Loopdb_satisfaccion_item">
                  <div className="Loopdb_satisfaccion_num" style={{ color: "#f59e0b" }}>
                    {kpis.satisfaccion?.pct_neutral ?? 0}%
                  </div>
                  <div className="Loopdb_satisfaccion_lbl">Neutral (3)</div>
                  <div className="Loopdb_satisfaccion_sub">{kpis.satisfaccion?.total_neutral ?? 0} respuestas</div>
                </div>

                <div className="Loopdb_satisfaccion_divider" />

                {/* Baja satisfacción 1-2 */}
                <div className="Loopdb_satisfaccion_item">
                  <div className="Loopdb_satisfaccion_num" style={{ color: "#ef4444" }}>
                    {kpis.satisfaccion?.pct_baja ?? 0}%
                  </div>
                  <div className="Loopdb_satisfaccion_lbl">Satisfacción Baja (1–2)</div>
                  <div className="Loopdb_satisfaccion_sub">{kpis.satisfaccion?.total_baja ?? 0} respuestas</div>
                </div>

                <div className="Loopdb_satisfaccion_divider" />

                {/* Total respuestas */}
                <div className="Loopdb_satisfaccion_item">
                  <div className="Loopdb_satisfaccion_num" style={{ color: "#94a3b8" }}>
                    {kpis.satisfaccion?.total_con_respuesta ?? 0}
                  </div>
                  <div className="Loopdb_satisfaccion_lbl">Total Respuestas</div>
                  <div className="Loopdb_satisfaccion_sub">
                    de {filteredItems.length} servicios
                  </div>
                </div>
              </div>

              {/* Barra de progreso segmentada */}
              <div className="Loopdb_sat_bar_wrapper">
                {(kpis.satisfaccion?.total_con_respuesta ?? 0) > 0 ? (
                  <>
                    <div className="Loopdb_sat_bar_track">
                      <div className="Loopdb_sat_bar_seg" style={{ width: `${kpis.satisfaccion.pct_alta}%`,    background: LOOP_GREEN }} />
                      <div className="Loopdb_sat_bar_seg" style={{ width: `${kpis.satisfaccion.pct_neutral}%`, background: "#f59e0b" }} />
                      <div className="Loopdb_sat_bar_seg" style={{ width: `${kpis.satisfaccion.pct_baja}%`,    background: "#ef4444" }} />
                    </div>
                    <div className="Loopdb_sat_bar_legend">
                      <span style={{ color: LOOP_GREEN }}>■ Alta ({kpis.satisfaccion.pct_alta}%)</span>
                      <span style={{ color: "#f59e0b" }}>■ Neutral ({kpis.satisfaccion.pct_neutral}%)</span>
                      <span style={{ color: "#ef4444" }}>■ Baja ({kpis.satisfaccion.pct_baja}%)</span>
                    </div>
                  </>
                ) : (
                  <p className="Loopdb_no_data">Sin respuestas de satisfacción registradas</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div className="Loopdb_footer">
        <span>LOOP · Servicios Totek · DataflowAI Platform</span>
      </div>
    </div>
  );
}



