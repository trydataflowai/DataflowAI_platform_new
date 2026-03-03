const BASE_URL = "http://localhost:8000/api";

function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem("token") || "";
  return token
    ? { ...extra, Authorization: `Bearer ${token.replace(/^Bearer\s*/i, "")}` }
    : extra;
}

function toList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

async function getList(endpoint) {
  const res = await fetch(`${BASE_URL}/${endpoint}/`, {
    credentials: "include",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Error fetching ${endpoint}`);
  const body = await res.json().catch(() => []);
  return toList(body);
}

export async function getVentasBelkin() {
  return getList("ventas-belkin");
}

export async function getInventariosBelkin() {
  return getList("inventarios-belkin");
}

export async function getProductosBelkin() {
  return getList("productos-belkin");
}

export async function getPdvBelkin() {
  return getList("pdv-belkin");
}

/**
 * filtrarVentas: filtra array de ventas segun objeto filtros
 * filtros = {
 *   fechaInicio: "YYYY-MM-DD" | "",
 *   fechaFin: "YYYY-MM-DD" | "",
 *   productos: [ "Cargador 20 w", ... ],
 *   marcas: [ "BELKIN", ... ],
 *   categorias: [ "PHONE ACCESORIES", ... ],
 *   puntosVenta: [ "Calle 80", ... ],
 *   canales: [ "HOMECENTER", ... ]
 * }
 */
export function filtrarVentas(ventas = [], filtros = {}) {
  // defensivo
  const {
    fechaInicio = "",
    fechaFin = "",
    productos = [],
    marcas = [],
    categorias = [],
    puntosVenta = [],
    canales = []
  } = filtros || {};

  const start = fechaInicio ? new Date(fechaInicio) : null;
  const end = fechaFin ? (() => {
    const d = new Date(fechaFin);
    // incluir todo el dia final (23:59:59)
    d.setHours(23, 59, 59, 999);
    return d;
  })() : null;

  // normalizador de texto
  const norm = (v) => (v === null || v === undefined) ? "" : String(v).toLowerCase();

  return ventas.filter(v => {
    const fecha = v.fecha_venta ? new Date(v.fecha_venta) : null;
    if (start && (!fecha || fecha < start)) return false;
    if (end && (!fecha || fecha > end)) return false;

    if (productos && productos.length) {
      if (!productos.map(norm).includes(norm(v.producto))) return false;
    }
    if (marcas && marcas.length) {
      if (!marcas.map(norm).includes(norm(v.marca))) return false;
    }
    if (categorias && categorias.length) {
      if (!categorias.map(norm).includes(norm(v.categoria))) return false;
    }
    if (puntosVenta && puntosVenta.length) {
      if (!puntosVenta.map(norm).includes(norm(v.punto_venta))) return false;
    }
    if (canales && canales.length) {
      if (!canales.map(norm).includes(norm(v.canal_cliente))) return false;
    }

    return true;
  });
}
