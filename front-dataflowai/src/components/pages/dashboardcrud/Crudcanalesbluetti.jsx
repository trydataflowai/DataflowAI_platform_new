import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BLUETTI_MODULE_LINKS } from "../../../constants/moduleMenus";
import {
  getCanalesBluetti,
  createCanalBluetti,
  updateCanalBluetti,
  deleteCanalBluetti,
  exportCanalesBluetti,
  exportTemplateCanalesBluetti,
  bulkImportCanalesBluetti,
  bulkUpdateCanalesBluettiExcel,
  bulkDeleteCanalesBluetti,
} from "../../../api/DashboardsCrudApis/Crudcanalesbluetti";

import "../../../styles/CrudDashboard/CrudBluetti.css";

const CANAL_INICIAL = { codigo_canal: "", nombre_canal: "" };

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`CrudBluetti_toast ${type}`}>
      <span style={{ fontSize: 20 }}>{type === "success" ? "✓" : "⚠"}</span>
      <span>{message}</span>
    </div>
  );
};

const Loading = ({ text = "Cargando..." }) => (
  <div className="CrudBluetti_loading">
    <div className="CrudBluetti_spinner" />
    <p style={{ color: "var(--text-secondary)" }}>{text}</p>
  </div>
);

const EmptyState = ({ title = "No hay registros" }) => (
  <div className="CrudBluetti_empty">
    <p>{title}</p>
  </div>
);

export default function Crudcanalesbluetti() {
  const [items, setItems] = useState([]);
  const [busqueda, setBusqueda] = useState("");
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

  const navigate = useNavigate();

  useEffect(() => { cargar(); }, [rowsPerPage]);

  const cargar = async () => {
    try {
      setLoading(true);
      const data = await getCanalesBluetti();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      showToast("Error cargando canales", "error");
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

  const openModal = useCallback((item = null) => { setActive(item ? { ...item } : { ...CANAL_INICIAL }); setModalOpen(true); }, []);
  const closeModal = () => { setActive(null); setModalOpen(false); };

  const save = async () => {
    try {
      if (!active?.nombre_canal) { showToast("Completa nombre del canal", "error"); return; }
      setLoading(true);
      if (active.id) { await updateCanalBluetti(active.id, active); showToast("Canal actualizado", "success"); }
      else { await createCanalBluetti(active); showToast("Canal creado", "success"); }
      closeModal(); await cargar();
    } catch (err) { console.error(err); showToast("Error guardando canal", "error"); } finally { setLoading(false); }
  };

  const eliminar = async (id, nombre) => {
    if (!window.confirm(`Eliminar ${nombre}?`)) return;
    try { setLoading(true); await deleteCanalBluetti(id); showToast("Canal eliminado", "success"); await cargar(); }
    catch (err) { console.error(err); showToast("Error eliminando", "error"); } finally { setLoading(false); }
  };

  const filtered = items.filter((p) => Object.values(p).join(" ").toLowerCase().includes(busqueda.toLowerCase()));
  const sortIndicator = (key) => (sortConfig.key !== key ? "?" : sortConfig.direction === "asc" ? "?" : "?");
  const compareValues = (a, b) => {
    if (typeof a === "number" && typeof b === "number") return a - b;
    const aNum = Number(a);
    const bNum = Number(b);
    const bothNumeric = a !== "" && b !== "" && !Number.isNaN(aNum) && !Number.isNaN(bNum);
    if (bothNumeric) return aNum - bNum;
    return String(a).localeCompare(String(b), "es", { numeric: true, sensitivity: "base" });
  };
  const sorted = [...filtered].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const av = a?.[sortConfig.key] ?? "";
    const bv = b?.[sortConfig.key] ?? "";
    const base = compareValues(av, bv);
    return sortConfig.direction === "asc" ? base : -base;
  });
  const totalRows = sorted.length; const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage; const paged = sorted.slice(startIndex, startIndex + rowsPerPage);

  const exportar = async () => {
    try {
      const res = await exportCanalesBluetti();
      const blob = await res.blob(); const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `canales_bluetti_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
      showToast("Exportado correctamente", "success");
    } catch (err) { console.error(err); showToast("Error exportando", "error"); }
  };

  const exportarPlantilla = async () => {
    try {
      const res = await exportTemplateCanalesBluetti();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "plantilla_canales_bluetti.xlsx";
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
    try { setLoading(true); const res = await bulkUpdateCanalesBluettiExcel(file); showToast(`Actualizados: ${res.updated || "?"}`, "success"); await cargar(); }
    catch (err) { console.error(err); showToast("Error actualizando desde Excel", "error"); } finally { setLoading(false); e.target.value = ""; }
  };

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      setLoading(true);
      const res = await bulkImportCanalesBluetti(file);
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
    if (!window.confirm(`Eliminar ${selectedIds.size} canales?`)) return;
    try { setLoading(true); await bulkDeleteCanalesBluetti(Array.from(selectedIds)); showToast("Eliminados", "success"); setSelectedIds(new Set()); setSelectAll(false); await cargar(); }
    catch (err) { console.error(err); showToast("Error eliminando", "error"); } finally { setLoading(false); }
  };

  const toggleSelect = (id) => setSelectedIds((prev) => { const c = new Set(prev); if (c.has(id)) c.delete(id); else c.add(id); setSelectAll(false); return c; });
  const toggleSelectAll = () => {
    if (selectAll) { setSelectedIds(new Set()); setSelectAll(false); } else { const allIds = sorted.map((p) => p.id_registro || p.id); setSelectedIds(new Set(allIds)); setSelectAll(true); }
  };
  const toggleSort = (key) => {
    setCurrentPage(1);
    setSortConfig((prev) => (prev.key === key ? { key, direction: prev.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" }));
  };

  const handleInput = (field, value) => setActive((p) => ({ ...p, [field]: value }));

  return (
    <div className="CrudBluetti_container">
      <h2 className="CrudBluetti_title">Canales Bluetti</h2>

      <div className="CrudBluetti_nav_wrapper" ref={menuRef}>
        <button className="CrudBluetti_nav_btn" onClick={() => setMenuOpen((p)=>!p)}>Menu de modulos</button>
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
        <input className="CrudBluetti_search" placeholder="Buscar..." value={busqueda} onChange={(e)=>setBusqueda(e.target.value)} />
        <button onClick={()=>openModal()} className="CrudBluetti_btn btn-nuevo">Nuevo</button>
        <button onClick={exportarPlantilla} className="CrudBluetti_btn">Plantilla para Importar nuevos Registros</button>
        <button onClick={()=>fileInputRef.current?.click()} className="CrudBluetti_btn">Importar (masivo)</button>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={handleFileImport} />
        <button onClick={()=>fileUpdateRef.current.click()} className="CrudBluetti_btn">Actualizar por Excel</button>
        <input ref={fileUpdateRef} type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={handleFileUpdate} />
        <button onClick={exportar} className="CrudBluetti_btn btn-exportar">Exportar</button>
        <button onClick={handleBulkDelete} className="CrudBluetti_btn btn-danger">Eliminar seleccionados</button>
      </div>

      {loading ? <Loading text="Cargando canales..." /> : (
        <div className="CrudBluetti_table_wrapper">
          <table className="CrudBluetti_table">
            <thead>
              <tr>
                <th style={{width:40}}><input type="checkbox" checked={selectAll} onChange={toggleSelectAll} /></th>
                <th><button type="button" className="CrudBluetti_th_btn" onClick={() => toggleSort("codigo_canal")}>Codigo <span>{sortIndicator("codigo_canal")}</span></button></th>
                <th><button type="button" className="CrudBluetti_th_btn" onClick={() => toggleSort("nombre_canal")}>Nombre <span>{sortIndicator("nombre_canal")}</span></button></th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length>0 ? paged.map((p)=>(
                <tr key={p.id_registro||p.id}>
                  <td><input type="checkbox" checked={selectedIds.has(p.id_registro||p.id)} onChange={()=>toggleSelect(p.id_registro||p.id)} /></td>
                  <td>{p.codigo_canal||"-"}</td>
                  <td><strong>{p.nombre_canal||"-"}</strong></td>
                  <td>
                    <button onClick={()=>openModal(p)}>Editar</button>
                    <button onClick={()=>eliminar(p.id, p.nombre_canal)}>Eliminar</button>
                  </td>
                </tr>
              )) : <tr><td colSpan="4"><EmptyState title="No se encontraron canales" /></td></tr>}
            </tbody>
          </table>

          <div className="CrudBluetti_pagination">
            <div>
              <span>Mostrar </span>
              <select value={rowsPerPage} onChange={(e)=>setRowsPerPage(Number(e.target.value))}>
                {[10,25,50,80,100].map(n=><option key={n} value={n}>{n}</option>)}
              </select>
              <span> registros</span>
            </div>

            <div className="CrudBluetti_pagination_controls">
              <button onClick={()=>setCurrentPage(p=>Math.max(p-1,1))} disabled={currentPage===1}>Anterior</button>
              <span>Página {currentPage} de {totalPages}</span>
              <button onClick={()=>setCurrentPage(p=>Math.min(p+1,totalPages))} disabled={currentPage===totalPages}>Siguiente</button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="CrudBluetti_modal" onClick={closeModal}>
          <div className="CrudBluetti_modal_content" onClick={(e)=>e.stopPropagation()}>
            <div className="CrudBluetti_modal_header">
              <h3>{active?.id ? "Editar Canal" : "Nuevo Canal"}</h3>
              <button className="CrudBluetti_modal_close" onClick={closeModal}>✕</button>
            </div>

            <div className="CrudBluetti_form_group">
              <label className="CrudBluetti_form_label">Código</label>
              <input type="text" placeholder="Código canal" value={active?.codigo_canal||""} onChange={(e)=>handleInput("codigo_canal", e.target.value)} />
            </div>

            <div className="CrudBluetti_form_group">
              <label className="CrudBluetti_form_label">Nombre <span style={{color:"var(--accent-red)"}}>*</span></label>
              <input type="text" placeholder="Nombre canal" value={active?.nombre_canal||""} onChange={(e)=>handleInput("nombre_canal", e.target.value)} />
            </div>

            <div className="CrudBluetti_modal_actions">
              <button onClick={save}>Guardar</button><button onClick={closeModal}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}




