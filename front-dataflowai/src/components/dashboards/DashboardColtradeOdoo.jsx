import React, { useEffect, useMemo, useState } from "react";
import styles from "../../styles/CreacionUsuario.module.css";
import Select from "react-select";
import { fetchSalesColtrade, clearSalesColtradeCache, getCacheStats } from "../../api/DashboardsApis/DashboardColtradeOdoo";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  BarChart,
  Bar,
} from "recharts";

const DashboardVentasColtradeOdoo = () => {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [cacheInfo, setCacheInfo] = useState("");

  // filtros (react-select multi)
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterCanal, setFilterCanal] = useState([]);
  const [filterCliente, setFilterCliente] = useState([]);
  const [filterMarca, setFilterMarca] = useState([]);
  const [filterProducto, setFilterProducto] = useState([]);
  const [filterInvoiceStatus, setFilterInvoiceStatus] = useState([]);

  // carga
  const loadData = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSalesColtrade({ all: true, forceRefresh });
      const results = Array.isArray(res) ? res : res.results || [];
      setRawData(results);
      setLastRefresh(new Date());
      const stats = getCacheStats();
      setCacheInfo(`Cache: ${stats.totalCached} items`);
    } catch (err) {
      if (err && err.message && err.message.includes("ya está en progreso")) {
        console.log("Carga en progreso");
        return;
      }
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => { if (mounted) await loadData(false); };
    init();
    return () => { mounted = false; };
  }, []);

  const handleManualRefresh = async () => { await loadData(true); };
  const handleClearCache = () => {
    clearSalesColtradeCache();
    setRawData([]);
    setLastRefresh(null);
    setCacheInfo("Cache limpiado");
    setTimeout(() => loadData(false), 100);
  };

  // Util: parse date from API strings
  const parseOrderDate = (createDateStr) => {
    if (!createDateStr) return null;
    const iso = createDateStr.replace(" ", "T");
    const d = new Date(iso);
    if (isNaN(d.getTime())) {
      const dateOnly = createDateStr.split(" ")[0];
      const dd = new Date(dateOnly + "T00:00:00");
      return isNaN(dd.getTime()) ? null : dd;
    }
    return d;
  };

  // --- Función mejorada para filtrar órdenes
  const orderMatchesGivenFilters = (order, ignoreList = []) => {
    const ignore = (k) => Array.isArray(ignoreList) && ignoreList.includes(k);

    // Fecha
    if (!ignore("date") && (startDate || endDate)) {
      const od = parseOrderDate(order?.create_date);
      if (startDate) {
        const s = new Date(`${startDate}T00:00:00`);
        if (!od || od < s) return false;
      }
      if (endDate) {
        const e = new Date(`${endDate}T23:59:59`);
        if (!od || od > e) return false;
      }
    }

    // Canal
    if (!ignore("canal") && filterCanal && filterCanal.length) {
      const allowed = filterCanal.map((c) => String(c.value).toLowerCase());
      const canalVal = String(order?.canal ?? "").toLowerCase();
      if (!allowed.includes(canalVal)) return false;
    }

    // Cliente (match by id)
    if (!ignore("cliente") && filterCliente && filterCliente.length) {
      const allowedIds = filterCliente.map((c) => String(c.value));
      const pid = String(order?.partner?.id ?? "");
      if (!allowedIds.includes(pid)) return false;
    }

    // Marca (must match at least one line)
    if (!ignore("marca") && filterMarca && filterMarca.length) {
      const allowed = filterMarca.map((m) => String(m.value).toLowerCase());
      const lines = Array.isArray(order?.order_lines) ? order.order_lines : [];
      const hasMatchingLine = lines.some((ln) => {
        const lineBrand = String(ln?.product?.brand ?? "").toLowerCase();
        return allowed.includes(lineBrand);
      });
      if (!hasMatchingLine) return false;
    }

    // Producto (must match at least one line)
    if (!ignore("producto") && filterProducto && filterProducto.length) {
      const allowed = filterProducto.map((p) => String(p.value).toLowerCase());
      const lines = Array.isArray(order?.order_lines) ? order.order_lines : [];
      const hasMatchingLine = lines.some((ln) => {
        const lineProduct = String(ln?.product?.name ?? "").toLowerCase();
        return allowed.includes(lineProduct);
      });
      if (!hasMatchingLine) return false;
    }

    // Invoice status
    if (!ignore("invoice") && filterInvoiceStatus && filterInvoiceStatus.length) {
      const allowed = filterInvoiceStatus.map((s) => String(s.value).toLowerCase());
      const st = String(order?.invoice_status ?? "").toLowerCase();
      if (!allowed.includes(st)) return false;
    }

    return true;
  };

  // --- Función MEJORADA para construir opciones dependientes
  const buildOptionsFor = (field) => {
    const ignoreMap = {
      canal: ["canal"],
      cliente: ["cliente"],
      marca: ["marca"],
      producto: ["producto"],
      invoice: ["invoice"],
    };
    const ignoreList = ignoreMap[field] || [];
    const set = new Map();
    
    for (const order of rawData) {
      if (!orderMatchesGivenFilters(order, ignoreList)) continue;
      
      if (field === "canal") {
        const c = order?.canal; 
        if (c) set.set(c, c);
      }
      
      if (field === "cliente") {
        const id = order?.partner?.id; 
        const name = order?.partner?.name;
        if (id !== undefined && id !== null && name) set.set(String(id), name);
      }
      
      if (field === "marca") {
        const lines = Array.isArray(order?.order_lines) ? order.order_lines : [];
        lines.forEach((ln) => { 
          const b = ln?.product?.brand; 
          if (b) {
            // VERIFICACIÓN CRUCIAL: Si hay filtro de producto, solo incluir marcas que tengan ese producto
            if (filterProducto && filterProducto.length > 0) {
              const productName = ln?.product?.name ?? "";
              const productMatches = filterProducto.some(p => 
                String(p.value).toLowerCase() === String(productName).toLowerCase()
              );
              if (productMatches) {
                set.set(b, b);
              }
            } else {
              set.set(b, b);
            }
          }
        });
      }
      
      if (field === "producto") {
        const lines = Array.isArray(order?.order_lines) ? order.order_lines : [];
        lines.forEach((ln) => { 
          const p = ln?.product?.name; 
          if (p) {
            // VERIFICACIÓN CRUCIAL: Si hay filtro de marca, solo incluir productos de esa marca
            if (filterMarca && filterMarca.length > 0) {
              const brand = ln?.product?.brand ?? "";
              const brandMatches = filterMarca.some(m => 
                String(m.value).toLowerCase() === String(brand).toLowerCase()
              );
              if (brandMatches) {
                set.set(p, p);
              }
            } else {
              set.set(p, p);
            }
          }
        });
      }
      
      if (field === "invoice") {
        const s = order?.invoice_status; 
        if (s) set.set(s, s);
      }
    }

    // transform to react-select options
    if (field === "cliente") {
      return Array.from(set.entries()).map(([id, name]) => ({ value: String(id), label: name })).sort((a, b) => a.label.localeCompare(b.label));
    }
    return Array.from(set.keys()).sort().map((v) => ({ value: v, label: v }));
  };

  // --- Opciones dependientes (recomputadas cuando rawData o filtros cambian)
  const canalOptions = useMemo(() => buildOptionsFor("canal"), [rawData, startDate, endDate, filterCliente, filterMarca, filterProducto, filterInvoiceStatus]);
  const clientOptions = useMemo(() => buildOptionsFor("cliente"), [rawData, startDate, endDate, filterCanal, filterMarca, filterProducto, filterInvoiceStatus]);
  const brandOptions = useMemo(() => buildOptionsFor("marca"), [rawData, startDate, endDate, filterCanal, filterCliente, filterProducto, filterInvoiceStatus]);
  const productOptions = useMemo(() => buildOptionsFor("producto"), [rawData, startDate, endDate, filterCanal, filterCliente, filterMarca, filterInvoiceStatus]);
  const invoiceStatusOptions = useMemo(() => buildOptionsFor("invoice"), [rawData, startDate, endDate, filterCanal, filterCliente, filterMarca, filterProducto]);

  // --- Cuando cambian opciones: limpiar selecciones inválidas automáticamente
  useEffect(() => {
    if (filterCliente && filterCliente.length) {
      const allowed = new Set(clientOptions.map((o) => o.value));
      const kept = filterCliente.filter((c) => allowed.has(String(c.value)));
      if (kept.length !== filterCliente.length) setFilterCliente(kept);
    }
  }, [clientOptions, filterCliente]);

  useEffect(() => {
    if (filterCanal && filterCanal.length) {
      const allowed = new Set(canalOptions.map((o) => o.value));
      const kept = filterCanal.filter((c) => allowed.has(String(c.value)));
      if (kept.length !== filterCanal.length) setFilterCanal(kept);
    }
  }, [canalOptions, filterCanal]);

  useEffect(() => {
    if (filterMarca && filterMarca.length) {
      const allowed = new Set(brandOptions.map((o) => o.value));
      const kept = filterMarca.filter((c) => allowed.has(String(c.value)));
      if (kept.length !== filterMarca.length) setFilterMarca(kept);
    }
  }, [brandOptions, filterMarca]);

  useEffect(() => {
    if (filterProducto && filterProducto.length) {
      const allowed = new Set(productOptions.map((o) => o.value));
      const kept = filterProducto.filter((c) => allowed.has(String(c.value)));
      if (kept.length !== filterProducto.length) setFilterProducto(kept);
    }
  }, [productOptions, filterProducto]);

  useEffect(() => {
    if (filterInvoiceStatus && filterInvoiceStatus.length) {
      const allowed = new Set(invoiceStatusOptions.map((o) => o.value));
      const kept = filterInvoiceStatus.filter((c) => allowed.has(String(c.value)));
      if (kept.length !== filterInvoiceStatus.length) setFilterInvoiceStatus(kept);
    }
  }, [invoiceStatusOptions, filterInvoiceStatus]);

  // --- filteredData (aplica TODOS los filtros) - CORREGIDO
  const filteredData = useMemo(() => {
    if (!rawData || !rawData.length) return [];
    return rawData.filter((o) => orderMatchesGivenFilters(o, []));
  }, [rawData, startDate, endDate, filterCanal, filterCliente, filterMarca, filterProducto, filterInvoiceStatus]);

  // --- filtered sets for charts with exceptions
  const filteredDataForCanalChart = useMemo(() => {
    if (!rawData || !rawData.length) return [];
    return rawData.filter((o) => orderMatchesGivenFilters(o, ["canal", "cliente"]));
  }, [rawData, startDate, endDate, filterMarca, filterProducto, filterInvoiceStatus]);

  const filteredDataForMonthChart = useMemo(() => {
    if (!rawData || !rawData.length) return [];
    return rawData.filter((o) => orderMatchesGivenFilters(o, ["date"]));
  }, [rawData, filterCanal, filterCliente, filterMarca, filterProducto, filterInvoiceStatus]);

  // --- KPIs (sobre filteredData)
  const kpis = useMemo(() => {
    let sumAmount = 0, sumUnits = 0, sumSub = 0, priceUnitSum = 0, priceUnitCount = 0;
    const clientsSet = new Set();
    for (const order of filteredData) {
      const amt = Number(order?.amount_total ?? 0); if (Number.isFinite(amt)) sumAmount += amt;
      const pid = order?.partner?.id; if (pid !== undefined && pid !== null) clientsSet.add(String(pid));
      const lines = Array.isArray(order?.order_lines) ? order.order_lines : [];
      for (const ln of lines) {
        const ps = Number(ln?.price_subtotal ?? 0); if (Number.isFinite(ps)) sumSub += ps;
        const qd = Number(ln?.qty_delivered ?? 0); if (Number.isFinite(qd)) sumUnits += qd;
        const pu = Number(ln?.price_unit ?? 0); if (Number.isFinite(pu)) { priceUnitSum += pu; priceUnitCount += 1; }
      }
    }
    const nOrders = filteredData.length;
    return { 
      nOrders, 
      totalSales: sumAmount, 
      totalUnitsDelivered: sumUnits, 
      totalSubtotals: sumSub, 
      avgTicketPerOrder: nOrders ? sumAmount / nOrders : 0, 
      avgPricePerProduct: priceUnitCount ? priceUnitSum / priceUnitCount : 0, 
      uniqueClients: clientsSet.size 
    };
  }, [filteredData]);

  // --- Transformaciones para gráficas y tabla
  const chartsAndProducts = useMemo(() => {
    const monthKey = (d) => { 
      if (!d) return null; 
      const y = d.getFullYear(); 
      const m = String(d.getMonth() + 1).padStart(2, "0"); 
      return `${y}-${m}`; 
    };

    // CANAL chart (usa filteredDataForCanalChart)
    const canalMap = new Map();
    for (const order of filteredDataForCanalChart) {
      const amt = Number(order?.amount_total ?? 0); 
      const canal = order?.canal ?? "SIN CANAL";
      canalMap.set(canal, (canalMap.get(canal) || 0) + (Number.isFinite(amt) ? amt : 0));
    }
    const canalData = Array.from(canalMap.entries()).map(([k, v]) => ({ canal: k, value: v })).sort((a, b) => b.value - a.value);

    // MES chart (usa filteredDataForMonthChart)
    const monthMap = new Map();
    for (const order of filteredDataForMonthChart) {
      const od = parseOrderDate(order?.create_date);
      const mk = monthKey(od);
      if (mk) monthMap.set(mk, (monthMap.get(mk) || 0) + (Number(order?.amount_total ?? 0) || 0));
    }
    const monthEntries = Array.from(monthMap.entries()).map(([k, v]) => ({ month: k, value: v })).sort((a, b) => (a.month < b.month ? -1 : 1));
    for (let i = 0; i < monthEntries.length; i++) {
      const prev = i > 0 ? monthEntries[i - 1].value : 0;
      monthEntries[i].variation = prev === 0 ? null : ((monthEntries[i].value - prev) / prev) * 100;
    }

    // MARCA (respeta filtros -> usa filteredData)
    const brandMap = new Map();
    for (const order of filteredData) {
      const lines = Array.isArray(order?.order_lines) ? order.order_lines : [];
      for (const ln of lines) {
        const brand = ln?.product?.brand ?? "SIN MARCA";
        const ps = Number(ln?.price_subtotal ?? 0);
        brandMap.set(brand, (brandMap.get(brand) || 0) + (Number.isFinite(ps) ? ps : 0));
      }
    }
    const brandData = Array.from(brandMap.entries()).map(([k, v]) => ({ brand: k, value: v })).sort((a, b) => b.value - a.value);

    // PRODUCTOS para tabla (usa filteredData)
    const productMap = new Map();
    for (const order of filteredData) {
      const od = parseOrderDate(order?.create_date);
      const mk = monthKey(od);
      const lines = Array.isArray(order?.order_lines) ? order.order_lines : [];
      for (const ln of lines) {
        const prodId = ln?.product?.id ?? Math.random();
        const prodName = ln?.product?.name ?? `Producto ${prodId}`;
        const key = `${prodId}||${prodName}`;
        if (!productMap.has(key)) productMap.set(key, { 
          id: prodId, 
          name: prodName, 
          totalSold: 0, 
          totalUnits: 0, 
          monthly: new Map() 
        });
        const p = productMap.get(key);
        const ps = Number(ln?.price_subtotal ?? 0);
        p.totalSold += Number.isFinite(ps) ? ps : 0;
        const qd = Number(ln?.qty_delivered ?? 0);
        p.totalUnits += Number.isFinite(qd) ? qd : 0;
        if (mk) p.monthly.set(mk, (p.monthly.get(mk) || 0) + (Number.isFinite(ps) ? ps : 0));
      }
    }
    const monthsOrdered = monthEntries.map((m) => m.month);
    const latestMonth = monthsOrdered.length ? monthsOrdered[monthsOrdered.length - 1] : null;
    const prevMonth = monthsOrdered.length > 1 ? monthsOrdered[monthsOrdered.length - 2] : null;
    const productList = Array.from(productMap.values()).map((p) => {
      const currentMonthSales = latestMonth ? (p.monthly.get(latestMonth) || 0) : 0;
      const previousMonthSales = prevMonth ? (p.monthly.get(prevMonth) || 0) : 0;
      const variationAbs = currentMonthSales - previousMonthSales;
      const variationPct = previousMonthSales === 0 ? null : (variationAbs / previousMonthSales) * 100;
      return { 
        id: p.id, 
        name: p.name, 
        totalSold: p.totalSold, 
        totalUnits: p.totalUnits, 
        currentMonthSales, 
        previousMonthSales, 
        variationAbs, 
        variationPct 
      };
    }).sort((a, b) => b.totalSold - a.totalSold);

    return { canalData, monthWithAccum: monthEntries, brandData, productList, latestMonth, prevMonth };
  }, [filteredData, filteredDataForCanalChart, filteredDataForMonthChart]);

  // --- formatting helpers
  const formatCurrency = (value) => { 
    try { 
      return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 2 }).format(value); 
    } catch { 
      return Number(value).toFixed(2); 
    } 
  };
  
  const formatNumber = (value) => { 
    try { 
      return new Intl.NumberFormat("es-CO").format(value); 
    } catch { 
      return String(value); 
    } 
  };
  
  const formatTime = (date) => { 
    if (!date) return "Nunca"; 
    return date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" }); 
  };

  const clearFilters = () => {
    setStartDate(""); 
    setEndDate(""); 
    setFilterCanal([]); 
    setFilterCliente([]); 
    setFilterMarca([]); 
    setFilterProducto([]); 
    setFilterInvoiceStatus([]);
  };

  const COLORS = ["#111827", "#2563EB", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6", "#06B6D4", "#F97316"];

  function CustomLineTooltip({ active, payload }) {
    if (!active || !payload || !payload.length) return null;
    const row = payload[0].payload;
    return (
      <div style={{ background: "#fff", padding: 10, borderRadius: 6, boxShadow: "0 6px 18px rgba(0,0,0,0.08)", fontSize: 13 }}>
        <div style={{ fontWeight: 700 }}>{row.month}</div>
        <div>Ventas: <strong>{formatCurrency(row.value)}</strong></div>
        <div>Variación vs mes anterior: <strong>{row.variation === null ? "N/A" : `${row.variation.toFixed(2)}%`}</strong></div>
      </div>
    );
  }

  return (
    <div className={styles.container} style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Dashboard de ventas Coltrade (2025)</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleManualRefresh} style={btnStyle}>🔄 Refrescar desde API</button>
          <button onClick={handleClearCache} style={{ ...btnStyle, background: "#dc2626" }}>🗑️ Limpiar Cache</button>
          <button onClick={clearFilters} style={{ ...btnStyle, background: "#6b7280" }}>🧹 Limpiar filtros</button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, fontSize: 13, color: "#555" }}>
        <div>
          {loading ? "⏳ Cargando métricas..." : error ? <span style={{ color: "crimson" }}>❌ {error}</span> : <span>📊 {kpis.nOrders} órdenes filtradas · {kpis.uniqueClients} clientes únicos · <strong> {formatNumber(rawData.length)}</strong> registros en cache</span>}
        </div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>{cacheInfo} · Última actualización: {formatTime(lastRefresh)}</div>
      </div>

      {/* FILTROS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 16 }}>
        <div>
          <label style={labelStyle}>Fecha inicio</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Fecha fin</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Canal (multi)</label>
          <Select isMulti options={canalOptions} value={filterCanal} onChange={(v) => setFilterCanal(v || [])} placeholder="Escribe para buscar..." isClearable />
        </div>

        <div>
          <label style={labelStyle}>Cliente (multi)</label>
          <Select isMulti options={clientOptions} value={filterCliente} onChange={(v) => setFilterCliente(v || [])} placeholder="Escribe para buscar clientes..." isClearable />
        </div>

        <div>
          <label style={labelStyle}>Marca (multi)</label>
          <Select isMulti options={brandOptions} value={filterMarca} onChange={(v) => setFilterMarca(v || [])} placeholder="Buscar marca..." isClearable />
        </div>

        <div>
          <label style={labelStyle}>Producto (multi)</label>
          <Select isMulti options={productOptions} value={filterProducto} onChange={(v) => setFilterProducto(v || [])} placeholder="Buscar producto..." isClearable />
        </div>

        <div>
          <label style={labelStyle}>Estado factura (multi)</label>
          <Select isMulti options={invoiceStatusOptions} value={filterInvoiceStatus} onChange={(v) => setFilterInvoiceStatus(v || [])} placeholder="Filtrar por estado de factura..." isClearable />
        </div>
      </div>

      {/* CARDS */}
      {!loading && !error && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 16 }}>
          <Card title="Total ventas (COP)" value={formatCurrency(kpis.totalSales)} caption={`${kpis.nOrders} órdenes`} />
          <Card title="Total unidades vendidas" value={formatNumber(kpis.totalUnitsDelivered)} caption="Suma de qty_delivered en líneas" />
          <Card title="Total subtotales (COP)" value={formatCurrency(kpis.totalSubtotals)} caption="Suma de price_subtotal de líneas" />
          <Card title="Ticket promedio por orden (COP)" value={formatCurrency(kpis.avgTicketPerOrder)} caption="Suma(amount_total) / nro órdenes" />
          <Card title="Precio promedio por producto (COP)" value={formatCurrency(kpis.avgPricePerProduct)} caption="Promedio simple de price_unit" />
          <Card title="Clientes activos (únicos)" value={formatNumber(kpis.uniqueClients)} caption="Clientes distintos (partner.id)" />
        </div>
      )}

      {/* GRÁFICAS */}
      {!loading && !error && (
        <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* CANAL */}
          <div style={{ background: "white", borderRadius: 10, padding: 12, boxShadow: "0 6px 18px rgba(15,23,42,0.06)" }}>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>Participación y ventas por canal</div>
            <div style={{ height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={chartsAndProducts.canalData} dataKey="value" nameKey="canal" cx="50%" cy="50%" outerRadius={90} label={false} labelLine={false}>
                    {chartsAndProducts.canalData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                  </Pie>
                  <ReTooltip formatter={(val) => formatCurrency(val)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ marginTop: 8, fontSize: 12 }}>
              {chartsAndProducts.canalData.map((c, i) => (
                <div key={c.canal} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "4px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ display: "inline-block", width: 12, height: 8, background: COLORS[i % COLORS.length], marginRight: 8 }} />
                    {c.canal}
                  </div>
                  <div>{formatCurrency(c.value)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* VARIACIÓN MENSUAL */}
          <div style={{ background: "white", borderRadius: 10, padding: 12, boxShadow: "0 6px 18px rgba(15,23,42,0.06)" }}>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>Variación de ventas mensuales</div>
            <div style={{ height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={chartsAndProducts.monthWithAccum}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ReTooltip content={<CustomLineTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="value" name="Ventas mes" stroke="#2563EB" strokeWidth={2} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ marginTop: 8, fontSize: 12 }}>
              {chartsAndProducts.monthWithAccum.length ? (
                <div>
                  Último mes: <strong>{chartsAndProducts.monthWithAccum[chartsAndProducts.monthWithAccum.length - 1].month}</strong>
                  {" · "}Ventas: <strong>{formatCurrency(chartsAndProducts.monthWithAccum[chartsAndProducts.monthWithAccum.length - 1].value)}</strong>
                </div>
              ) : "No hay datos mensuales"}
            </div>
          </div>

          {/* MARCA (bar) */}
          <div style={{ gridColumn: "1 / -1", background: "white", borderRadius: 10, padding: 12, boxShadow: "0 6px 18px rgba(15,23,42,0.06)" }}>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>Distribución de ventas por marca (suma de price_subtotal)</div>
            <div style={{ height: 360 }}>
              <ResponsiveContainer>
                <BarChart data={chartsAndProducts.brandData.slice(0, 20)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="brand" angle={-20} textAnchor="end" interval={0} height={70} />
                  <YAxis />
                  <ReTooltip formatter={(val) => formatCurrency(val)} />
                  <Bar dataKey="value" name="Ventas (subtotal)">
                    {chartsAndProducts.brandData.slice(0, 20).map((entry, index) => (<Cell key={`barcell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TABLA */}
      {!loading && !error && (
        <div style={{ marginTop: 18, background: "white", borderRadius: 10, padding: 12, boxShadow: "0 6px 18px rgba(15,23,42,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Productos — resumen</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                Comparación mes: <strong>{chartsAndProducts.latestMonth || "N/A"}</strong> vs <strong>{chartsAndProducts.prevMonth || "N/A"}</strong>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12, overflowX: "auto" }}>
            <div style={{ maxHeight: 360, overflowY: "auto", border: "1px solid #f3f4f6", borderRadius: 6 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                <thead>
                  <tr style={{ textAlign: "left" }}>
                    <th style={{ padding: "10px 8px", position: "sticky", top: 0, background: "#fff", zIndex: 2, borderBottom: "1px solid #e5e7eb" }}>Producto</th>
                    <th style={{ padding: "10px 8px", position: "sticky", top: 0, background: "#fff", zIndex: 2, borderBottom: "1px solid #e5e7eb" }}>Total vendido (COP)</th>
                    <th style={{ padding: "10px 8px", position: "sticky", top: 0, background: "#fff", zIndex: 2, borderBottom: "1px solid #e5e7eb" }}>Unidades</th>
                    <th style={{ padding: "10px 8px", position: "sticky", top: 0, background: "#fff", zIndex: 2, borderBottom: "1px solid #e5e7eb" }}>Venta mes ({chartsAndProducts.latestMonth || "N/A"})</th>
                    <th style={{ padding: "10px 8px", position: "sticky", top: 0, background: "#fff", zIndex: 2, borderBottom: "1px solid #e5e7eb" }}>Venta mes ({chartsAndProducts.prevMonth || "N/A"})</th>
                    <th style={{ padding: "10px 8px", position: "sticky", top: 0, background: "#fff", zIndex: 2, borderBottom: "1px solid #e5e7eb" }}>Variación (COP)</th>
                    <th style={{ padding: "10px 8px", position: "sticky", top: 0, background: "#fff", zIndex: 2, borderBottom: "1px solid #e5e7eb" }}>Variación (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {chartsAndProducts.productList.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "10px 8px", maxWidth: 420 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div></td>
                      <td style={{ padding: "10px 8px" }}>{formatCurrency(p.totalSold)}</td>
                      <td style={{ padding: "10px 8px" }}>{formatNumber(p.totalUnits)}</td>
                      <td style={{ padding: "10px 8px" }}>{formatCurrency(p.currentMonthSales)}</td>
                      <td style={{ padding: "10px 8px" }}>{formatCurrency(p.previousMonthSales)}</td>
                      <td style={{ padding: "10px 8px" }}>{p.variationAbs === 0 ? formatCurrency(0) : p.variationAbs ? formatCurrency(p.variationAbs) : "N/A"}</td>
                      <td style={{ padding: "10px 8px" }}>{p.variationPct === null ? "N/A" : `${p.variationPct.toFixed(2)}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 14, color: "#666", fontSize: 13 }}>
        <strong>Sistema de Cache Activo:</strong> Los datos persisten entre navegaciones. Usar <strong>"Refrescar desde API"</strong> para datos actualizados. <strong> F5</strong> no recarga los datos (usa cache).
      </div>
    </div>
  );
};

export default DashboardVentasColtradeOdoo;

/* ---------- helper components & styles ---------- */

function Card({ title, value, caption }) {
  return (
    <div style={{ background: "white", borderRadius: 10, padding: 16, boxShadow: "0 6px 18px rgba(15,23,42,0.06)", minHeight: 96, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>{title}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}><div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div></div>
      {caption && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>{caption}</div>}
    </div>
  );
}

const btnStyle = { padding: "8px 12px", borderRadius: 8, border: "none", background: "#111827", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 500 };
const labelStyle = { display: "block", fontSize: 12, color: "#374151", marginBottom: 6 };
const inputStyle = { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db" };