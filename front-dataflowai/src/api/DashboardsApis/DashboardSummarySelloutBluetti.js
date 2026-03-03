import { getVentasSelloutBluetti } from "../DashboardsCrudApis/Crudventasselloutbluetti";
import { getInventariosSelloutBluetti } from "../DashboardsCrudApis/Crudinventariosselloutbluetti";

export function toNumber(value) {
  const n = Number(value ?? 0);
  return Number.isNaN(n) ? 0 : n;
}

export function normalizeDate(value) {
  if (!value) return "";
  return String(value).split("T")[0];
}

export function monthKey(dateStr) {
  const date = normalizeDate(dateStr);
  if (!date || date.length < 7) return "";
  return date.slice(0, 7);
}

export async function getDashboardSummarySelloutBluettiData() {
  const [ventas, inventarios] = await Promise.all([
    getVentasSelloutBluetti(),
    getInventariosSelloutBluetti(),
  ]);
  return {
    ventas: Array.isArray(ventas) ? ventas : [],
    inventarios: Array.isArray(inventarios) ? inventarios : [],
  };
}
