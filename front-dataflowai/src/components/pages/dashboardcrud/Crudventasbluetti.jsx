import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BLUETTI_MODULE_LINKS } from "../../../constants/moduleMenus";
import {
  getVentasBluetti,
  createVentaBluetti,
  updateVentaBluetti,
  deleteVentaBluetti,
  exportVentasBluetti,
  exportTemplateVentasBluetti,
  bulkImportVentasBluetti,
  bulkUpdateVentasBluettiExcel,
  bulkDeleteVentasBluetti,
  // función nueva (recuerda haberla añadido al archivo .js)
  getCuentasClientesBluetti,
  getCanalesBluetti,
} from "../../../api/DashboardsCrudApis/Crudventasbluetti";
import { getProductosBluetti } from "../../../api/DashboardsCrudApis/Crudproductosbluetti";

import "../../../styles/CrudDashboard/CrudBluetti.css";

const VENTA_INICIAL = {
  fecha_venta: "",
  cantidad: 0,
  precio_unitario: 0,
  total_venta: 0,
  costo_unitario: 0,
  costo_total: 0,
  tipo_venta: "sell_in",
  canal: null,
  cliente: null, // almacenará el id (id_registro/id)
  sku: "",
  producto: "",
};

export default function Crudventasbluetti() {
  const [items, setItems] = useState([]);
  const [clientes, setClientes] = useState([]); // lista de clientes obtenida del endpoint
  const [clientesMap, setClientesMap] = useState({}); // id -> nombre_cliente
  const [clientesCanalMap, setClientesCanalMap] = useState({});
  const [busqueda, setBusqueda] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const fileInputRef = useRef(null);
  const fileUpdateRef = useRef(null);
  const menuRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [canales, setCanales] = useState([]);
  const [canalesMap, setCanalesMap] = useState({});
  const [productos, setProductos] = useState([]);
  const [productosMap, setProductosMap] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    const loadCatalogos = async () => {
      try {
        const [clientesData, canalesData, productosData] = await Promise.all([
          getCuentasClientesBluetti(),
          getCanalesBluetti(),
          getProductosBluetti(),
        ]);

        const clientesList = Array.isArray(clientesData) ? clientesData : [];
        setClientes(clientesList);

        const clienteMap = {};
        const clienteCanal = {};
        clientesList.forEach((c) => {
          const key = c.id_registro ?? c.id;
          clienteMap[key] = c.nombre_cliente ?? c.nombre;

          let canalVal = null;
          if (c.canal !== undefined && c.canal !== null) {
            if (typeof c.canal === "object") {
              canalVal = c.canal.id_registro ?? c.canal.id ?? null;
            } else {
              canalVal = Number(c.canal) || null;
            }
          }
          clienteCanal[key] = canalVal;
        });
        setClientesMap(clienteMap);
        setClientesCanalMap(clienteCanal);

        const canalesList = Array.isArray(canalesData) ? canalesData : [];
        setCanales(canalesList);
        const canalMap = {};
        canalesList.forEach((c) => {
          const key = c.id_registro ?? c.id;
          canalMap[key] = c.nombre_canal ?? c.nombre ?? key;
        });
        setCanalesMap(canalMap);

        const productosList = Array.isArray(productosData) ? productosData : [];
        setProductos(productosList);
        const productosLookup = {};
        productosList.forEach((p) => {
          const nombre = (p.nombre_producto ?? "").trim();
          const sku = (p.sku ?? "").trim();
          if (!nombre && !sku) return;
          const payload = { producto: nombre, sku };
          if (nombre) productosLookup[nombre.toLowerCase()] = payload;
          if (sku) productosLookup[sku.toLowerCase()] = payload;
        });
        setProductosMap(productosLookup);
      } catch (err) {
        console.error("Error cargando catalogos Bluetti:", err);
      }
    };

    loadCatalogos();
  }, []);


  // Cargar ventas (se ejecuta cuando rowsPerPage cambia o cuando quieras recargar)
  useEffect(() => { cargar(); }, [rowsPerPage]);

  // Si clientesMap cambia, enriquecemos items para mostrar nombre del cliente en tabla
  useEffect(() => {
    if (!items || items.length === 0) return;
    // solo añade/actualiza cliente_nombre si falta o si cambió
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        cliente_nombre: clientesMap[it.cliente] ?? it.cliente_nombre ?? it.cliente,
      }))
    );
  }, [clientesMap]); // eslint-disable-line

  const cargar = async () => {
    try {
      setLoading(true);
      const data = await getVentasBluetti();
      const lista = Array.isArray(data) ? data : [];
      // normalizamos números y tratamos de resolver cliente_nombre si ya tenemos mapa
      const normal = lista.map((item) => ({
        ...item,
        cantidad: Number(item.cantidad) || 0,
        precio_unitario: item.precio_unitario !== null && item.precio_unitario !== undefined ? Number(item.precio_unitario) : null,
        total_venta: item.total_venta !== null && item.total_venta !== undefined ? Number(item.total_venta) : null,
        costo_unitario: item.costo_unitario !== null && item.costo_unitario !== undefined ? Number(item.costo_unitario) : null,
        costo_total: item.costo_total !== null && item.costo_total !== undefined ? Number(item.costo_total) : null,
        producto: item.producto || "",
        sku: item.sku || "",
        cliente_nombre: clientesMap[item.cliente] ?? item.cliente_nombre ?? item.cliente,
      }));
      setItems(normal);
    } catch (err) {
      console.error(err);
      showToast("Error cargando ventas", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const onOutside = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  const openModal = useCallback((item = null) => {
  if (!item) { setActive({ ...VENTA_INICIAL }); setModalOpen(true); return; }
  const clienteId = (item.cliente && typeof item.cliente === "object") ? (item.cliente.id_registro ?? item.cliente.id) : item.cliente;
  const canalId = (item.canal && typeof item.canal === "object") ? (item.canal.id_registro ?? item.canal.id) : item.canal;
  const normalized = {
    ...item,
    cantidad: Number(item.cantidad) || 0,
    precio_unitario: Number(item.precio_unitario) || 0,
    total_venta: Number(item.total_venta) || 0,
    costo_unitario: Number(item.costo_unitario) || 0,
    costo_total: Number(item.costo_total) || 0,
    cliente: clienteId ?? null,
    canal: canalId ?? null,
    producto: item.producto || "",
    sku: item.sku || "",
  };
  setActive(normalized);
  setModalOpen(true);
}, []);

  const closeModal = () => { setActive(null); setModalOpen(false); };

  const save = async () => {
  try {
    // Validaciones antes de enviar
    if (!active?.fecha_venta) { showToast("La fecha de venta es requerida", "error"); return; }
    if (!(Number(active?.cantidad) > 0)) { showToast("La cantidad debe ser mayor a 0", "error"); return; }
    if (!active?.canal) { showToast("Selecciona un canal", "error"); return; } // evita canal null
    if (!String(active?.producto || "").trim() && !String(active?.sku || "").trim()) {
      showToast("Selecciona un producto Bluetti", "error");
      return;
    }

    setLoading(true);

    // Normalizar fecha a yyyy-mm-dd si es Date
    if (active.fecha_venta instanceof Date) active.fecha_venta = active.fecha_venta.toISOString().split("T")[0];

    // Recalcular ano/mes por seguridad si faltan
    if (!active.ano || !active.mes) {
      try {
        const dstr = (typeof active.fecha_venta === "string") ? active.fecha_venta.split("T")[0] : null;
        if (dstr) {
          const [y,m] = dstr.split("-");
          active.ano = Number(y);
          active.mes = Number(m);
        }
      } catch (e) { /* ignore */ }
    }

    // recalcular totales por seguridad
    const cantidad = Number(active.cantidad) || 0;
    const precio_unitario = Number(active.precio_unitario) || 0;
    const costo_unitario = Number(active.costo_unitario) || 0;
    const total_venta_calc = Number((cantidad * precio_unitario).toFixed(2));
    const costo_total_calc = Number((cantidad * costo_unitario).toFixed(2));
    const productoKey = String(active.producto || "").trim().toLowerCase();
    const skuKey = String(active.sku || "").trim().toLowerCase();
    const productoResolvido = productosMap[productoKey] || productosMap[skuKey] || null;
    const producto = productoResolvido?.producto || String(active.producto || "").trim();
    const sku = productoResolvido?.sku || String(active.sku || "").trim();
    if (!producto || !sku) {
      showToast("El producto seleccionado debe tener nombre y SKU", "error");
      return;
    }

    const payload = {
      ...active,
      cantidad: cantidad,
      precio_unitario: precio_unitario.toFixed(2),
      total_venta: total_venta_calc.toFixed(2),
      costo_unitario: costo_unitario.toFixed(2),
      costo_total: costo_total_calc.toFixed(2),
      canal: Number(active.canal),     // enviar id numérico
      cliente: active.cliente ? Number(active.cliente) : null,
      ano: Number(active.ano),
      mes: Number(active.mes),
      producto,
      sku,
    };

    console.log("Payload POST /VentasBluetti/ :", payload);

    if (active.id) {
      await updateVentaBluetti(active.id, payload);
      showToast("Venta actualizada", "success");
    } else {
      await createVentaBluetti(payload);
      showToast("Venta creada", "success");
    }

    closeModal();
    await cargar();
  } catch (err) {
    console.error("Error en save():", err);
    showToast(String(err.message || err), "error");
  } finally {
    setLoading(false);
  }
};


  const eliminar = async (id) => {
    if (!window.confirm(`Eliminar registro de venta?`)) return;
    try { setLoading(true); await deleteVentaBluetti(id); showToast("Venta eliminada", "success"); await cargar(); }
    catch (err) { console.error(err); showToast("Error eliminando", "error"); } finally { setLoading(false); }
  };

  const normalizeDate = (value) => {
    if (!value) return "";
    return String(value).split("T")[0];
  };

  const filtered = items.filter((p) => {
    const matchesBusqueda = Object.values(p).join(" ").toLowerCase().includes(busqueda.toLowerCase());
    const fecha = normalizeDate(p.fecha_venta);
    const matchesDesde = !fechaDesde || (fecha && fecha >= fechaDesde);
    const matchesHasta = !fechaHasta || (fecha && fecha <= fechaHasta);
    return matchesBusqueda && matchesDesde && matchesHasta;
  });
  const sortIndicator = (key) => (sortConfig.key !== key ? "?" : sortConfig.direction === "asc" ? "?" : "?");
  const compareValues = (a, b) => {
    if (typeof a === "number" && typeof b === "number") return a - b;
    const aNum = Number(a);
    const bNum = Number(b);
    const bothNumeric = a !== "" && b !== "" && !Number.isNaN(aNum) && !Number.isNaN(bNum);
    if (bothNumeric) return aNum - bNum;
    return String(a).localeCompare(String(b), "es", { numeric: true, sensitivity: "base" });
  };
  const getSortValue = (p, key) => {
    if (key === "fecha_venta") return normalizeDate(p.fecha_venta);
    if (key === "cliente") return p.cliente_nombre ?? (clientesMap[p.cliente] ?? (typeof p.cliente === "object" ? p.cliente.nombre_cliente : p.cliente ?? ""));
    return p?.[key] ?? "";
  };
  const sorted = [...filtered].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const av = getSortValue(a, sortConfig.key);
    const bv = getSortValue(b, sortConfig.key);
    const base = compareValues(av, bv);
    return sortConfig.direction === "asc" ? base : -base;
  });
  const totalRows = sorted.length; const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const paged = sorted.slice((currentPage - 1) * rowsPerPage, (currentPage - 1) * rowsPerPage + rowsPerPage);

  // file / bulk helpers (sin cambios relevantes)
  const exportar = async () => {
    try { const res = await exportVentasBluetti(); const blob = await res.blob(); const url = window.URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `ventas_bluetti_${new Date().toISOString().split("T")[0]}.xlsx`; document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url); showToast("Exportado correctamente", "success"); }
    catch (err) { console.error(err); showToast("Error exportando", "error"); }
  };

  const exportarPlantilla = async () => {
    try {
      const res = await exportTemplateVentasBluetti();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "plantilla_ventas_bluetti.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("Plantilla exportada", "success");
    } catch (err) {
      console.error(err);
      showToast("Error exportando plantilla", "error");
    }
  };

  const handleFileUpdate = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try { setLoading(true); const res = await bulkUpdateVentasBluettiExcel(file); showToast(`Actualizados: ${res.updated || "?"}`, "success"); await cargar(); } catch (err) { console.error(err); showToast("Error actualizando desde Excel", "error"); } finally { setLoading(false); e.target.value = ""; }
  };

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      setLoading(true);
      const res = await bulkImportVentasBluetti(file);
      const total = res?.created ?? res?.importados ?? res?.inserted ?? res?.count ?? "?";
      showToast(`Importados: ${total}`, "success");
      await cargar();
    } catch (err) {
      console.error(err);
      showToast(err?.message || "Error en importacion masiva", "error");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) { showToast("Selecciona registros", "error"); return; }
    if (!window.confirm(`Eliminar ${selectedIds.size} ventas?`)) return;
    try { setLoading(true); await bulkDeleteVentasBluetti(Array.from(selectedIds)); showToast("Eliminados", "success"); setSelectedIds(new Set()); setSelectAll(false); await cargar(); } catch (err) { console.error(err); showToast("Error eliminando", "error"); } finally { setLoading(false); }
  };

  const toggleSelect = (id) => setSelectedIds((prev) => { const c = new Set(prev); if (c.has(id)) c.delete(id); else c.add(id); setSelectAll(false); return c; });
  const toggleSelectAll = () => {
    if (selectAll) { setSelectedIds(new Set()); setSelectAll(false); } else { const allIds = sorted.map((p) => p.id_registro || p.id); setSelectedIds(new Set(allIds)); setSelectAll(true); }
  };
  const toggleSort = (key) => {
    setCurrentPage(1);
    setSortConfig((prev) => (prev.key === key ? { key, direction: prev.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" }));
  };

  const handleInput = (field, value) => setActive((p) => {
  const next = { ...p, [field]: value };

  if (field === "producto" || field === "sku") {
    const key = String(value || "").trim().toLowerCase();
    const info = productosMap[key];
    if (info) {
      next.producto = info.producto || "";
      next.sku = info.sku || "";
    } else if (field === "producto") {
      next.producto = String(value || "").trim();
      next.sku = "";
    } else {
      next.sku = String(value || "").trim();
      next.producto = "";
    }
  }

  // si cambiaron cantidad/precios -> recalcular totales
  const cantidad = Number(next.cantidad) || 0;
  const precio_unitario = Number(next.precio_unitario) || 0;
  const costo_unitario = Number(next.costo_unitario) || 0;
  next.total_venta = Number((cantidad * precio_unitario).toFixed(2));
  next.costo_total = Number((cantidad * costo_unitario).toFixed(2));

  // si cambiaron fecha_venta -> extraer ano y mes (formato yyyy-mm-dd esperado)
  if (field === "fecha_venta" && next.fecha_venta) {
    try {
      // soporta "yyyy-mm-dd" y Date objects
      let d = next.fecha_venta;
      if (typeof d === "string") {
        // eliminar tiempo si vino con T...
        d = d.split("T")[0];
        const parts = d.split("-");
        if (parts.length >= 3) {
          next.ano = Number(parts[0]) || null;
          next.mes = Number(parts[1]) || null;
        } else {
          next.ano = null;
          next.mes = null;
        }
      } else if (d instanceof Date) {
        next.ano = d.getFullYear();
        next.mes = d.getMonth() + 1;
      } else {
        next.ano = null;
        next.mes = null;
      }
    } catch (e) {
      next.ano = null;
      next.mes = null;
    }
  }

  return next;
});

  return (
    <div className="CrudBluetti_container">
      <h2 className="CrudBluetti_title">Ventas Bluetti</h2>

      <div className="CrudBluetti_nav_wrapper" ref={menuRef}>
        <button className="CrudBluetti_nav_btn" onClick={() => setMenuOpen(p => !p)}>Menu de modulos</button>
        {menuOpen && (
          <div className="CrudBluetti_nav_menu">
            {BLUETTI_MODULE_LINKS.map((link) => (
              <button key={link.path} onClick={() => navigate(link.path)}>
                {link.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="CrudBluetti_actions">
        <input className="CrudBluetti_search" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="CrudBluetti_search" title="Desde" />
        <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="CrudBluetti_search" title="Hasta" />
        <button onClick={() => openModal()} className="CrudBluetti_btn btn-nuevo">Nuevo</button>
        <button onClick={exportarPlantilla} className="CrudBluetti_btn">Plantilla para Importar nuevos Registros</button>
        <button onClick={() => fileInputRef.current?.click()} className="CrudBluetti_btn">Importar (masivo)</button>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={handleFileImport} />
        <button onClick={() => fileUpdateRef.current.click()} className="CrudBluetti_btn">Actualizar por Excel</button>
        <input ref={fileUpdateRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={handleFileUpdate} />
        <button onClick={exportar} className="CrudBluetti_btn btn-exportar">Exportar</button>
        <button onClick={handleBulkDelete} className="CrudBluetti_btn btn-danger">Eliminar seleccionados</button>
      </div>

      {loading ? <div className="CrudBluetti_loading"><div className="CrudBluetti_spinner" /><p style={{ color: "var(--text-secondary)" }}>Cargando ventas...</p></div> : (
        <div className="CrudBluetti_table_wrapper">
          <table className="CrudBluetti_table">
            <thead>
              <tr>
                <th style={{ width: 40 }}><input type="checkbox" checked={selectAll} onChange={toggleSelectAll} /></th>
                <th><button type="button" className="CrudBluetti_th_btn" onClick={() => toggleSort("fecha_venta")}>Fecha <span>{sortIndicator("fecha_venta")}</span></button></th>
                <th><button type="button" className="CrudBluetti_th_btn" onClick={() => toggleSort("tipo_venta")}>Tipo <span>{sortIndicator("tipo_venta")}</span></button></th>
                <th><button type="button" className="CrudBluetti_th_btn" onClick={() => toggleSort("cliente")}>Cliente <span>{sortIndicator("cliente")}</span></button></th>
                <th><button type="button" className="CrudBluetti_th_btn" onClick={() => toggleSort("producto")}>Producto <span>{sortIndicator("producto")}</span></button></th>
                <th><button type="button" className="CrudBluetti_th_btn" onClick={() => toggleSort("sku")}>SKU <span>{sortIndicator("sku")}</span></button></th>
                <th><button type="button" className="CrudBluetti_th_btn" onClick={() => toggleSort("cantidad")}>Cantidad <span>{sortIndicator("cantidad")}</span></button></th>
                <th><button type="button" className="CrudBluetti_th_btn" onClick={() => toggleSort("precio_unitario")}>Precio Unit. <span>{sortIndicator("precio_unitario")}</span></button></th>
                <th><button type="button" className="CrudBluetti_th_btn" onClick={() => toggleSort("total_venta")}>Total Venta <span>{sortIndicator("total_venta")}</span></button></th>
                <th><button type="button" className="CrudBluetti_th_btn" onClick={() => toggleSort("costo_unitario")}>Costo Unit. <span>{sortIndicator("costo_unitario")}</span></button></th>
                <th><button type="button" className="CrudBluetti_th_btn" onClick={() => toggleSort("costo_total")}>Costo Total <span>{sortIndicator("costo_total")}</span></button></th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length > 0 ? paged.map((p) => (
                <tr key={p.id_registro || p.id}>
                  <td><input type="checkbox" checked={selectedIds.has(p.id_registro || p.id)} onChange={() => toggleSelect(p.id_registro || p.id)} /></td>
                  <td>{p.fecha_venta || "-"}</td>
                  <td>{p.tipo_venta || "-"}</td>
                  <td>{p.cliente_nombre ?? (clientesMap[p.cliente] ?? (typeof p.cliente === "object" ? p.cliente.nombre_cliente : p.cliente))}</td>
                  <td>{p.producto || "-"}</td>
                  <td>{p.sku || "-"}</td>
                  <td>{(p.cantidad !== null && p.cantidad !== undefined) ? p.cantidad : "-"}</td>
                  <td>{(p.precio_unitario !== null && p.precio_unitario !== undefined) ? Number(p.precio_unitario).toFixed(2) : "-"}</td>
                  <td>{(p.total_venta !== null && p.total_venta !== undefined) ? Number(p.total_venta).toFixed(2) : "-"}</td>
                  <td>{(p.costo_unitario !== null && p.costo_unitario !== undefined) ? Number(p.costo_unitario).toFixed(2) : "-"}</td>
                  <td>{(p.costo_total !== null && p.costo_total !== undefined) ? Number(p.costo_total).toFixed(2) : "-"}</td>
                  <td>
                    <button onClick={() => openModal(p)}>Editar</button>
                    <button onClick={() => eliminar(p.id)}>Eliminar</button>
                  </td>
                </tr>
              )) : <tr><td colSpan="12"><div className="CrudBluetti_empty"><p>No se encontraron ventas</p></div></td></tr>}
            </tbody>
          </table>

          <div className="CrudBluetti_pagination">
            <div>
              <span>Mostrar </span><select value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}>{[10,25,50,80,100].map(n => <option key={n} value={n}>{n}</option>)}</select><span> registros</span>
            </div>

            <div className="CrudBluetti_pagination_controls">
              <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Anterior</button>
              <span>Página {currentPage} de {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Siguiente</button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="CrudBluetti_modal" onClick={closeModal}>
          <div className="CrudBluetti_modal_content" onClick={(e) => e.stopPropagation()}>
            <div className="CrudBluetti_modal_header"><h3>{active?.id ? "Editar Venta" : "Nueva Venta"}</h3><button className="CrudBluetti_modal_close" onClick={closeModal}>✕</button></div>

            <div className="CrudBluetti_form_group">
              <label className="CrudBluetti_form_label">Fecha</label>
              <input type="date" value={active?.fecha_venta ? active.fecha_venta.split("T")[0] : ""} onChange={(e) => handleInput("fecha_venta", e.target.value)} />
            </div>

            <div className="CrudBluetti_form_group">
              <label className="CrudBluetti_form_label">Tipo</label>
              <select value={active?.tipo_venta || "sell_in"} onChange={(e) => handleInput("tipo_venta", e.target.value)}>
                <option value="sell_in">Sell In</option>
                <option value="sell_out">Sell Out</option>
              </select>
            </div>

            {/* ---- NUEVO: selector de Cliente por nombre ---- */}
            <div className="CrudBluetti_form_group">
  <label className="CrudBluetti_form_label">Cliente</label>
  <select
    value={active?.cliente ?? ""}
    onChange={(e) => {
      const val = e.target.value ? Number(e.target.value) : null;
      // actualizar cliente
      handleInput("cliente", val);
      // buscar canal por defecto desde el mapa y actualizarlo también
      const canalPorDefecto = val ? (clientesCanalMap[val] ?? null) : null;
      // solo tocar canal si hay un valor definido (y si el usuario no ha override manual)
      handleInput("canal", canalPorDefecto);
    }}
  >
    <option value="">(Seleccionar cliente)</option>
    {clientes.map((c) => {
      const key = c.id_registro ?? c.id;
      return (<option key={key} value={key}>{c.nombre_cliente ?? c.nombre}</option>);
    })}
  </select>
</div>

            <div className="CrudBluetti_form_group">
              <label className="CrudBluetti_form_label">Producto Bluetti</label>
              <select
                value={active?.producto || ""}
                onChange={(e) => handleInput("producto", e.target.value)}
              >
                <option value="">(Seleccionar producto)</option>
                {productos.map((p) => {
                  const nombre = p.nombre_producto ?? "";
                  const sku = p.sku ?? "";
                  const key = p.id_registro ?? p.id ?? `${nombre}-${sku}`;
                  return (
                    <option key={key} value={nombre}>
                      {nombre}{sku ? ` (${sku})` : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="CrudBluetti_form_group">
              <label className="CrudBluetti_form_label">SKU</label>
              <input type="text" value={active?.sku || ""} readOnly />
            </div>

            <div className="CrudBluetti_form_group">
  <label className="CrudBluetti_form_label">Cantidad</label>
  <input type="number" min="0" step="1" value={active?.cantidad||0} onChange={(e)=>handleInput("cantidad", Number(e.target.value))} />
</div>

<div className="CrudBluetti_form_group">
  <label className="CrudBluetti_form_label">Precio unitario</label>
  <input type="number" min="0" step="0.01" value={active?.precio_unitario||0} onChange={(e)=>handleInput("precio_unitario", Number(e.target.value))} />
</div>

{/* COSTO UNITARIO (editable) */}
<div className="CrudBluetti_form_group">
  <label className="CrudBluetti_form_label">Costo unitario</label>
  <input type="number" min="0" step="0.01" value={active?.costo_unitario||0} onChange={(e)=>handleInput("costo_unitario", Number(e.target.value))} />
</div>

{/* TOTALS — SOLO LECTURA (NO INPUT editable) */}
<div className="CrudBluetti_form_group">
  <label className="CrudBluetti_form_label">Total venta</label>
  <div style={{ padding: "8px 12px", background: "var(--bg-muted)", borderRadius: 4 }}>
    { (active && active.total_venta !== null && active.total_venta !== undefined) ? Number(active.total_venta).toFixed(2) : "0.00" }
  </div>
</div>

<div className="CrudBluetti_form_group">
  <label className="CrudBluetti_form_label">Costo total</label>
  <div style={{ padding: "8px 12px", background: "var(--bg-muted)", borderRadius: 4 }}>
    { (active && active.costo_total !== null && active.costo_total !== undefined) ? Number(active.costo_total).toFixed(2) : "0.00" }
  </div>
</div>

            <div className="CrudBluetti_modal_actions"><button onClick={save}>Guardar</button><button onClick={closeModal}>Cancelar</button></div>
          </div>
        </div>
      )}

      {toast && <div className={`CrudBluetti_toast ${toast.type}`}><span style={{fontSize:20}}>{toast.type==="success"?"✓":"⚠"}</span><span>{toast.message}</span></div>}
    </div>
  );
}




