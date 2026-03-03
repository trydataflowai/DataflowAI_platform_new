import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BLUETTI_MODULE_LINKS } from "../../../constants/moduleMenus";
import {
  getVentasSelloutBluetti,
  createVentaSelloutBluetti,
  updateVentaSelloutBluetti,
  deleteVentaSelloutBluetti,
  exportVentasSelloutBluetti,
  exportTemplateVentasSelloutBluetti,
  bulkImportVentasSelloutBluetti,
  bulkUpdateVentasSelloutBluettiExcel,
  bulkDeleteVentasSelloutBluetti,
  getCanalesBluetti,
  getCuentasClientesBluetti,
} from "../../../api/DashboardsCrudApis/Crudventasselloutbluetti";
import "../../../styles/CrudDashboard/CrudBluetti.css";

const INITIAL_STATE = {
  fecha_venta: "",
  canal: null,
  cliente: null,
  punto_venta: "",
  sku: "",
  ean: "",
  producto: "",
  cantidad: 0,
  precio_ventas: 0,
  total_ventas: 0,
};

const normalizeId = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "object") return value.id_registro ?? value.id ?? null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export default function Crudventasselloutbluetti() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [canales, setCanales] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [canalesMap, setCanalesMap] = useState({});
  const [clientesMap, setClientesMap] = useState({});
  const [clientesCanalMap, setClientesCanalMap] = useState({});
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);
  const fileUpdateRef = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadCatalogs = useCallback(async () => {
    try {
      const [canalesData, clientesData] = await Promise.all([
        getCanalesBluetti(),
        getCuentasClientesBluetti(),
      ]);
      const canalesList = Array.isArray(canalesData) ? canalesData : [];
      const clientesList = Array.isArray(clientesData) ? clientesData : [];
      setCanales(canalesList);
      setClientes(clientesList);

      const cMap = {};
      canalesList.forEach((c) => {
        const key = normalizeId(c.id_registro ?? c.id);
        if (!key) return;
        cMap[key] = c.nombre_canal ?? c.nombre ?? `Canal ${key}`;
      });
      setCanalesMap(cMap);

      const cliMap = {};
      const cliCanalMap = {};
      clientesList.forEach((c) => {
        const key = normalizeId(c.id_registro ?? c.id);
        if (!key) return;
        cliMap[key] = c.nombre_cliente ?? c.nombre ?? `Cliente ${key}`;
        cliCanalMap[key] = normalizeId(c.canal);
      });
      setClientesMap(cliMap);
      setClientesCanalMap(cliCanalMap);
    } catch (error) {
      console.error(error);
      showToast("Error cargando canales/clientes", "error");
    }
  }, [showToast]);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getVentasSelloutBluetti();
      const list = Array.isArray(data) ? data : [];
      setItems(
        list.map((row) => ({
          ...row,
          id: row.id ?? row.id_registro,
          canal: normalizeId(row.canal),
          cliente: normalizeId(row.cliente),
        }))
      );
    } catch (error) {
      console.error(error);
      showToast("Error cargando ventas sell out", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadCatalogs();
    cargar();
  }, [loadCatalogs, cargar]);

  useEffect(() => {
    const onOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const openModal = (row = null) => {
    if (!row) {
      setActive({ ...INITIAL_STATE });
      setModalOpen(true);
      return;
    }
    setActive({
      ...row,
      id: row.id ?? row.id_registro,
      canal: normalizeId(row.canal),
      cliente: normalizeId(row.cliente),
      cantidad: Number(row.cantidad ?? 0),
      precio_ventas: Number(row.precio_ventas ?? 0),
      total_ventas: Number(row.total_ventas ?? 0),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setActive(null);
  };

  const handleInput = (field, value) => {
    setActive((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [field]: value };
      if (field === "cliente") {
        const canal = clientesCanalMap[normalizeId(value)];
        if (canal) next.canal = canal;
      }
      if (field === "cantidad" || field === "precio_ventas") {
        const cantidad = Number(field === "cantidad" ? value : next.cantidad) || 0;
        const precio = Number(field === "precio_ventas" ? value : next.precio_ventas) || 0;
        next.total_ventas = Number((cantidad * precio).toFixed(2));
      }
      return next;
    });
  };

  const save = async () => {
    try {
      if (!active?.fecha_venta || !active?.canal || !active?.cliente) {
        showToast("Fecha, canal y cliente son obligatorios", "error");
        return;
      }
      if (!active?.punto_venta || !active?.sku || !active?.producto) {
        showToast("Punto de venta, sku y producto son obligatorios", "error");
        return;
      }
      const payload = {
        ...active,
        canal: Number(active.canal),
        cliente: Number(active.cliente),
        cantidad: Number(active.cantidad || 0),
        precio_ventas: Number(active.precio_ventas || 0),
        total_ventas: Number(active.total_ventas || 0),
      };
      setLoading(true);
      if (active.id) {
        await updateVentaSelloutBluetti(active.id, payload);
        showToast("Venta sell out actualizada");
      } else {
        await createVentaSelloutBluetti(payload);
        showToast("Venta sell out creada");
      }
      closeModal();
      await cargar();
    } catch (error) {
      console.error(error);
      showToast(error?.message || "Error guardando", "error");
    } finally {
      setLoading(false);
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm("Eliminar registro de venta sell out?")) return;
    try {
      setLoading(true);
      await deleteVentaSelloutBluetti(id);
      showToast("Venta sell out eliminada");
      await cargar();
    } catch (error) {
      console.error(error);
      showToast("Error eliminando", "error");
    } finally {
      setLoading(false);
    }
  };

  const filtered = items.filter((i) => Object.values(i).join(" ").toLowerCase().includes(busqueda.toLowerCase()));
  const toggleSelect = (id) => setSelectedIds((prev) => {
    const copy = new Set(prev);
    if (copy.has(id)) copy.delete(id);
    else copy.add(id);
    setSelectAll(false);
    return copy;
  });
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
      setSelectAll(false);
      return;
    }
    setSelectedIds(new Set(filtered.map((i) => i.id_registro || i.id)));
    setSelectAll(true);
  };

  const onImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const res = await bulkImportVentasSelloutBluetti(file);
      showToast(`Importados: ${res?.importados ?? "?"}`);
      await cargar();
    } catch (error) {
      showToast(error?.message || "Error importando", "error");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  const onUpdateExcel = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const res = await bulkUpdateVentasSelloutBluettiExcel(file);
      showToast(`Actualizados: ${res?.updated ?? "?"}`);
      await cargar();
    } catch (error) {
      showToast(error?.message || "Error actualizando", "error");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  const onBulkDelete = async () => {
    if (selectedIds.size === 0) return showToast("Selecciona registros", "error");
    if (!window.confirm(`Eliminar ${selectedIds.size} registros?`)) return;
    try {
      setLoading(true);
      await bulkDeleteVentasSelloutBluetti(Array.from(selectedIds));
      showToast("Registros eliminados");
      setSelectedIds(new Set());
      setSelectAll(false);
      await cargar();
    } catch (error) {
      showToast(error?.message || "Error eliminando", "error");
    } finally {
      setLoading(false);
    }
  };

  const onExport = async () => {
    const res = await exportVentasSelloutBluetti();
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ventas_sellout_bluetti_${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const onExportTemplate = async () => {
    const res = await exportTemplateVentasSelloutBluetti();
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_ventas_sellout_bluetti.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="CrudBluetti_container">
      <h2 className="CrudBluetti_title">Ventas Sell Out Bluetti</h2>
      <div className="CrudBluetti_nav_wrapper" ref={menuRef}>
        <button className="CrudBluetti_nav_btn" onClick={() => setMenuOpen((v) => !v)}>Menu de modulos</button>
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
        <button onClick={() => openModal()} className="CrudBluetti_btn btn-nuevo">Nuevo</button>
        <button onClick={onExportTemplate} className="CrudBluetti_btn">Plantilla para Importar nuevos Registros</button>
        <button onClick={() => fileInputRef.current?.click()} className="CrudBluetti_btn">Importar (masivo)</button>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={onImport} />
        <button onClick={() => fileUpdateRef.current?.click()} className="CrudBluetti_btn">Actualizar por Excel</button>
        <input ref={fileUpdateRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={onUpdateExcel} />
        <button onClick={onExport} className="CrudBluetti_btn btn-exportar">Exportar</button>
        <button onClick={onBulkDelete} className="CrudBluetti_btn btn-danger">Eliminar seleccionados</button>
      </div>

      {loading ? <div className="CrudBluetti_loading"><div className="CrudBluetti_spinner" /><p>Cargando...</p></div> : (
        <div className="CrudBluetti_table_wrapper">
          <table className="CrudBluetti_table">
            <thead>
              <tr>
                <th style={{ width: 40 }}><input type="checkbox" checked={selectAll} onChange={toggleSelectAll} /></th>
                <th>Fecha</th><th>Canal</th><th>Cliente</th><th>Punto de venta</th><th>SKU</th><th>EAN</th><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Total</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((row) => {
                const id = row.id_registro || row.id;
                return (
                  <tr key={id}>
                    <td><input type="checkbox" checked={selectedIds.has(id)} onChange={() => toggleSelect(id)} /></td>
                    <td>{row.fecha_venta || "-"}</td>
                    <td>{canalesMap[row.canal] || row.canal || "-"}</td>
                    <td>{clientesMap[row.cliente] || row.cliente || "-"}</td>
                    <td>{row.punto_venta || "-"}</td>
                    <td>{row.sku || "-"}</td>
                    <td>{row.ean || "-"}</td>
                    <td>{row.producto || "-"}</td>
                    <td>{row.cantidad ?? "-"}</td>
                    <td>{row.precio_ventas ?? "-"}</td>
                    <td>{row.total_ventas ?? "-"}</td>
                    <td><button onClick={() => openModal(row)}>Editar</button><button onClick={() => eliminar(row.id || id)}>Eliminar</button></td>
                  </tr>
                );
              }) : <tr><td colSpan="12"><div className="CrudBluetti_empty"><p>Sin registros</p></div></td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="CrudBluetti_modal" onClick={closeModal}>
          <div className="CrudBluetti_modal_content" onClick={(e) => e.stopPropagation()}>
            <div className="CrudBluetti_modal_header"><h3>{active?.id ? "Editar Venta Sell Out" : "Nueva Venta Sell Out"}</h3><button className="CrudBluetti_modal_close" onClick={closeModal}>X</button></div>
            <div className="CrudBluetti_form_group"><label className="CrudBluetti_form_label">Fecha venta</label><input type="date" value={active?.fecha_venta ? String(active.fecha_venta).split("T")[0] : ""} onChange={(e) => handleInput("fecha_venta", e.target.value)} /></div>
            <div className="CrudBluetti_form_group"><label className="CrudBluetti_form_label">Canal</label><select value={active?.canal ?? ""} onChange={(e) => handleInput("canal", e.target.value ? Number(e.target.value) : null)}><option value="">(Seleccionar canal)</option>{canales.map((c) => <option key={c.id_registro || c.id} value={c.id_registro || c.id}>{c.nombre_canal || c.nombre}</option>)}</select></div>
            <div className="CrudBluetti_form_group"><label className="CrudBluetti_form_label">Cliente</label><select value={active?.cliente ?? ""} onChange={(e) => handleInput("cliente", e.target.value ? Number(e.target.value) : null)}><option value="">(Seleccionar cliente)</option>{clientes.map((c) => <option key={c.id_registro || c.id} value={c.id_registro || c.id}>{c.nombre_cliente || c.nombre}</option>)}</select></div>
            <div className="CrudBluetti_form_group"><label className="CrudBluetti_form_label">Punto de ventas</label><input type="text" value={active?.punto_venta || ""} onChange={(e) => handleInput("punto_venta", e.target.value)} /></div>
            <div className="CrudBluetti_form_group"><label className="CrudBluetti_form_label">SKU</label><input type="text" value={active?.sku || ""} onChange={(e) => handleInput("sku", e.target.value)} /></div>
            <div className="CrudBluetti_form_group"><label className="CrudBluetti_form_label">EAN</label><input type="text" value={active?.ean || ""} onChange={(e) => handleInput("ean", e.target.value)} /></div>
            <div className="CrudBluetti_form_group"><label className="CrudBluetti_form_label">Producto</label><input type="text" value={active?.producto || ""} onChange={(e) => handleInput("producto", e.target.value)} /></div>
            <div className="CrudBluetti_form_group"><label className="CrudBluetti_form_label">Cantidad</label><input type="number" value={active?.cantidad || 0} onChange={(e) => handleInput("cantidad", Number(e.target.value))} /></div>
            <div className="CrudBluetti_form_group"><label className="CrudBluetti_form_label">Precio ventas</label><input type="number" step="0.01" value={active?.precio_ventas || 0} onChange={(e) => handleInput("precio_ventas", Number(e.target.value))} /></div>
            <div className="CrudBluetti_form_group"><label className="CrudBluetti_form_label">Total ventas</label><input type="number" step="0.01" value={active?.total_ventas || 0} onChange={(e) => handleInput("total_ventas", Number(e.target.value))} /></div>
            <div className="CrudBluetti_modal_actions"><button onClick={save}>Guardar</button><button onClick={closeModal}>Cancelar</button></div>
          </div>
        </div>
      )}
      {toast && <div className={`CrudBluetti_toast ${toast.type}`}><span>{toast.message}</span></div>}
    </div>
  );
}
