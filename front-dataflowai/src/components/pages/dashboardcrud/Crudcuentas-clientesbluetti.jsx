import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BLUETTI_MODULE_LINKS } from "../../../constants/moduleMenus";
import {
  getCuentasClientesBluetti,
  createCuentaClienteBluetti,
  updateCuentaClienteBluetti,
  deleteCuentaClienteBluetti,
  exportCuentasClientesBluetti,
  exportTemplateCuentasClientesBluetti,
  bulkImportCuentasClientesBluetti,
  bulkUpdateCuentasClientesBluettiExcel,
  bulkDeleteCuentasClientesBluetti,
  getCanalesBluetti, // <- importamos la nueva función
} from "../../../api/DashboardsCrudApis/Crudcuentas-clientesbluetti";
import { COUNTRY_OPTIONS } from "../../../utils/countryOptions";

import "../../../styles/CrudDashboard/CrudBluetti.css";

const CUENTA_INICIAL = {
  canal: null,
  nombre_cliente: "",
  pais: "",
  region: "",
  ciudad: "",
  latitud: "",
  longitud: "",
};

const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (<div className={`CrudBluetti_toast ${type}`}><span style={{fontSize:20}}>{type==="success"?"✓":"⚠"}</span><span>{message}</span></div>);
};

const Loading = ({ text = "Cargando..." }) => (
  <div className="CrudBluetti_loading"><div className="CrudBluetti_spinner" /><p style={{color:"var(--text-secondary)"}}>{text}</p></div>
);
const EmptyState = ({ title = "No hay registros" }) => (<div className="CrudBluetti_empty"><p>{title}</p></div>);

export default function Crudcuentasclientesbluetti() {
  const [items, setItems] = useState([]);
  const [canales, setCanales] = useState([]); // lista de canales
  const [canalesMap, setCanalesMap] = useState({}); // id -> nombre_canal
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

  // load canales once
  useEffect(() => {
    let mounted = true;
    const loadCanales = async () => {
      try {
        const data = await getCanalesBluetti();
        const list = Array.isArray(data) ? data : [];
        if (!mounted) return;
        setCanales(list);
        const map = {};
        list.forEach(c => {
          const key = c.id_registro ?? c.id;
          map[key] = c.nombre_canal ?? c.nombre;
        });
        setCanalesMap(map);
      } catch (err) {
        console.error("Error cargando canales:", err);
      }
    };
    loadCanales();
    return () => { mounted = false; };
  }, []);

  useEffect(() => { cargar(); }, [rowsPerPage]);

  const cargar = async () => {
    try {
      setLoading(true);
      const data = await getCuentasClientesBluetti();
      const lista = Array.isArray(data) ? data : [];
      // enriquecer con nombre de canal si ya lo tenemos
      const normal = lista.map(item => ({
        ...item,
        canal_nombre: (item.nombre_canal ?? canalesMap[item.canal]) || canalesMap[item.canal] || null
      }));
      setItems(normal);
    } catch (err) {
      console.error(err);
      showToast("Error cargando cuentas", "error");
    } finally {
      setLoading(false);
    }
  };

  // cuando cambie el mapa de canales, actualizamos items para mostrar nombres
  useEffect(() => {
    if (!items.length) return;
    setItems(prev => prev.map(it => ({
      ...it,
      canal_nombre: it.canal_nombre ?? canalesMap[it.canal] ?? it.canal_nombre
    })));
  }, [canalesMap]); // eslint-disable-line

  useEffect(() => {
    const onOutside = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", onOutside); return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  const openModal = useCallback((item = null) => {
    if (!item) { setActive({ ...CUENTA_INICIAL }); setModalOpen(true); return; }
    // normalizar: asegurar que canal sea el id numérico
    const canalId = (item.canal && typeof item.canal === "object") ? (item.canal.id_registro ?? item.canal.id) : item.canal;
    setActive({ ...item, canal: canalId ?? null });
    setModalOpen(true);
  }, []);

  const closeModal = () => { setActive(null); setModalOpen(false); };

  const save = async () => {
    try {
      if (!active?.nombre_cliente) { showToast("Completa el nombre del cliente", "error"); return; }
      setLoading(true);
      // preparar payload: asegurarse canal sea number o null
      const payload = { ...active, canal: active.canal ? Number(active.canal) : null };
      if (active.id) { await updateCuentaClienteBluetti(active.id, payload); showToast("Cuenta actualizada", "success"); }
      else { await createCuentaClienteBluetti(payload); showToast("Cuenta creada", "success"); }
      closeModal(); await cargar();
    } catch (err) {
      console.error(err);
      showToast("Error guardando cuenta", "error");
    } finally {
      setLoading(false);
    }
  };

  const eliminar = async (id, nombre) => {
    if (!window.confirm(`Eliminar ${nombre}?`)) return;
    try { setLoading(true); await deleteCuentaClienteBluetti(id); showToast("Eliminado", "success"); await cargar(); }
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
  const getSortValue = (p, key) => {
    if (key === "canal") {
      return p.canal_nombre ?? canalesMap[p.canal] ?? (typeof p.canal === "object" ? (p.canal.nombre_canal ?? p.canal.nombre) : (p.canal ?? ""));
    }
    return p?.[key] ?? "";
  };
  const sorted = [...filtered].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const av = getSortValue(a, sortConfig.key);
    const bv = getSortValue(b, sortConfig.key);
    const base = compareValues(av, bv);
    return sortConfig.direction === "asc" ? base : -base;
  });
  const totalRows = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const paged = sorted.slice((currentPage-1)*rowsPerPage, (currentPage-1)*rowsPerPage + rowsPerPage);

  const exportar = async () => {
    try {
      const res = await exportCuentasClientesBluetti();
      const blob = await res.blob(); const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `cuentas_clientes_bluetti_${new Date().toISOString().split("T")[0]}.xlsx`; document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
      showToast("Exportado correctamente", "success");
    } catch (err) { console.error(err); showToast("Error exportando", "error"); }
  };

  const exportarPlantilla = async () => {
    try {
      const res = await exportTemplateCuentasClientesBluetti();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "plantilla_cuentas_clientes_bluetti.xlsx";
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
    try { setLoading(true); const res = await bulkUpdateCuentasClientesBluettiExcel(file); showToast(`Actualizados: ${res.updated || "?"}`, "success"); await cargar(); }
    catch (err) { console.error(err); showToast("Error actualizando desde Excel", "error"); } finally { setLoading(false); e.target.value = ""; }
  };

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      setLoading(true);
      const res = await bulkImportCuentasClientesBluetti(file);
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
    if (!window.confirm(`Eliminar ${selectedIds.size} cuentas?`)) return;
    try { setLoading(true); await bulkDeleteCuentasClientesBluetti(Array.from(selectedIds)); showToast("Eliminados", "success"); setSelectedIds(new Set()); setSelectAll(false); await cargar(); }
    catch (err) { console.error(err); showToast("Error eliminando", "error"); } finally { setLoading(false); }
  };

  const toggleSelect = (id) => setSelectedIds((prev) => { const c=new Set(prev); if(c.has(id)) c.delete(id); else c.add(id); setSelectAll(false); return c; });
  const toggleSelectAll = () => {
    if (selectAll) { setSelectedIds(new Set()); setSelectAll(false); }
    else { const allIds = sorted.map((p)=>p.id_registro || p.id); setSelectedIds(new Set(allIds)); setSelectAll(true); }
  };
  const toggleSort = (key) => {
    setCurrentPage(1);
    setSortConfig((prev) => (prev.key === key ? { key, direction: prev.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" }));
  };

  const handleInput = (field, value) => setActive((p)=>({...p, [field]: value}));
  const countryOptions = useMemo(() => {
    const current = (active?.pais || "").trim();
    if (current && !COUNTRY_OPTIONS.includes(current)) return [current, ...COUNTRY_OPTIONS];
    return COUNTRY_OPTIONS;
  }, [active?.pais]);

  return (
    <div className="CrudBluetti_container">
      <h2 className="CrudBluetti_title">Cuentas / Clientes Bluetti</h2>

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

      {loading ? <Loading text="Cargando cuentas..." /> : (
        <div className="CrudBluetti_table_wrapper">
          <table className="CrudBluetti_table">
            <thead>
              <tr>
                <th style={{width:40}}><input type="checkbox" checked={selectAll} onChange={toggleSelectAll} /></th>
                <th><button type="button" className="CrudBluetti_th_btn" onClick={() => toggleSort("nombre_cliente")}>Cliente <span>{sortIndicator("nombre_cliente")}</span></button></th>
                <th><button type="button" className="CrudBluetti_th_btn" onClick={() => toggleSort("canal")}>Canal <span>{sortIndicator("canal")}</span></button></th>
                <th><button type="button" className="CrudBluetti_th_btn" onClick={() => toggleSort("pais")}>País <span>{sortIndicator("pais")}</span></button></th>
                <th><button type="button" className="CrudBluetti_th_btn" onClick={() => toggleSort("ciudad")}>Ciudad <span>{sortIndicator("ciudad")}</span></button></th>
                <th><button type="button" className="CrudBluetti_th_btn" onClick={() => toggleSort("region")}>Región <span>{sortIndicator("region")}</span></button></th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length>0 ? paged.map((p)=>(
                <tr key={p.id_registro||p.id}>
                  <td><input type="checkbox" checked={selectedIds.has(p.id_registro||p.id)} onChange={()=>toggleSelect(p.id_registro||p.id)} /></td>
                  <td><strong>{p.nombre_cliente||"-"}</strong></td>
                  <td>{p.canal_nombre ?? canalesMap[p.canal] ?? (typeof p.canal === "object" ? (p.canal.nombre_canal ?? p.canal.nombre) : (p.canal ?? "-"))}</td>
                  <td>{p.pais || "-"}</td>
                  <td>{p.ciudad || "-"}</td>
                  <td>{p.region || "-"}</td>
                  <td>
                    <button onClick={()=>openModal(p)}>Editar</button>
                    <button onClick={()=>eliminar(p.id, p.nombre_cliente)}>Eliminar</button>
                  </td>
                </tr>
              )) : <tr><td colSpan="7"><EmptyState title="No se encontraron cuentas" /></td></tr>}
            </tbody>
          </table>

          <div className="CrudBluetti_pagination">
            <div>
              <span>Mostrar </span>
              <select value={rowsPerPage} onChange={(e)=>setRowsPerPage(Number(e.target.value))}>
                {[10,25,50,80,100].map(n=><option key={n} value={n}>{n}</option>)}
              </select><span> registros</span>
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
              <h3>{active?.id ? "Editar Cuenta" : "Nueva Cuenta"}</h3>
              <button className="CrudBluetti_modal_close" onClick={closeModal}>✕</button>
            </div>

            <div className="CrudBluetti_form_group">
              <label className="CrudBluetti_form_label">Nombre <span style={{color:"var(--accent-red)"}}>*</span></label>
              <input type="text" placeholder="Nombre cliente" value={active?.nombre_cliente||""} onChange={(e)=>handleInput("nombre_cliente", e.target.value)} />
            </div>

            {/* ---- CAMBIO: selector de Canal por nombre (muestra nombre_canal) ---- */}
            <div className="CrudBluetti_form_group">
              <label className="CrudBluetti_form_label">Canal</label>
              <select value={active?.canal ?? ""} onChange={(e)=>handleInput("canal", e.target.value ? Number(e.target.value) : null)}>
                <option value="">(Sin canal)</option>
                {canales.map(c => {
                  const key = c.id_registro ?? c.id;
                  return (<option key={key} value={key}>{c.nombre_canal ?? c.nombre}</option>);
                })}
              </select>
            </div>

            <div className="CrudBluetti_form_group">
              <label className="CrudBluetti_form_label">Pais</label>
              <select value={active?.pais || ""} onChange={(e) => handleInput("pais", e.target.value)}>
                <option value="">(Seleccionar pais)</option>
                {countryOptions.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
            <div className="CrudBluetti_form_group"><label className="CrudBluetti_form_label">Región</label><input type="text" placeholder="Región" value={active?.region||""} onChange={(e)=>handleInput("region", e.target.value)} /></div>
            <div className="CrudBluetti_form_group"><label className="CrudBluetti_form_label">Ciudad</label><input type="text" placeholder="Ciudad" value={active?.ciudad||""} onChange={(e)=>handleInput("ciudad", e.target.value)} /></div>

            <div className="CrudBluetti_modal_actions"><button onClick={save}>Guardar</button><button onClick={closeModal}>Cancelar</button></div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}




