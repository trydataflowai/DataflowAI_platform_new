// front-dataflowai/src/components/dashboards/DashboardColtradeOdoo.jsx
import React, { useEffect, useMemo, useState } from "react";
import styles from "../../styles/CreacionUsuario.module.css";
import { fetchSalesColtrade } from "../../api/DashboardsApis/DashboardColtradeOdoo";

/**
 * Dashboard con filtros y KPIs:
 * - Filtros: fecha (start/end), canal, cliente, marca, producto, invoice_status
 * - KPIs (calculados sobre el conjunto filtrado):
 *   1) Total ventas (suma amount_total)
 *   2) Total unidades vendidas (suma qty_delivered de las líneas)
 *   3) Total subtotales (suma price_subtotal de todas las order_lines)
 *   4) Ticket promedio por orden = suma(amount_total) / nro_ordenes
 *   5) Ticket promedio por producto = promedio de price_unit sobre todas las líneas
 *   6) Total clientes activos (únicos partner.id)
 *
 * Nota: el filtrado se hace en el cliente sobre los datos traídos (fetch all = true).
 */
const DashboardVentasColtradeOdoo = () => {
  const [rawData, setRawData] = useState([]); // datos tal cual vienen del backend (results array)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // filtros
  const [startDate, setStartDate] = useState(""); // YYYY-MM-DD
  const [endDate, setEndDate] = useState(""); // YYYY-MM-DD
  const [filterCanal, setFilterCanal] = useState("");
  const [filterCliente, setFilterCliente] = useState("");
  const [filterMarca, setFilterMarca] = useState("");
  const [filterProducto, setFilterProducto] = useState("");
  const [filterInvoiceStatus, setFilterInvoiceStatus] = useState("");

  // metadata para selects (calculados desde rawData)
  const canals = useMemo(() => {
    const s = new Set();
    rawData.forEach((o) => { if (o?.canal) s.add(String(o.canal)); });
    return Array.from(s).sort();
  }, [rawData]);

  const clients = useMemo(() => {
    const s = new Set();
    rawData.forEach((o) => {
      const id = o?.partner?.id;
      const name = o?.partner?.name;
      if (id !== undefined && id !== null) s.add(JSON.stringify({ id, name }));
    });
    return Array.from(s).map((x) => JSON.parse(x)).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [rawData]);

  const brands = useMemo(() => {
    const s = new Set();
    rawData.forEach((o) => {
      const lines = Array.isArray(o?.order_lines) ? o.order_lines : [];
      lines.forEach((ln) => {
        const brand = ln?.product?.brand;
        if (brand) s.add(String(brand));
      });
    });
    return Array.from(s).sort();
  }, [rawData]);

  const products = useMemo(() => {
    const s = new Set();
    rawData.forEach((o) => {
      const lines = Array.isArray(o?.order_lines) ? o.order_lines : [];
      lines.forEach((ln) => {
        const pname = ln?.product?.name;
        if (pname) s.add(String(pname));
      });
    });
    return Array.from(s).sort();
  }, [rawData]);

  const invoiceStatuses = useMemo(() => {
    const s = new Set();
    rawData.forEach((o) => {
      const st = o?.invoice_status;
      if (st) s.add(String(st));
    });
    return Array.from(s).sort();
  }, [rawData]);

  // Cargar datos (fetch all por defecto)
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSalesColtrade({ all: true });
      // backend puede devolver { total, page, per_page, results }
      const results = Array.isArray(res) ? res : res.results || [];
      setRawData(results);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Función utilitaria para convertir create_date string a Date (defensiva)
  const parseOrderDate = (createDateStr) => {
    if (!createDateStr) return null;
    // Odoo suele usar "YYYY-MM-DD HH:MM:SS" — transformamos a ISO-compatible
    const iso = createDateStr.replace(" ", "T");
    const d = new Date(iso);
    if (isNaN(d.getTime())) {
      // fallback: try date-only
      const dateOnly = createDateStr.split(" ")[0];
      const dd = new Date(dateOnly + "T00:00:00");
      return isNaN(dd.getTime()) ? null : dd;
    }
    return d;
  };

  // Aplicar filtros sobre rawData -> filteredData
  const filteredData = useMemo(() => {
    if (!rawData || !rawData.length) return [];

    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59`) : null;
    const canalLower = filterCanal ? String(filterCanal).toLowerCase() : "";
    const clienteLower = filterCliente ? String(filterCliente).toLowerCase() : "";
    const marcaLower = filterMarca ? String(filterMarca).toLowerCase() : "";
    const productoLower = filterProducto ? String(filterProducto).toLowerCase() : "";
    const invStatusLower = filterInvoiceStatus ? String(filterInvoiceStatus).toLowerCase() : "";

    return rawData.filter((o) => {
      // fecha
      const od = parseOrderDate(o?.create_date);
      if (start && (!od || od < start)) return false;
      if (end && (!od || od > end)) return false;

      // canal
      if (canalLower) {
        const c = (o?.canal ?? "").toString().toLowerCase();
        if (!c.includes(canalLower)) return false;
      }

      // cliente (buscar por name)
      if (clienteLower) {
        const cname = (o?.partner?.name ?? "").toString().toLowerCase();
        if (!cname.includes(clienteLower)) return false;
      }

      // marca: revisar si alguna línea tiene la marca
      if (marcaLower) {
        const lines = Array.isArray(o?.order_lines) ? o.order_lines : [];
        const found = lines.some((ln) => (ln?.product?.brand ?? "").toString().toLowerCase().includes(marcaLower));
        if (!found) return false;
      }

      // producto: revisar si alguna línea contiene el nombre del producto
      if (productoLower) {
        const lines = Array.isArray(o?.order_lines) ? o.order_lines : [];
        const foundProd = lines.some((ln) => (ln?.product?.name ?? "").toString().toLowerCase().includes(productoLower));
        if (!foundProd) return false;
      }

      // invoice_status
      if (invStatusLower) {
        const st = (o?.invoice_status ?? "").toString().toLowerCase();
        if (!st.includes(invStatusLower)) return false;
      }

      return true;
    });
  }, [rawData, startDate, endDate, filterCanal, filterCliente, filterMarca, filterProducto, filterInvoiceStatus]);

  // Calcular KPIs sobre filteredData
  const kpis = useMemo(() => {
    const results = filteredData;
    let sumAmount = 0;
    let sumUnitsDelivered = 0; // ahora sumamos qty_delivered de las líneas
    let sumSubtotals = 0;
    let priceUnitSum = 0;
    let priceUnitCount = 0;
    const clientsSet = new Set();

    for (const order of results) {
      const amt = Number(order?.amount_total ?? 0);
      sumAmount += Number.isFinite(amt) ? amt : 0;

      const pid = order?.partner?.id;
      if (pid !== undefined && pid !== null) clientsSet.add(String(pid));

      const lines = Array.isArray(order?.order_lines) ? order.order_lines : [];
      for (const ln of lines) {
        const ps = Number(ln?.price_subtotal ?? 0);
        sumSubtotals += Number.isFinite(ps) ? ps : 0;

        // SUMAR qty_delivered por línea (cantidad vendida real)
        const qd = Number(ln?.qty_delivered ?? 0);
        sumUnitsDelivered += Number.isFinite(qd) ? qd : 0;

        const pu = Number(ln?.price_unit ?? 0);
        if (Number.isFinite(pu)) {
          priceUnitSum += pu;
          priceUnitCount += 1;
        }
      }
    }

    const nOrders = results.length;
    const avgOrder = nOrders > 0 ? sumAmount / nOrders : 0;
    const avgProduct = priceUnitCount > 0 ? priceUnitSum / priceUnitCount : 0;

    return {
      nOrders,
      totalSales: sumAmount,
      totalUnitsDelivered: sumUnitsDelivered,
      totalSubtotals: sumSubtotals,
      avgTicketPerOrder: avgOrder,
      avgPricePerProduct: avgProduct,
      uniqueClients: clientsSet.size,
    };
  }, [filteredData]);

  const formatCurrency = (value) => {
    try {
      return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 2 }).format(value);
    } catch {
      return Number(value).toFixed(2);
    }
  };
  const formatNumber = (value) => {
    try { return new Intl.NumberFormat("es-CO").format(value); } catch { return String(value); }
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setFilterCanal("");
    setFilterCliente("");
    setFilterMarca("");
    setFilterProducto("");
    setFilterInvoiceStatus("");
  };

  return (
    <div className={styles.container} style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Dashboard de ventas Coltrade (2025)</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={loadData} style={btnStyle}>🔄 Refrescar</button>
          <button onClick={clearFilters} style={{ ...btnStyle, background: "#6b7280" }}>🧹 Limpiar filtros</button>
        </div>
      </div>

      {/* FILTROS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12,
        marginTop: 16,
        alignItems: "end",
      }}>
        <div>
          <label style={labelStyle}>Fecha inicio</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Fecha fin</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Canal</label>
          <select value={filterCanal} onChange={(e) => setFilterCanal(e.target.value)} style={inputStyle}>
            <option value="">— Todos —</option>
            {canals.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Cliente</label>
          <select value={filterCliente} onChange={(e) => setFilterCliente(e.target.value)} style={inputStyle}>
            <option value="">— Todos —</option>
            {clients.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Marca</label>
          <select value={filterMarca} onChange={(e) => setFilterMarca(e.target.value)} style={inputStyle}>
            <option value="">— Todas —</option>
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Producto</label>
          <select value={filterProducto} onChange={(e) => setFilterProducto(e.target.value)} style={inputStyle}>
            <option value="">— Todos —</option>
            {products.map((p) => <option key={p} value={p}>{p.length > 60 ? (p.slice(0, 60) + "…") : p}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Estado factura</label>
          <select value={filterInvoiceStatus} onChange={(e) => setFilterInvoiceStatus(e.target.value)} style={inputStyle}>
            <option value="">— Todos —</option>
            {invoiceStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Mensajes */}
      <div style={{ marginTop: 12 }}>
        {loading ? <div>⏳ Cargando métricas...</div> : error ? <div style={{ color: "crimson" }}>❌ {error}</div> : <div style={{ color: "#555" }}>{kpis.nOrders} órdenes · {kpis.uniqueClients} clientes únicos · {formatNumber(rawData.length)} registros totales traídos</div>}
      </div>

      {/* CARDS */}
      {!loading && !error && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 16 }}>
          <Card title="Total ventas (COP)" value={formatCurrency(kpis.totalSales)} caption={`${kpis.nOrders} órdenes`} />
          <Card title="Total unidades vendidas" value={formatNumber(kpis.totalUnitsDelivered)} caption="Suma de qty_delivered en líneas (cantidad entregada)" />
          <Card title="Total subtotales (COP)" value={formatCurrency(kpis.totalSubtotals)} caption="Suma de price_subtotal de líneas" />
          <Card title="Ticket promedio por orden (COP)" value={formatCurrency(kpis.avgTicketPerOrder)} caption="Suma(amount_total) / nro órdenes" />
          <Card title="Precio promedio por producto (COP)" value={formatCurrency(kpis.avgPricePerProduct)} caption="Promedio simple de price_unit en líneas" />
          <Card title="Clientes activos (únicos)" value={formatNumber(kpis.uniqueClients)} caption="Clientes distintos (partner.id)" />
        </div>
      )}

      {/* Notas / Foot */}
      <div style={{ marginTop: 14, color: "#666", fontSize: 13 }}>
        Fuente: <code>odoo/order/salescoltrade/</code>. Aplicar filtros y usar <strong>Refrescar</strong> para recargar desde backend.
      </div>
    </div>
  );
};

export default DashboardVentasColtradeOdoo;

/* ---------- helper components & styles ---------- */

function Card({ title, value, caption }) {
  return (
    <div style={{
      background: "white",
      borderRadius: 10,
      padding: 16,
      boxShadow: "0 6px 18px rgba(15,23,42,0.06)",
      minHeight: 96,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    }}>
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>{title}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
      </div>
      {caption && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>{caption}</div>}
    </div>
  );
}

const btnStyle = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "none",
  background: "#111827",
  color: "white",
  cursor: "pointer",
};

const labelStyle = { display: "block", fontSize: 12, color: "#374151", marginBottom: 6 };
const inputStyle = { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db" };
