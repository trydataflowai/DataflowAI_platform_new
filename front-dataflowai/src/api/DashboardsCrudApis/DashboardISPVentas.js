import { useState, useMemo } from 'react';

/* ------------- CONFIG ------------- */
// Tomar la URL base desde las variables de entorno Vite, con fallback seguro
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Helper para concatenar rutas sin errores por barras duplicadas
const buildUrl = (path) => {
  const base = String(API_BASE_URL || '').replace(/\/+$|^\/+/, '');
  const p = String(path || '').replace(/^\/+/, '');
  // Si la base queda vacía devolvemos la ruta tal cual
  if (!base) return `/${p}`;
  return `${base}/${p}`;
};

/* ------------- HELPERS ------------- */
const safeNumber = (raw) => {
  if (raw === null || raw === undefined) return 0;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0;
  let s = String(raw).trim();
  if (s === '') return 0;
  const hasComma = s.indexOf(',') !== -1;
  const hasDot = s.indexOf('.') !== -1;
  if (hasComma && hasDot) {
    s = s.replace(/\./g, '').replace(/,/g, '.');
  } else {
    s = s.replace(/[^0-9,.-]+/g, '');
    if (s.indexOf(',') !== -1 && s.indexOf('.') === -1) s = s.replace(/,/g, '.');
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

const toDateSafe = (val) => {
  if (!val) return null;
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d;
  const parts = String(val).split(/[-\/]/).map(p => p.trim());
  if (parts.length === 3) {
    const [a, b, c] = parts;
    if (a.length === 4) return new Date(Number(a), Number(b) - 1, Number(c));
    if (c.length === 4) return new Date(Number(c), Number(b) - 1, Number(a));
  }
  return null;
};

const includesAny = (value, filterValue) => {
  if (filterValue === undefined || filterValue === null) return true;
  if (Array.isArray(filterValue)) {
    if (filterValue.length === 0) return true;
    if (value === null || value === undefined) return false;
    const v = String(value).toLowerCase().trim();
    return filterValue.some(f => String(f).toLowerCase().trim() === v);
  } else {
    if (filterValue === '') return true;
    if (value === null || value === undefined) return false;
    return String(value).toLowerCase().trim() === String(filterValue).toLowerCase().trim();
  }
};

/* ------------- FETCH ------------- */
export const getVentas = async () => {
  const token = (() => {
    try { return localStorage.getItem('token') || ''; } catch { return ''; }
  })();

  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(buildUrl('dashboard_isp_ventas/list/'), {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let msg = `Error ${res.status}`;
    try {
      const json = JSON.parse(text);
      msg = json.message || text || msg;
    } catch {
      msg = text || msg;
    }
    throw new Error(msg);
  }

  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : [];
};

/* ------------- NORMALIZACION ------------- */
export const normalizeVentas = (rawArray) => {
  if (!Array.isArray(rawArray)) return [];
  return rawArray.map(r => {
    const fechaObj = toDateSafe(r.fecha_registro || r.fecha || null);
    const fecha_iso = fechaObj ? fechaObj.toISOString().slice(0,10) : null;

    const fiObj = toDateSafe(r.fecha_inicio || null);
    const ffObj = toDateSafe(r.fecha_fin || null);
    const fecha_inicio_iso = fiObj ? fiObj.toISOString().slice(0,10) : null;
    const fecha_fin_iso = ffObj ? ffObj.toISOString().slice(0,10) : null;

    return {
      ...r,
      monto_facturado: safeNumber(r.monto_facturado),
      precio_mensual: safeNumber(r.precio_mensual),
      unidades: safeNumber(r.unidades),
      ano: r.ano !== undefined && r.ano !== null ? String(r.ano) : (fecha_iso ? String(new Date(fecha_iso).getFullYear()) : ''),
      mes: r.mes ? String(r.mes) : (fecha_iso ? ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][new Date(fecha_iso).getMonth()] : ''),
      fecha_registro: fecha_iso,
      fecha_inicio: fecha_inicio_iso,
      fecha_fin: fecha_fin_iso,
    };
  });
};

/* ------------- BUILD OPTIONS ------------- */
export const buildOptionsFromVentas = (ventas) => {
  const sets = {
    categoria_clientes: new Set(),
    ciudades: new Set(),
    segmentos: new Set(),
    nombres_plan: new Set(),
    categorias_plan: new Set(),
    estados_suscripcion: new Set(),
    metodos_pago: new Set(),
  };

  (ventas || []).forEach(v => {
    if (!v) return;
    if (v.categoria_cliente) sets.categoria_clientes.add(String(v.categoria_cliente));
    if (v.ciudad) sets.ciudades.add(String(v.ciudad));
    if (v.segmento) sets.segmentos.add(String(v.segmento));
    if (v.nombre_plan) sets.nombres_plan.add(String(v.nombre_plan));
    if (v.categoria_plan) sets.categorias_plan.add(String(v.categoria_plan));
    if (v.estado_suscripcion) sets.estados_suscripcion.add(String(v.estado_suscripcion));
    if (v.metodo_pago) sets.metodos_pago.add(String(v.metodo_pago));
  });

  const sortAlpha = arr => arr.sort((a,b) => String(a).localeCompare(String(b), undefined, { numeric: true }));

  return {
    categoria_clientes: sortAlpha(Array.from(sets.categoria_clientes)),
    ciudades: sortAlpha(Array.from(sets.ciudades)),
    segmentos: sortAlpha(Array.from(sets.segmentos)),
    nombres_plan: sortAlpha(Array.from(sets.nombres_plan)),
    categorias_plan: sortAlpha(Array.from(sets.categorias_plan)),
    estados_suscripcion: sortAlpha(Array.from(sets.estados_suscripcion)),
    metodos_pago: sortAlpha(Array.from(sets.metodos_pago)),
  };
};

/* ------------- FILTRADO ------------- */
export const filterVentas = (ventas, filters) => {
  if (!Array.isArray(ventas) || ventas.length === 0) return [];

  return ventas.filter(v => {
    if (!v) return false;

    if ((filters.fecha_from || filters.fecha_to) && v.fecha_registro) {
      const fr = toDateSafe(v.fecha_registro);
      if (!fr) return false;
      if (filters.fecha_from) {
        const from = toDateSafe(filters.fecha_from);
        if (from && fr < from) return false;
      }
      if (filters.fecha_to) {
        const to = toDateSafe(filters.fecha_to);
        if (to && fr > to) return false;
      }
    }

    if (!includesAny(v.categoria_cliente, filters.categoria_cliente)) return false;
    if (!includesAny(v.ciudad, filters.ciudad)) return false;
    if (!includesAny(v.segmento, filters.segmento)) return false;
    if (!includesAny(v.nombre_plan, filters.nombre_plan)) return false;
    if (!includesAny(v.categoria_plan, filters.categoria_plan)) return false;
    if (!includesAny(v.estado_suscripcion, filters.estado_suscripcion)) return false;
    if (!includesAny(v.metodo_pago, filters.metodo_pago)) return false;

    return true;
  });
};

/* ------------- KPIS / MEDIDAS ------------- */
export const computeKPIsFromFiltered = (filteredVentas) => {
  if (!Array.isArray(filteredVentas) || filteredVentas.length === 0) {
    return { totalClientes: 0, totalFacturado: 0, customersCanceled: 0 };
  }

  const s = new Set();
  const canceled = new Set();
  let total = 0;
  filteredVentas.forEach(v => {
    if (v && v.nombre_cliente) s.add(String(v.nombre_cliente).trim());
    if (v && v.estado_suscripcion && String(v.estado_suscripcion).toLowerCase().trim() === 'cancelada') {
      canceled.add(String(v.nombre_cliente).trim());
    }
    total += safeNumber(v.monto_facturado);
  });

  return {
    totalClientes: s.size,
    totalFacturado: Number.isFinite(total) ? total : 0,
    customersCanceled: canceled.size,
  };
};

/* ------------- EXTENDED KPIS: CHURN y MRR ------------- */
export const computeExtendedKPIs = (ventas, filteredVentas, filters) => {
  let periodStart = filters && filters.fecha_from ? toDateSafe(filters.fecha_from) : null;
  let periodEnd = filters && filters.fecha_to ? toDateSafe(filters.fecha_to) : null;

  if (!periodStart || !periodEnd) {
    const fechas = (ventas || []).map(v => toDateSafe(v.fecha_registro)).filter(d => d);
    if (fechas.length === 0) {
      const today = new Date();
      const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      periodStart = periodStart || startMonth;
      periodEnd = periodEnd || today;
    } else {
      const sorted = fechas.sort((a,b) => a - b);
      const last = sorted[sorted.length - 1];
      periodStart = periodStart || new Date(last.getFullYear(), last.getMonth(), 1);
      periodEnd = periodEnd || last;
    }
  }

  const isActiveOnDate = (v, date) => {
    if (!v) return false;
    const fi = toDateSafe(v.fecha_inicio);
    const ff = toDateSafe(v.fecha_fin);
    if (!date) return false;
    if (fi && date < fi) return false;
    if (ff && date <= ff && date.getTime() === ff.getTime()) return false;
    if (ff && date > ff) return false;
    return true;
  };

  const customersAtStartSet = new Set();
  (ventas || []).forEach(v => {
    if (!v || !v.nombre_cliente) return;
    if (isActiveOnDate(v, periodStart)) customersAtStartSet.add(String(v.nombre_cliente).trim());
  });
  const customersAtStart = customersAtStartSet.size;

  const customersChurnedSet = new Set();
  (ventas || []).forEach(v => {
    if (!v || !v.nombre_cliente) return;
    const ff = toDateSafe(v.fecha_fin);
    if (!ff) return;
    if (ff > periodStart && ff <= periodEnd) {
      customersChurnedSet.add(String(v.nombre_cliente).trim());
    }
  });
  const customersChurned = customersChurnedSet.size;

  const churnRate = customersAtStart === 0 ? 0 : (customersChurned / customersAtStart);

  const activeCustomersOnEnd = new Map();
  (ventas || []).forEach(v => {
    if (!v || !v.nombre_cliente) return;
    if (isActiveOnDate(v, periodEnd)) {
      const key = String(v.nombre_cliente).trim();
      if (!activeCustomersOnEnd.has(key)) {
        activeCustomersOnEnd.set(key, safeNumber(v.precio_mensual));
      }
    }
  });
  let MRR = 0;
  for (const val of activeCustomersOnEnd.values()) MRR += val;
  MRR = Number.isFinite(MRR) ? MRR : 0;

  return {
    churnRate,
    MRR,
    customersAtStart,
    customersChurned,
    periodStart: periodStart ? periodStart.toISOString().slice(0,10) : null,
    periodEnd: periodEnd ? periodEnd.toISOString().slice(0,10) : null,
  };
};

/* ------------- SERIES MENSUAL ACUMULADO Y VARIACION % ------------- */
export const computeMonthlyAccumAndVar = (filteredVentas) => {
  if (!Array.isArray(filteredVentas) || filteredVentas.length === 0) return [];

  const map = new Map();
  filteredVentas.forEach(v => {
    if (!v) return;
    const fecha = v.fecha_registro || null;
    if (!fecha) return;
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return;
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const current = map.get(ym) || 0;
    map.set(ym, current + (Number.isFinite(v.monto_facturado) ? v.monto_facturado : 0));
  });

  const rows = Array.from(map.entries())
    .map(([ym, monthly_total]) => {
      const [y, m] = ym.split('-').map(Number);
      const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
      return {
        ym,
        year: y,
        month: m,
        label: `${monthNames[m-1]} ${y}`,
        monthly_total: Number(monthly_total)
      };
    })
    .sort((a,b) => (a.year - b.year) || (a.month - b.month));

  let running = 0;
  const result = rows.map((r, idx, arr) => {
    const prevMonthly = idx === 0 ? 0 : (arr[idx - 1].monthly_total || 0);
    running += Number.isFinite(r.monthly_total) ? r.monthly_total : 0;
    const cumulative = running;

    let var_pct = 0;
    if (prevMonthly === 0) {
      var_pct = 0;
    } else {
      var_pct = ((r.monthly_total - prevMonthly) / prevMonthly) * 100;
    }

    return {
      ym: r.ym,
      label: r.label,
      monthly_total: Number(r.monthly_total),
      cumulative: Number(cumulative),
      var_pct: Number(var_pct)
    };
  });

  return result;
};

/* ------------- DISTRIBUCION POR CAMPO ------------- */
export const computeDistributionByField = (filteredVentas, field = 'categoria_plan') => {
  if (!Array.isArray(filteredVentas) || filteredVentas.length === 0) return [];

  const mapCount = new Map();
  const mapTotal = new Map();
  let grandTotal = 0;

  filteredVentas.forEach(v => {
    if (!v) return;
    const key = v[field] ? String(v[field]).trim() : 'Sin asignar';
    const prevCount = mapCount.get(key) || 0;
    const prevTotal = mapTotal.get(key) || 0;
    mapCount.set(key, prevCount + 1);
    const monto = Number.isFinite(v.monto_facturado) ? v.monto_facturado : 0;
    mapTotal.set(key, prevTotal + monto);
    grandTotal += monto;
  });

  const rows = Array.from(mapCount.keys()).map(k => ({
    key: k,
    count: mapCount.get(k) || 0,
    total: mapTotal.get(k) || 0,
    pct: grandTotal === 0 ? 0 : ((mapTotal.get(k) || 0) / grandTotal) * 100
  }));

  rows.sort((a,b) => b.total - a.total);
  return rows;
};

/* ------------- JERARQUIA (TREEMAP) ------------- */
export const computeHierarchyData = (filteredVentas) => {
  if (!Array.isArray(filteredVentas) || filteredVentas.length === 0) {
    return {
      hierarchy: [{ name: 'Sin datos', value: 0, children: [] }],
      byCity: []
    };
  }

  const palette = ['#00B43F','#2CAF47','#3EAA4F','#4CA556','#57A05D','#609B63','#689669','#6F916F','#758B75','#7B867A'];

  const map = new Map();

  filteredVentas.forEach(row => {
    if (!row || typeof row !== 'object') return;

    const montoRaw = row.monto_facturado ?? row.monto ?? row.valor ?? 0;
    const monto = Number.isFinite(montoRaw) ? montoRaw : Number(montoRaw) || 0;

    const ciudadRaw = row.ciudad;
    const ciudad = (ciudadRaw !== undefined && ciudadRaw !== null && String(ciudadRaw).trim() !== '')
      ? String(ciudadRaw).trim()
      : 'Sin asignar';

    map.set(ciudad, (map.get(ciudad) || 0) + monto);
  });

  const byCity = Array.from(map.entries()).map(([name, value], idx) => ({
    name,
    value: Number(value),
    color: palette[idx % palette.length]
  })).sort((a, b) => b.value - a.value);

  const hierarchy = [{
    name: 'Ventas',
    children: byCity.map(c => ({ name: c.name, value: c.value })),
    value: byCity.reduce((s, c) => s + (Number.isFinite(c.value) ? c.value : 0), 0)
  }];

  return { hierarchy, byCity };
};

/* ------------- CUSTOM HOOK PARA TABLA ------------- */
export const useClientesTable = (filteredVentas) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('fecha_inicio');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const filteredTableData = useMemo(() => {
    let filtered = filteredVentas;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(venta => 
        (venta.nombre_cliente?.toLowerCase().includes(term)) ||
        (venta.ciudad?.toLowerCase().includes(term)) ||
        (venta.segmento?.toLowerCase().includes(term)) ||
        (venta.nombre_plan?.toLowerCase().includes(term)) ||
        (venta.categoria_plan?.toLowerCase().includes(term)) ||
        (venta.estado_suscripcion?.toLowerCase().includes(term))
      );
    }
    
    filtered = [...filtered].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (!aValue) aValue = '';
      if (!bValue) bValue = '';
      
      if (sortField === 'monto_facturado') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (sortField === 'fecha_inicio') {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
      }
      
      if (sortDirection === 'asc') {
        return String(aValue).localeCompare(String(bValue));
      } else {
        return String(bValue).localeCompare(String(aValue));
      }
    });
    
    return filtered;
  }, [filteredVentas, searchTerm, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredTableData.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTableData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTableData, currentPage, itemsPerPage]);

  return {
    searchTerm,
    setSearchTerm,
    sortField,
    sortDirection,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    handleSort,
    renderSortIcon,
    filteredTableData,
    totalPages,
    currentItems
  };
};

/* ------------- FUNCIONES PARA BADGES ------------- */
export const getSegmentClass = (segmento, styles) => {
  const segments = {
    'Empresarial': styles?.segmentBusiness || '',
    'Residencial': styles?.segmentResidential || '',
    'Corporativo': styles?.segmentCorporate || '',
  };
  return segments[segmento] || styles?.segmentDefault || '';
};

export const getCategoryClass = (categoria, styles) => {
  const categories = {
    'Básico': styles?.categoryBasic || '',
    'Premium': styles?.categoryPremium || '',
    'Empresarial': styles?.categoryBusiness || '',
    'Corporativo': styles?.categoryCorporate || '',
  };
  return categories[categoria] || styles?.categoryDefault || '';
};

export const getStatusClass = (estado, styles) => {
  const statuses = {
    'Activa': styles?.statusActive || '',
    'Cancelada': styles?.statusCanceled || '',
    'Suspendida': styles?.statusSuspended || '',
    'Pendiente': styles?.statusPending || '',
  };
  return statuses[estado] || styles?.statusDefault || '';
};
