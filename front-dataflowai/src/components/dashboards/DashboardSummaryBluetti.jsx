import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { useNavigate } from "react-router-dom";
import {
  getDashboardSummaryBluettiData,
  normalizeDate,
  normalizeId,
  RETAIL_ANNUAL_GOAL_COP,
  toNumber,
  toWorldCountryName,
} from "../../api/DashboardsApis/DashboardSummaryBluetti";
import "../../styles/Dashboards/DashboardSummaryBluetti.css";
import { BLUETTI_MODULE_LINKS } from "../../constants/moduleMenus";

function diffDaysInclusive(from, to) {
  if (!from || !to) return null;
  const a = new Date(from);
  const b = new Date(to);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  const diff = Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff + 1 : null;
}

const MONTH_NAME_TO_INT = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

function parseMonthToInt(value) {
  if (value === null || value === undefined || value === "") return null;
  const asNumber = Number(value);
  if (!Number.isNaN(asNumber) && asNumber >= 1 && asNumber <= 12) return asNumber;
  const key = String(value).trim().toLowerCase();
  return MONTH_NAME_TO_INT[key] ?? null;
}

function parseDateFlexible(value) {
  const txt = String(value || "").trim();
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
}

function monthKey(value) {
  if (!value) return "";
  const d = parseDateFlexible(value);
  if (!d || Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(month) {
  if (!month || month.length !== 7) return month || "-";
  const [year, m] = month.split("-");
  return `${m}/${year}`;
}

function formatVariationPct(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "N/A";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function extendBoundsFromCoords(coords, bounds) {
  if (!Array.isArray(coords)) return;
  if (coords.length >= 2 && typeof coords[0] === "number" && typeof coords[1] === "number") {
    const lon = coords[0];
    const lat = coords[1];
    if (lon < bounds.minLon) bounds.minLon = lon;
    if (lon > bounds.maxLon) bounds.maxLon = lon;
    if (lat < bounds.minLat) bounds.minLat = lat;
    if (lat > bounds.maxLat) bounds.maxLat = lat;
    return;
  }
  coords.forEach((c) => extendBoundsFromCoords(c, bounds));
}

function getMapFocusFromGeoJson(geoJson, targetCountryNames) {
  const defaultFocus = { center: [12, 15], zoom: 1.15 };
  if (!geoJson || !Array.isArray(geoJson.features) || !targetCountryNames?.size) return defaultFocus;

  const bounds = { minLon: Infinity, maxLon: -Infinity, minLat: Infinity, maxLat: -Infinity };

  geoJson.features.forEach((feature) => {
    const countryName = feature?.properties?.name;
    if (!countryName || !targetCountryNames.has(countryName)) return;

    const geometry = feature?.geometry;
    if (!geometry) return;

    if (geometry.type === "GeometryCollection" && Array.isArray(geometry.geometries)) {
      geometry.geometries.forEach((g) => extendBoundsFromCoords(g?.coordinates, bounds));
      return;
    }

    extendBoundsFromCoords(geometry.coordinates, bounds);
  });

  if (![bounds.minLon, bounds.maxLon, bounds.minLat, bounds.maxLat].every(Number.isFinite)) return defaultFocus;

  const center = [
    Number(((bounds.minLon + bounds.maxLon) / 2).toFixed(4)),
    Number(((bounds.minLat + bounds.maxLat) / 2).toFixed(4)),
  ];

  const lonSpan = Math.max(0, bounds.maxLon - bounds.minLon);
  const latSpan = Math.max(0, bounds.maxLat - bounds.minLat);
  const span = Math.max(lonSpan * 1.2, latSpan * 1.45, 8);

  let zoom = 1.1;
  if (span <= 14) zoom = 5.2;
  else if (span <= 22) zoom = 3.9;
  else if (span <= 32) zoom = 3.1;
  else if (span <= 48) zoom = 2.4;
  else if (span <= 70) zoom = 1.95;
  else if (span <= 95) zoom = 1.55;
  else if (span <= 130) zoom = 1.3;

  return { center, zoom };
}

export default function DashboardSummaryBluetti() {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [rawData, setRawData] = useState({
    ventas: [],
    inventarios: [],
    metas: [],
    canales: [],
    clientes: [],
    productos: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [worldMapReady, setWorldMapReady] = useState(false);
  const [worldGeoJson, setWorldGeoJson] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [expandedCanales, setExpandedCanales] = useState({});
  const [filtros, setFiltros] = useState({
    fechaDesde: "",
    fechaHasta: "",
    canalId: "",
    clienteId: "",
    pais: "",
    tipoVenta: "sell_in",
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getDashboardSummaryBluettiData();
        if (!mounted) return;
        setRawData(data);
      } catch (err) {
        if (!mounted) return;
        setError("No fue posible cargar datos para DashboardSummaryBluetti.");
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
    let mounted = true;
    const loadWorldGeoJson = async () => {
      try {
        const urls = [
          "https://cdn.jsdelivr.net/npm/echarts/map/json/world.json",
          "https://fastly.jsdelivr.net/npm/echarts/map/json/world.json",
          "https://code.highcharts.com/mapdata/custom/world.geo.json",
        ];
        let worldGeoJson = null;
        for (const url of urls) {
          try {
            const res = await fetch(url);
            if (!res.ok) continue;
            worldGeoJson = await res.json();
            if (worldGeoJson) break;
          } catch (err) {
            // try next URL
          }
        }
        if (!worldGeoJson) throw new Error("No se pudo descargar world.json");
        if (!mounted) return;
        echarts.registerMap("world", worldGeoJson);
        setWorldGeoJson(worldGeoJson);
        setWorldMapReady(true);
      } catch (err) {
        if (!mounted) return;
        setWorldMapReady(false);
        setWorldGeoJson(null);
      }
    };

    loadWorldGeoJson();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!showMenu) return;
    const handleOutside = (event) => {
      if (!menuRef.current || menuRef.current.contains(event.target)) return;
      setShowMenu(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
    };
  }, [showMenu]);

  const canalesMap = useMemo(() => {
    const map = {};
    rawData.canales.forEach((c) => {
      const id = normalizeId(c.id_registro ?? c.id);
      if (!id) return;
      map[id] = {
        id,
        nombre: c.nombre_canal ?? c.nombre ?? `Canal ${id}`,
        codigo: c.codigo_canal ?? "",
      };
    });
    return map;
  }, [rawData.canales]);

  const clientesMap = useMemo(() => {
    const map = {};
    rawData.clientes.forEach((c) => {
      const id = normalizeId(c.id_registro ?? c.id);
      if (!id) return;
      const canalId = normalizeId(c.canal);
      map[id] = {
        id,
        nombre: c.nombre_cliente ?? c.nombre ?? `Cliente ${id}`,
        canal_id: canalId,
        canal_nombre: canalId ? canalesMap[canalId]?.nombre ?? `Canal ${canalId}` : "Sin canal",
        pais: c.pais || "Sin Pais",
      };
    });
    return map;
  }, [rawData.clientes, canalesMap]);

  const ventasEnriched = useMemo(() => {
    return rawData.ventas.map((v) => {
      const canalId = normalizeId(v.canal);
      const clienteId = normalizeId(v.cliente);
      const canalNombre = canalId ? canalesMap[canalId]?.nombre ?? `Canal ${canalId}` : "Sin canal";
      const clienteNombre = clienteId ? clientesMap[clienteId]?.nombre ?? `Cliente ${clienteId}` : "Sin cliente";
      const pais = v.pais || (clienteId ? clientesMap[clienteId]?.pais : "") || "Sin Pais";
      return {
        ...v,
        canal_id: canalId,
        cliente_id: clienteId,
        canal_nombre: canalNombre,
        cliente_nombre: clienteNombre,
        pais,
        fecha_venta_norm: normalizeDate(v.fecha_venta),
      };
    });
  }, [rawData.ventas, canalesMap, clientesMap]);

  const inventariosEnriched = useMemo(() => {
    return rawData.inventarios.map((r) => {
      const canalId = normalizeId(r.canal);
      const clienteId = normalizeId(r.cliente);
      return {
        ...r,
        canal_id: canalId,
        cliente_id: clienteId,
        canal_nombre: canalId ? canalesMap[canalId]?.nombre ?? `Canal ${canalId}` : "Sin canal",
        cliente_nombre: clienteId ? clientesMap[clienteId]?.nombre ?? `Cliente ${clienteId}` : "Sin cliente",
        pais: r.pais || (clienteId ? clientesMap[clienteId]?.pais : "") || "Sin Pais",
        fecha_inventario_norm: normalizeDate(r.fecha_inventario),
      };
    });
  }, [rawData.inventarios, canalesMap, clientesMap]);

  const metasEnriched = useMemo(() => {
    return rawData.metas.map((m) => {
      const canalId = normalizeId(m.canal);
      return {
        ...m,
        canal_id: canalId,
        canal_nombre: canalId ? canalesMap[canalId]?.nombre ?? `Canal ${canalId}` : "Sin canal",
      };
    });
  }, [rawData.metas, canalesMap]);

  const canalesOptions = useMemo(() => {
    return Object.values(canalesMap).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [canalesMap]);

  const clientesOptions = useMemo(() => {
    return Object.values(clientesMap).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [clientesMap]);

  const paisesOptions = useMemo(() => {
    const set = new Set();
    ventasEnriched.forEach((v) => set.add(v.pais || "Sin Pais"));
    inventariosEnriched.forEach((i) => set.add(i.pais || "Sin Pais"));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [ventasEnriched, inventariosEnriched]);

  const ventasFiltradas = useMemo(() => {
    return ventasEnriched.filter((v) => {
      if (filtros.fechaDesde && v.fecha_venta_norm && v.fecha_venta_norm < filtros.fechaDesde) return false;
      if (filtros.fechaHasta && v.fecha_venta_norm && v.fecha_venta_norm > filtros.fechaHasta) return false;
      if (filtros.canalId && String(v.canal_id) !== String(filtros.canalId)) return false;
      if (filtros.clienteId && String(v.cliente_id) !== String(filtros.clienteId)) return false;
      if (filtros.pais && (v.pais || "") !== filtros.pais) return false;
      if (filtros.tipoVenta !== "all" && (v.tipo_venta || "sell_in") !== filtros.tipoVenta) return false;
      return true;
    });
  }, [ventasEnriched, filtros]);

  const inventariosFiltrados = useMemo(() => {
    return inventariosEnriched.filter((r) => {
      if (filtros.canalId && String(r.canal_id) !== String(filtros.canalId)) return false;
      if (filtros.clienteId && String(r.cliente_id) !== String(filtros.clienteId)) return false;
      if (filtros.pais && (r.pais || "") !== filtros.pais) return false;
      return true;
    });
  }, [inventariosEnriched, filtros]);

  const selectedYear = useMemo(() => {
    if (filtros.fechaDesde) return Number(filtros.fechaDesde.slice(0, 4));
    if (ventasFiltradas[0]?.ano) return Number(ventasFiltradas[0].ano);
    return new Date().getFullYear();
  }, [filtros.fechaDesde, ventasFiltradas]);

  const selectedPeriodKeys = useMemo(() => {
    if (!filtros.fechaDesde && !filtros.fechaHasta) return null;

    const startRaw = filtros.fechaDesde || filtros.fechaHasta;
    const endRaw = filtros.fechaHasta || filtros.fechaDesde;
    if (!startRaw || !endRaw) return null;

    const start = parseDateFlexible(startRaw);
    const end = parseDateFlexible(endRaw);
    if (!start || !end) return null;
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

    const from = start <= end ? start : end;
    const to = start <= end ? end : start;
    const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
    const limit = new Date(to.getFullYear(), to.getMonth(), 1);
    const keys = new Set();

    while (cursor <= limit) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, "0");
      keys.add(`${y}-${m}`);
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return keys;
  }, [filtros.fechaDesde, filtros.fechaHasta]);

  const totalVentasCOP = useMemo(() => ventasFiltradas.reduce((acc, v) => acc + toNumber(v.total_venta), 0), [ventasFiltradas]);
  const sellInUnidades = useMemo(
    () => ventasFiltradas.filter((v) => v.tipo_venta === "sell_in").reduce((acc, v) => acc + toNumber(v.cantidad), 0),
    [ventasFiltradas]
  );
  const sellInCOP = useMemo(
    () => ventasFiltradas.filter((v) => v.tipo_venta === "sell_in").reduce((acc, v) => acc + toNumber(v.total_venta), 0),
    [ventasFiltradas]
  );
  const margenContribucionCOP = useMemo(
    () => ventasFiltradas.reduce((acc, v) => acc + (toNumber(v.total_venta) - toNumber(v.costo_total)), 0),
    [ventasFiltradas]
  );
  const margenContribucionPct = totalVentasCOP > 0 ? (margenContribucionCOP / totalVentasCOP) * 100 : 0;

  const inventarioDisponible = useMemo(
    () => inventariosFiltrados.reduce((acc, r) => acc + toNumber(r.cantidad_disponible), 0),
    [inventariosFiltrados]
  );
  const inventarioReservado = useMemo(
    () => inventariosFiltrados.reduce((acc, r) => acc + toNumber(r.cantidad_reservada), 0),
    [inventariosFiltrados]
  );

  const activeClients = useMemo(() => new Set(ventasFiltradas.map((v) => v.cliente_id).filter(Boolean)).size, [ventasFiltradas]);

  const periodDays = useMemo(() => {
    const directRange = diffDaysInclusive(filtros.fechaDesde, filtros.fechaHasta);
    if (directRange) return directRange;
    const uniqueDates = new Set(ventasFiltradas.map((v) => v.fecha_venta_norm).filter(Boolean));
    return uniqueDates.size || 30;
  }, [ventasFiltradas, filtros.fechaDesde, filtros.fechaHasta]);

  const avgSellInDailyUnits = periodDays > 0 ? sellInUnidades / periodDays : 0;
  const doi = avgSellInDailyUnits > 0 ? inventarioDisponible / avgSellInDailyUnits : null;

  const annualGoalFromMetas = useMemo(() => {
    return metasEnriched
      .filter((m) => {
        if (filtros.canalId && String(m.canal_id) !== String(filtros.canalId)) return false;
        if (filtros.pais && String(m.pais || "") !== String(filtros.pais)) return false;

        const year = Number(m.ano);
        const month = parseMonthToInt(m.mes);
        if (!year || !month) return false;

        if (selectedPeriodKeys) {
          const key = `${year}-${String(month).padStart(2, "0")}`;
          return selectedPeriodKeys.has(key);
        }

        if (year !== Number(selectedYear)) return false;
        return true;
      })
      .reduce((acc, m) => acc + toNumber(m.meta_monetaria), 0);
  }, [metasEnriched, selectedYear, selectedPeriodKeys, filtros.canalId, filtros.pais]);

  const annualGoalCOP = annualGoalFromMetas > 0 ? annualGoalFromMetas : (selectedPeriodKeys ? 0 : RETAIL_ANNUAL_GOAL_COP);
  const annualGoalProgress = annualGoalCOP > 0 ? (sellInCOP / annualGoalCOP) * 100 : 0;
  const annualGoalProgressForUI = Math.max(0, Math.min(annualGoalProgress, 100));
  const annualGoalPointerPct = Math.max(2, Math.min(annualGoalProgressForUI, 98));

  const ventasPorCanal = useMemo(() => {
    const acc = {};
    ventasFiltradas.forEach((v) => {
      const key = v.canal_nombre || "Sin canal";
      if (!acc[key]) acc[key] = { canal: key, total: 0, unidades: 0, sell_in: 0, sell_out: 0 };
      acc[key].total += toNumber(v.total_venta);
      acc[key].unidades += toNumber(v.cantidad);
      if (v.tipo_venta === "sell_in") acc[key].sell_in += toNumber(v.total_venta);
      if (v.tipo_venta === "sell_out") acc[key].sell_out += toNumber(v.total_venta);
    });
    return Object.values(acc).sort((a, b) => b.total - a.total);
  }, [ventasFiltradas]);

  const historicoMes = useMemo(() => {
    const acc = {};
    ventasFiltradas.forEach((v) => {
      const month = monthKey(v.fecha_venta_norm || v.fecha_venta);
      if (!month) return;
      if (!acc[month]) acc[month] = { month, ventas: 0, unidades: 0 };
      acc[month].ventas += toNumber(v.total_venta);
      acc[month].unidades += toNumber(v.cantidad);
    });

    const rows = Object.values(acc).sort((a, b) => a.month.localeCompare(b.month));
    return rows.map((row, index) => {
      if (index === 0) return { ...row, variacion_pct: null };
      const prev = rows[index - 1].ventas;
      if (prev === 0) return { ...row, variacion_pct: null };
      return { ...row, variacion_pct: ((row.ventas - prev) / prev) * 100 };
    });
  }, [ventasFiltradas]);

  const topClientes = useMemo(() => {
    const acc = {};
    ventasFiltradas.forEach((v) => {
      const key = v.cliente_nombre || "Sin cliente";
      if (!acc[key]) acc[key] = { cliente: key, ventas: 0, unidades: 0 };
      acc[key].ventas += toNumber(v.total_venta);
      acc[key].unidades += toNumber(v.cantidad);
    });
    return Object.values(acc).sort((a, b) => b.ventas - a.ventas).slice(0, 12);
  }, [ventasFiltradas]);
  const topClientsVentasTotal = useMemo(
    () => topClientes.reduce((acc, x) => acc + toNumber(x.ventas), 0),
    [topClientes]
  );

  const analisisInventarios = useMemo(() => {
    const byCanal = {};

    const ensureCanal = (id, nombre) => {
      const key = String(id ?? nombre ?? "sin-canal");
      if (!byCanal[key]) {
        byCanal[key] = {
          key,
          canal_id: id ?? null,
          canal_nombre: nombre || "Sin canal",
          ventas: 0,
          unidades: 0,
          sell_in_unidades: 0,
          inventario_disponible: 0,
          inventario_reservado: 0,
          clientes: {},
        };
      }
      return byCanal[key];
    };

    const ensureCliente = (canal, id, nombre) => {
      const key = String(id ?? nombre ?? "sin-cliente");
      if (!canal.clientes[key]) {
        canal.clientes[key] = {
          key,
          cliente_id: id ?? null,
          cliente_nombre: nombre || "Sin cliente",
          ventas: 0,
          unidades: 0,
          sell_in_unidades: 0,
          inventario_disponible: 0,
          inventario_reservado: 0,
        };
      }
      return canal.clientes[key];
    };

    ventasFiltradas.forEach((v) => {
      const canal = ensureCanal(v.canal_id, v.canal_nombre);
      const cliente = ensureCliente(canal, v.cliente_id, v.cliente_nombre);
      const venta = toNumber(v.total_venta);
      const unidades = toNumber(v.cantidad);
      const sellInUnits = v.tipo_venta === "sell_in" ? unidades : 0;

      canal.ventas += venta;
      canal.unidades += unidades;
      canal.sell_in_unidades += sellInUnits;

      cliente.ventas += venta;
      cliente.unidades += unidades;
      cliente.sell_in_unidades += sellInUnits;
    });

    inventariosFiltrados.forEach((r) => {
      const canal = ensureCanal(r.canal_id, r.canal_nombre);
      const cliente = ensureCliente(canal, r.cliente_id, r.cliente_nombre);
      const invDisp = toNumber(r.cantidad_disponible);
      const invRes = toNumber(r.cantidad_reservada);

      canal.inventario_disponible += invDisp;
      canal.inventario_reservado += invRes;

      cliente.inventario_disponible += invDisp;
      cliente.inventario_reservado += invRes;
    });

    return Object.values(byCanal)
      .map((canal) => {
        const avgVentasDia = periodDays > 0 ? canal.ventas / periodDays : 0;
        const avgSellInDia = periodDays > 0 ? canal.sell_in_unidades / periodDays : 0;
        const doiCanal = avgSellInDia > 0 ? canal.inventario_disponible / avgSellInDia : null;

        const clientes = Object.values(canal.clientes)
          .map((cliente) => {
            const avgVentasDiaCli = periodDays > 0 ? cliente.ventas / periodDays : 0;
            const avgSellInDiaCli = periodDays > 0 ? cliente.sell_in_unidades / periodDays : 0;
            const doiCli = avgSellInDiaCli > 0 ? cliente.inventario_disponible / avgSellInDiaCli : null;
            return {
              ...cliente,
              avg_ventas_dia: avgVentasDiaCli,
              avg_sell_in_dia: avgSellInDiaCli,
              doi: doiCli,
            };
          })
          .sort((a, b) => b.ventas - a.ventas);

        return {
          ...canal,
          avg_ventas_dia: avgVentasDia,
          avg_sell_in_dia: avgSellInDia,
          doi: doiCanal,
          clientes,
        };
      })
      .sort((a, b) => b.ventas - a.ventas);
  }, [inventariosFiltrados, periodDays, ventasFiltradas]);

  const presenciaPorPais = useMemo(() => {
    const acc = {};
    const ensure = (country) => {
      const key = country || "Sin Pais";
      if (!acc[key]) acc[key] = { pais: key, ventas: 0, inventario: 0, clientes: new Set(), fuerza: 0 };
      return acc[key];
    };

    ventasFiltradas.forEach((v) => {
      const item = ensure(v.pais);
      item.ventas += toNumber(v.total_venta);
      if (v.cliente_id) item.clientes.add(v.cliente_id);
    });

    inventariosFiltrados.forEach((r) => {
      const item = ensure(r.pais);
      item.inventario += toNumber(r.cantidad_disponible);
      if (r.cliente_id) item.clientes.add(r.cliente_id);
    });

    const baseRows = Object.values(acc)
      .map((r) => {
        const clientesCount = r.clientes.size;
        const fuerza = r.ventas / 1000000 + r.inventario * 0.25 + clientesCount * 5;
        return {
          pais: r.pais,
          worldName: toWorldCountryName(r.pais),
          ventas: r.ventas,
          inventario: r.inventario,
          clientes: clientesCount,
          fuerza,
        };
      });

    const totalVentas = baseRows.reduce((sum, row) => sum + row.ventas, 0);
    const totalFuerza = baseRows.reduce((sum, row) => sum + row.fuerza, 0);

    return baseRows
      .map((row) => ({
        ...row,
        participacion_ventas_pct: totalVentas > 0 ? (row.ventas / totalVentas) * 100 : 0,
        score_cobertura_pct: totalFuerza > 0 ? (row.fuerza / totalFuerza) * 100 : 0,
      }))
      .sort((a, b) => b.fuerza - a.fuerza);
  }, [ventasFiltradas, inventariosFiltrados]);

  const mapSeriesData = useMemo(() => {
    return presenciaPorPais
      .filter((p) => p.worldName && p.worldName !== "Sin Pais")
      .map((p) => ({
        name: p.worldName,
        value: Number(p.ventas.toFixed(2)),
        ventas: Number(p.ventas.toFixed(2)),
        inventario: Number(p.inventario.toFixed(2)),
        clientes: p.clientes,
        fuerza: Number(p.fuerza.toFixed(2)),
        participacion_ventas_pct: Number(p.participacion_ventas_pct.toFixed(2)),
        score_cobertura_pct: Number(p.score_cobertura_pct.toFixed(2)),
      }));
  }, [presenciaPorPais]);

  const salesCountryNames = useMemo(() => {
    const names = ventasEnriched
      .filter((v) => toNumber(v.total_venta) > 0)
      .map((v) => toWorldCountryName(v.pais))
      .filter(Boolean);
    return new Set(names);
  }, [ventasEnriched]);

  const mapInitialFocus = useMemo(
    () => getMapFocusFromGeoJson(worldGeoJson, salesCountryNames),
    [worldGeoJson, salesCountryNames]
  );

  const mapMax = useMemo(() => {
    const max = mapSeriesData.reduce((acc, x) => (x.value > acc ? x.value : acc), 0);
    return max > 0 ? max : 10;
  }, [mapSeriesData]);

  const chartTooltip = {
    backgroundColor: "rgba(11, 18, 32, 0.96)",
    borderColor: "#1d7afc",
    borderWidth: 1,
    textStyle: { color: "#e2e8f0" },
    extraCssText: "box-shadow: 0 8px 26px rgba(2, 6, 23, 0.6); border-radius: 10px;",
  };

  const axisLabelStyle = { color: "#94a3b8", fontSize: 12 };
  const axisLineStyle = { lineStyle: { color: "#334155" } };
  const splitLineStyle = { lineStyle: { color: "rgba(148, 163, 184, 0.12)" } };

  const worldMapOption = useMemo(
    () => ({
      backgroundColor: "transparent",
      tooltip: {
        ...chartTooltip,
        trigger: "item",
        formatter: (params) => {
          const data = params.data || {};
          return [
            `<strong>${params.name}</strong>`,
            `Ventas: ${toNumber(data.ventas).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}`,
            `Participacion ventas: ${toNumber(data.participacion_ventas_pct).toFixed(2)}%`,
            `Inventario: ${toNumber(data.inventario).toLocaleString("es-CO")}`,
            `Clientes activos: ${toNumber(data.clientes).toLocaleString("es-CO")}`,
            `Score de Cobertura: ${toNumber(data.score_cobertura_pct).toFixed(2)}%`,
          ].join("<br/>");
        },
      },
      visualMap: {
        min: 0,
        max: mapMax,
        orient: "horizontal",
        left: "center",
        bottom: 0,
        text: ["Mayor Venta", "Menor Venta"],
        textStyle: { color: "#cbd5e1" },
        inRange: {
          color: ["#0f294b", "#1d7afc", "#00c2ff"],
        },
      },
      toolbox: {
        show: true,
        right: 10,
        top: 10,
        iconStyle: {
          borderColor: "#94a3b8",
        },
        emphasis: {
          iconStyle: {
            borderColor: "#60a5fa",
          },
        },
        feature: {
          restore: {},
          saveAsImage: { name: "presencia-bluetti" },
        },
      },
      series: [
        {
          name: "Presencia",
          type: "map",
          map: "world",
          roam: true,
          scaleLimit: { min: 1, max: 10 },
          center: mapInitialFocus.center,
          zoom: mapInitialFocus.zoom,
          itemStyle: {
            areaColor: "#13213a",
            borderColor: "#243146",
          },
          emphasis: {
            label: { show: true, color: "#f8fafc" },
            itemStyle: { areaColor: "#22d3ee" },
          },
          data: mapSeriesData,
        },
      ],
    }),
    [chartTooltip, mapInitialFocus.center, mapInitialFocus.zoom, mapSeriesData, mapMax]
  );

  const channelPieOption = useMemo(
    () => ({
      tooltip: {
        ...chartTooltip,
        trigger: "item",
        formatter: (params) => {
          const val = toNumber(params.value);
          const pct = toNumber(params.percent);
          return [
            `<strong>${params.name}</strong>`,
            `Ventas: ${val.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}`,
            `Participacion: ${pct.toFixed(2)}%`,
          ].join("<br/>");
        },
      },
      legend: {
        type: "scroll",
        orient: "vertical",
        right: 0,
        top: "center",
        textStyle: { color: "#cbd5e1", fontSize: 12 },
      },
      color: ["#1d7afc", "#00c2ff", "#22c55e", "#f59e0b", "#eab308", "#38bdf8", "#34d399", "#3b82f6"],
      series: [
        {
          name: "Participacion Ventas",
          type: "pie",
          radius: ["40%", "70%"],
          center: ["36%", "50%"],
          avoidLabelOverlap: true,
          minAngle: 3,
          itemStyle: { borderColor: "#0b1220", borderWidth: 2 },
          label: {
            show: true,
            color: "#e2e8f0",
            formatter: "{d}%",
            fontSize: 11,
          },
          labelLine: {
            show: true,
            lineStyle: { color: "#64748b" },
          },
          data: ventasPorCanal.map((x) => ({
            name: x.canal,
            value: Number(x.total.toFixed(2)),
          })),
        },
      ],
      graphic: ventasPorCanal.length
        ? []
        : [
            {
              type: "text",
              left: "center",
              top: "middle",
              style: {
                text: "Sin datos",
                fill: "#94a3b8",
                fontSize: 13,
                fontWeight: 600,
              },
            },
          ],
    }),
    [chartTooltip, ventasPorCanal]
  );

  const historicoOption = useMemo(
    () => ({
      tooltip: {
        ...chartTooltip,
        trigger: "axis",
        formatter: (params) => {
          const rows = Array.isArray(params) ? params : [params];
          if (!rows.length) return "";
          const axisLabel = rows[0]?.axisValueLabel || "";
          const lines = [`<strong>${axisLabel}</strong>`];
          rows.forEach((row) => {
            const value = toNumber(row.value);
            if (row.seriesName === "Variacion %") {
              lines.push(`${row.marker}${row.seriesName}: ${formatVariationPct(value)}`);
              return;
            }
            lines.push(`${row.marker}${row.seriesName}: ${value.toLocaleString("es-CO", {
              style: "currency",
              currency: "COP",
              maximumFractionDigits: 0,
            })}`);
          });
          return lines.join("<br/>");
        },
      },
      legend: { top: 0, textStyle: { color: "#cbd5e1", fontSize: 12 } },
      xAxis: {
        type: "category",
        data: historicoMes.map((m) => formatMonthLabel(m.month)),
        axisLabel: axisLabelStyle,
        axisLine: axisLineStyle,
      },
      yAxis: [
        {
          type: "value",
          name: "Ventas",
          axisLabel: {
            ...axisLabelStyle,
            formatter: (value) => `${Math.round(value / 1000000)}M`,
          },
          axisLine: axisLineStyle,
          splitLine: splitLineStyle,
        },
        {
          type: "value",
          name: "Variacion %",
          axisLabel: {
            ...axisLabelStyle,
            formatter: (value) => `${value}%`,
          },
          axisLine: axisLineStyle,
          splitLine: { show: false },
        },
      ],
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
      grid: { left: 55, right: 55, top: 40, bottom: 50 },
      graphic: historicoMes.length
        ? []
        : [
            {
              type: "text",
              left: "center",
              top: "middle",
              style: {
                text: "Sin datos para el periodo",
                fill: "#94a3b8",
                fontSize: 13,
                fontWeight: 600,
              },
            },
          ],
    }),
    [axisLabelStyle, axisLineStyle, chartTooltip, splitLineStyle, historicoMes]
  );

  const topClientsOption = useMemo(
    () => ({
      tooltip: {
        ...chartTooltip,
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params) => {
          const row = Array.isArray(params) ? params[0] : params;
          if (!row) return "";
          const valor = toNumber(row.value);
          const pct = topClientsVentasTotal > 0 ? (valor / topClientsVentasTotal) * 100 : 0;
          return [
            `<strong>${row.name}</strong>`,
            `Ventas: ${valor.toLocaleString("es-CO", {
              style: "currency",
              currency: "COP",
              maximumFractionDigits: 0,
            })}`,
            `Participacion: ${pct.toFixed(2)}%`,
          ].join("<br/>");
        },
      },
      xAxis: {
        type: "value",
        axisLabel: axisLabelStyle,
        axisLine: axisLineStyle,
        splitLine: splitLineStyle,
      },
      yAxis: {
        type: "category",
        data: topClientes.map((x) => x.cliente),
        inverse: true,
        axisLabel: axisLabelStyle,
        axisLine: axisLineStyle,
      },
      series: [
        {
          name: "Ventas COP",
          type: "bar",
          data: topClientes.map((x) => Number(x.ventas.toFixed(2))),
          itemStyle: { color: "#38bdf8" },
          barMaxWidth: 18,
        },
      ],
      grid: { left: 170, right: 20, top: 30, bottom: 30 },
    }),
    [axisLabelStyle, axisLineStyle, chartTooltip, splitLineStyle, topClientes, topClientsVentasTotal]
  );

  const toggleCanalExpand = (canalKey) => {
    setExpandedCanales((prev) => ({
      ...prev,
      [canalKey]: !prev[canalKey],
    }));
  };

  if (loading) {
    return (
      <div className="DashboardSummaryBluetti">
        <div className="DashboardSummaryBluetti_loading">Cargando Dashboard Summary Bluetti...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="DashboardSummaryBluetti">
        <div className="DashboardSummaryBluetti_error">{error}</div>
      </div>
    );
  }

  return (
    <div className="DashboardSummaryBluetti">
      <div className="DashboardSummaryBluetti_header">
        <div className="DashboardSummaryBluetti_header_top">
          <h2>Dashboard Summary Bluetti</h2>
          <div className="DashboardSummaryBluetti_nav_wrapper" ref={menuRef}>
            <button className="DashboardSummaryBluetti_nav_btn" type="button" onClick={() => setShowMenu((v) => !v)}>
              Menu de modulos
            </button>
            {showMenu && (
              <div className="DashboardSummaryBluetti_nav_menu">
                {BLUETTI_MODULE_LINKS.map((link) => (
                  <button
                    key={link.path}
                    type="button"
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
        <p>Mapeo de presencia nacional y seguimiento por canales y cuentas/clientes activos.</p>
      </div>

      <section className="DashboardSummaryBluetti_filters">
        <div className="field">
          <label>Fecha desde</label>
          <input type="date" value={filtros.fechaDesde} onChange={(e) => setFiltros((p) => ({ ...p, fechaDesde: e.target.value }))} />
        </div>
        <div className="field">
          <label>Fecha hasta</label>
          <input type="date" value={filtros.fechaHasta} onChange={(e) => setFiltros((p) => ({ ...p, fechaHasta: e.target.value }))} />
        </div>
        <div className="field">
          <label>Canal</label>
          <select value={filtros.canalId} onChange={(e) => setFiltros((p) => ({ ...p, canalId: e.target.value }))}>
            <option value="">Todos</option>
            {canalesOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Cliente</label>
          <select value={filtros.clienteId} onChange={(e) => setFiltros((p) => ({ ...p, clienteId: e.target.value }))}>
            <option value="">Todos</option>
            {clientesOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Pais</label>
          <select value={filtros.pais} onChange={(e) => setFiltros((p) => ({ ...p, pais: e.target.value }))}>
            <option value="">Todos</option>
            {paisesOptions.map((pais) => (
              <option key={pais} value={pais}>{pais}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Tipo venta</label>
          <select value={filtros.tipoVenta} onChange={(e) => setFiltros((p) => ({ ...p, tipoVenta: e.target.value }))}>
            <option value="sell_in">Sell-In</option>
          </select>
        </div>
      </section>

      <section className="DashboardSummaryBluetti_kpis">
        <article className="card">
          <h4>Clientes Activos</h4>
          <p>{activeClients}</p>
        </article>
        <article className="card">
          <h4>{selectedPeriodKeys ? "Meta del Periodo" : "Meta Anual"}</h4>
          <p>{annualGoalCOP.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}</p>
          <small>Objetivo de ventas Sell-In del periodo</small>
        </article>
        <article className="card">
          <h4>Ventas</h4>
          <p>{sellInCOP.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}</p>
        </article>
        <article className="card card--metaProgress">
          <h4>Cumplimiento Meta %</h4>
          <div className="metaMeter_info metaMeter_info--compact">
            <p>{annualGoalProgress.toFixed(1)}%</p>
          </div>
          <div className="metaMileage">
            <div className="metaMileage_track">
              <div className="metaMileage_fill" style={{ width: `${annualGoalProgressForUI}%` }} />
              <span className="metaMileage_pointer" style={{ left: `${annualGoalPointerPct}%` }} />
            </div>
            <div className="metaMileage_labels">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
          {annualGoalProgress > 100 ? <small>Sobrecumplimiento: +{(annualGoalProgress - 100).toFixed(1)}%</small> : null}
        </article>
        <article className="card">
          <h4>Margen Contribucion</h4>
          <p>{margenContribucionCOP.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}</p>
          <small>{margenContribucionPct.toFixed(1)}%</small>
        </article>
        <article className="card">
          <h4>Inventario Disponible</h4>
          <p>{inventarioDisponible.toLocaleString("es-CO")}</p>
          <small>Reservado: {inventarioReservado.toLocaleString("es-CO")}</small>
        </article>
        <article className="card">
          <h4>DOI (dias)</h4>
          <p>{doi === null ? "-" : doi.toFixed(1)}</p>
        </article>
      </section>

      <section className="DashboardSummaryBluetti_grid DashboardSummaryBluetti_grid--primary">
        <article className="panel">
          <h3>Presencia Global (Heatmap)</h3>
          <p className="hint">Mapamundi dinamico con zoom, tooltip y ranking por pais integrado.</p>
          <div className="DashboardSummaryBluetti_mapComposite">
            <div className="DashboardSummaryBluetti_mapCanvas">
              {worldMapReady ? (
                <ReactECharts option={worldMapOption} style={{ height: 420 }} />
              ) : (
                <div className="emptyState">Cargando mapa mundial...</div>
              )}
            </div>

            <aside className="DashboardSummaryBluetti_countryPane">
              <h4>Detalle por Pais</h4>
              <div className="DashboardSummaryBluetti_countryList">
                {presenciaPorPais.length ? (
                  presenciaPorPais.map((row, index) => (
                    <div className="DashboardSummaryBluetti_countryRow" key={row.pais}>
                      <div className="DashboardSummaryBluetti_countryMain">
                        <span className="DashboardSummaryBluetti_countryRank">{index + 1}</span>
                        <span className="DashboardSummaryBluetti_countryName">{row.pais}</span>
                      </div>
                      <div className="DashboardSummaryBluetti_countryMetrics">
                        <span>{row.ventas.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}</span>
                        <span>Part. Ventas: {row.participacion_ventas_pct.toFixed(2)}%</span>
                        <span>Inv: {row.inventario.toLocaleString("es-CO")}</span>
                        <span>Cli: {row.clientes}</span>
                        <span>Score de Cobertura: {row.score_cobertura_pct.toFixed(2)}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="DashboardSummaryBluetti_countryEmpty">Sin datos disponibles por pais.</div>
                )}
              </div>
            </aside>
          </div>
        </article>
        <article className="panel">
          <h3>Ventas por Canal (Participacion %)</h3>
          <ReactECharts option={channelPieOption} style={{ height: 420 }} />
        </article>
      </section>

      <section className="DashboardSummaryBluetti_grid">
        <article className="panel">
          <h3>Historico de Ventas (Variacion mes a mes)</h3>
          <ReactECharts option={historicoOption} style={{ height: 360 }} />
        </article>
        <article className="panel">
          <h3>Top Cuentas / Clientes</h3>
          <ReactECharts option={topClientsOption} style={{ height: 360 }} />
        </article>
      </section>

      <section className="panel">
        <h3>Analisis de Inventarios (Canal y Clientes)</h3>
        <p className="hint">Expande cada canal para ver detalle por cliente, DOI y promedios diarios.</p>
        <div className="DashboardSummaryBluetti_inventoryWrap">
          <table className="DashboardSummaryBluetti_inventoryTable">
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Nivel</th>
                <th>Canal / Cliente</th>
                <th>Ventas COP</th>
                <th>Prom. Ventas / Dia</th>
                <th>Inv. Disponible</th>
                <th>Inv. Reservado</th>
                <th>Sell-In Prom. Dia</th>
                <th>DOI (dias)</th>
              </tr>
            </thead>
            <tbody>
              {analisisInventarios.length ? (
                analisisInventarios.map((canal) => {
                  const expanded = !!expandedCanales[canal.key];
                  return (
                    <React.Fragment key={canal.key}>
                      <tr className="DashboardSummaryBluetti_rowCanal">
                        <td>
                          <button
                            type="button"
                            className="DashboardSummaryBluetti_expandBtn"
                            onClick={() => toggleCanalExpand(canal.key)}
                            title={expanded ? "Contraer" : "Expandir"}
                          >
                            {expanded ? "▾" : "▸"}
                          </button>
                        </td>
                        <td>Canal</td>
                        <td>{canal.canal_nombre}</td>
                        <td>{canal.ventas.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}</td>
                        <td>{canal.avg_ventas_dia.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}</td>
                        <td>{canal.inventario_disponible.toLocaleString("es-CO")}</td>
                        <td>{canal.inventario_reservado.toLocaleString("es-CO")}</td>
                        <td>{canal.avg_sell_in_dia.toFixed(2)}</td>
                        <td>{canal.doi === null ? "-" : canal.doi.toFixed(1)}</td>
                      </tr>
                      {expanded &&
                        canal.clientes.map((cliente) => (
                          <tr className="DashboardSummaryBluetti_rowCliente" key={`${canal.key}-${cliente.key}`}>
                            <td></td>
                            <td>Cliente</td>
                            <td>{cliente.cliente_nombre}</td>
                            <td>{cliente.ventas.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}</td>
                            <td>{cliente.avg_ventas_dia.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}</td>
                            <td>{cliente.inventario_disponible.toLocaleString("es-CO")}</td>
                            <td>{cliente.inventario_reservado.toLocaleString("es-CO")}</td>
                            <td>{cliente.avg_sell_in_dia.toFixed(2)}</td>
                            <td>{cliente.doi === null ? "-" : cliente.doi.toFixed(1)}</td>
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="DashboardSummaryBluetti_inventoryEmpty">
                    No hay datos para analizar con los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
