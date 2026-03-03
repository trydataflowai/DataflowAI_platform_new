import { getVentasBluetti } from "../DashboardsCrudApis/Crudventasbluetti";
import { getInventariosBluetti } from "../DashboardsCrudApis/Crudinventariosbluetti";
import { getMetasComercialesBluetti } from "../DashboardsCrudApis/Crudmetasbluetti";
import { getCanalesBluetti } from "../DashboardsCrudApis/Crudcanalesbluetti";
import { getCuentasClientesBluetti } from "../DashboardsCrudApis/Crudcuentas-clientesbluetti";
import { getProductosBluetti } from "../DashboardsCrudApis/Crudproductosbluetti";

export const RETAIL_ANNUAL_GOAL_COP = 672500000;

export function normalizeId(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "object") return value.id_registro ?? value.id ?? null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function toNumber(value) {
  const n = Number(value ?? 0);
  return Number.isNaN(n) ? 0 : n;
}

export function normalizeDate(value) {
  if (!value) return "";
  return String(value).split("T")[0];
}

export function classifyChannel(canalName) {
  const name = String(canalName || "").toLowerCase();
  if (!name) return "Otros";
  if (name.includes("retail") || name.includes("cadena") || name.includes("superficie")) return "Retail";
  if (name.includes("mayor")) return "Resellers - Mayoristas";
  if (name.includes("ferreter")) return "Resellers - Ferreterias";
  if (name.includes("ecom") || name.includes("market") || name.includes("online") || name.includes("digital")) return "E-commerce";
  return "Otros";
}

const COUNTRY_EQUIVALENCE = {
  alemania: "Germany",
  argentina: "Argentina",
  australia: "Australia",
  bolivia: "Bolivia",
  brasil: "Brazil",
  canada: "Canada",
  chile: "Chile",
  china: "China",
  colombia: "Colombia",
  "corea del sur": "South Korea",
  "costa rica": "Costa Rica",
  ecuador: "Ecuador",
  "el salvador": "El Salvador",
  espana: "Spain",
  "estados unidos": "United States",
  francia: "France",
  guatemala: "Guatemala",
  honduras: "Honduras",
  india: "India",
  italia: "Italy",
  japon: "Japan",
  mexico: "Mexico",
  nicaragua: "Nicaragua",
  panama: "Panama",
  paraguay: "Paraguay",
  peru: "Peru",
  "reino unido": "United Kingdom",
  "republica dominicana": "Dominican Rep.",
  uruguay: "Uruguay",
  venezuela: "Venezuela",
};

function stripAccents(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function toWorldCountryName(value) {
  const key = stripAccents(value);
  return COUNTRY_EQUIVALENCE[key] || value || "Sin Pais";
}

export async function getDashboardSummaryBluettiData() {
  const [ventas, inventarios, metas, canales, clientes, productos] = await Promise.all([
    getVentasBluetti(),
    getInventariosBluetti(),
    getMetasComercialesBluetti(),
    getCanalesBluetti(),
    getCuentasClientesBluetti(),
    getProductosBluetti(),
  ]);

  return {
    ventas: Array.isArray(ventas) ? ventas : [],
    inventarios: Array.isArray(inventarios) ? inventarios : [],
    metas: Array.isArray(metas) ? metas : [],
    canales: Array.isArray(canales) ? canales : [],
    clientes: Array.isArray(clientes) ? clientes : [],
    productos: Array.isArray(productos) ? productos : [],
  };
}

