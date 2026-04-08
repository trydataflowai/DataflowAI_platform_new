import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LOOPSERVICIOSTOTEK_MODULE_LINKS } from "../../../constants/moduleMenus";
import {
  getLoopserviciosTotek,
  createLoopservicioTotek,
  updateLoopservicioTotek,
  deleteLoopservicioTotek,
  exportLoopserviciosTotek,
  exportTemplateLoopserviciosTotek,
  bulkImportLoopserviciosTotek,
  bulkUpdateLoopserviciosTotekExcel,
  bulkDeleteLoopserviciosTotek,
} from "../../../api/DashboardsCrudApis/Loopserviciostotek";

import "../../../styles/CrudDashboard/Loopserviciostotek.css";

const LOOPST_ESTADOS = ["FINALIZADO", "CANCELADO", "REPROGRAMADO", "NO_INSTALADO"];
const LOOPST_TIPOS_EMPRESA = ["DIRECTO", "RETAIL"];
const LOOPST_SATISFACCION_ESCALA = [
  { value: 1, label: "1 — Muy insatisfecho" },
  { value: 2, label: "2 — Insatisfecho" },
  { value: 3, label: "3 — Neutral" },
  { value: 4, label: "4 — Satisfecho" },
  { value: 5, label: "5 — Muy satisfecho" },
];
const LOOPST_SAT_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#00c27c"];
const LOOPST_CIUDADES_PRINCIPALES = [
  "BOGOTA", "MEDELLIN", "CALI", "BARRANQUILLA", "CARTAGENA",
  "VILLAVICENCIO", "YOPAL", "GIRARDOT", "IBAGUE", "ARMENIA",
  "NEIVA", "MANIZALES", "PEREIRA", "BUCARAMANGA", "CUCUTA",
  "SANTA_MARTA", "VALLEDUPAR", "TUNJA", "SINCELEJO", "MONTERIA", "OTRA",
];

const LOOPST_SERVICIO_INICIAL = {
  fecha_servicio: "",
  mes: "",
  ano: "",
  tipo_empresa: "",
  categoria_servicio: "",
  descripcion_servicio: "",
  cantidad_instalada: 0,
  estado_servicio: "FINALIZADO",
  motivo_cancelacion: "",
  motivo_reprogramacion: "",
  satisfaccion_cliente: null,
  ciudad_principal: "",
  ciudad: "",
  codigo_ot: "",
  nombre_instalador: "",
  notas: "",
};

const LoopstToast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`Loopst_toast ${type}`}>
      <span>{type === "success" ? "✓" : "⚠"}</span>
      <span>{message}</span>
    </div>
  );
};

const LoopstLoading = ({ text = "Cargando..." }) => (
  <div className="Loopst_loading">
    <div className="Loopst_spinner" />
    <p>{text}</p>
  </div>
);

const LoopstEmpty = ({ title = "No hay registros" }) => (
  <div className="Loopst_empty"><p>{title}</p></div>
);

export default function LoopserviciosTotekCrud() {
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

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      setLoading(true);
      const data = await getLoopserviciosTotek();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      showToast("Error cargando servicios", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const onOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  const openModal = useCallback((item = null) => {
    setActive(item ? { ...item } : { ...LOOPST_SERVICIO_INICIAL });
    setModalOpen(true);
  }, []);

  const closeModal = () => { setActive(null); setModalOpen(false); };

  const save = async () => {
    try {
      if (!active?.estado_servicio) {
        showToast("Estado del servicio es obligatorio", "error");
        return;
      }
      setLoading(true);
      if (active.id_registro) {
        await updateLoopservicioTotek(active.id_registro, active);
        showToast("Servicio actualizado", "success");
      } else {
        await createLoopservicioTotek(active);
        showToast("Servicio creado", "success");
      }
      closeModal();
      await cargar();
    } catch (err) {
      console.error(err);
      showToast("Error guardando servicio", "error");
    } finally {
      setLoading(false);
    }
  };

  const eliminar = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar servicio "${nombre || id}"? Esta acción no se puede deshacer.`)) return;
    try {
      setLoading(true);
      await deleteLoopservicioTotek(id);
      showToast("Servicio eliminado", "success");
      setSelectedIds((prev) => { const c = new Set(prev); c.delete(id); return c; });
      await cargar();
    } catch (err) {
      console.error(err);
      showToast("Error eliminando", "error");
    } finally {
      setLoading(false);
    }
  };

  // Filtrado, orden y paginación
  const filtered = items.filter((p) =>
    Object.values(p).join(" ").toLowerCase().includes(busqueda.toLowerCase())
  );

  const compareValues = (a, b) => {
    if (typeof a === "number" && typeof b === "number") return a - b;
    const aNum = Number(a); const bNum = Number(b);
    if (a !== "" && b !== "" && !Number.isNaN(aNum) && !Number.isNaN(bNum)) return aNum - bNum;
    return String(a).localeCompare(String(b), "es", { numeric: true, sensitivity: "base" });
  };

  const sorted = [...filtered].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const av = a?.[sortConfig.key] ?? ""; const bv = b?.[sortConfig.key] ?? "";
    return sortConfig.direction === "asc" ? compareValues(av, bv) : -compareValues(av, bv);
  });

  const totalRows = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const paged = sorted.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const sortIndicator = (key) => sortConfig.key !== key ? "⇅" : sortConfig.direction === "asc" ? "↑" : "↓";
  const toggleSort = (key) => {
    setCurrentPage(1);
    setSortConfig((prev) => prev.key === key
      ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
      : { key, direction: "asc" });
  };

  // Exportar
  const exportar = async () => {
    try {
      const res = await exportLoopserviciosTotek();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `servicios_loop_totek_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      showToast("Exportado correctamente", "success");
    } catch (err) { console.error(err); showToast("Error exportando", "error"); }
  };

  const exportarPlantilla = async () => {
    try {
      const res = await exportTemplateLoopserviciosTotek();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "plantilla_servicios_loop_totek.xlsx";
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      showToast("Plantilla exportada", "success");
    } catch (err) { console.error(err); showToast("Error exportando plantilla", "error"); }
  };

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      setLoading(true);
      const res = await bulkImportLoopserviciosTotek(file);
      const total = res?.created ?? res?.importados ?? res?.inserted ?? res?.count ?? "?";
      showToast(`Importados: ${total}`, "success");
      await cargar();
    } catch (err) {
      console.error(err);
      showToast(err?.message || "Error en importación masiva", "error");
    } finally { setLoading(false); e.target.value = ""; }
  };

  const handleFileUpdate = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      setLoading(true);
      const res = await bulkUpdateLoopserviciosTotekExcel(file);
      showToast(`Actualizados: ${res.updated || "?"}`, "success");
      await cargar();
    } catch (err) {
      console.error(err);
      showToast("Error actualizando desde Excel", "error");
    } finally { setLoading(false); e.target.value = ""; }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) { showToast("Selecciona al menos un servicio", "error"); return; }
    if (!window.confirm(`¿Eliminar ${selectedIds.size} servicios?`)) return;
    try {
      setLoading(true);
      await bulkDeleteLoopserviciosTotek(Array.from(selectedIds));
      showToast("Eliminados correctamente", "success");
      setSelectedIds(new Set()); setSelectAll(false);
      await cargar();
    } catch (err) { console.error(err); showToast("Error en eliminación masiva", "error"); }
    finally { setLoading(false); }
  };

  const toggleSelect = (id) => setSelectedIds((prev) => {
    const c = new Set(prev); if (c.has(id)) c.delete(id); else c.add(id);
    setSelectAll(false); return c;
  });

  const toggleSelectAll = () => {
    if (selectAll) { setSelectedIds(new Set()); setSelectAll(false); }
    else { setSelectedIds(new Set(sorted.map((p) => p.id_registro))); setSelectAll(true); }
  };

  const handleInput = (field, value) => setActive((p) => ({ ...p, [field]: value }));

  const estadoBadge = (estado) => {
    const map = {
      FINALIZADO: "Loopst_badge_ok",
      CANCELADO: "Loopst_badge_cancel",
      REPROGRAMADO: "Loopst_badge_rep",
      NO_INSTALADO: "Loopst_badge_no",
    };
    return map[estado] || "";
  };

  return (
    <div className="Loopst_container">
      {/* Header */}
      <div className="Loopst_header_row">
        <div>
          <div className="Loopst_logo_badge">LOOP</div>
          <h2 className="Loopst_title">Servicios Totek — CRUD</h2>
          <p className="Loopst_subtitle">Gestión de órdenes de trabajo y servicios de instalación</p>
        </div>

        {/* Menu modulos */}
        <div className="Loopst_nav_wrapper" ref={menuRef}>
          <button className="Loopst_nav_btn" onClick={() => setMenuOpen((p) => !p)}>
            ☰ Módulos Loop
          </button>
          {menuOpen && (
            <div className="Loopst_nav_menu">
              {LOOPSERVICIOSTOTEK_MODULE_LINKS.map((link) => (
                <button key={link.path} onClick={() => navigate(link.path)}>
                  {link.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Barra de acciones */}
      <div className="Loopst_actions">
        <input
          className="Loopst_search"
          placeholder="Buscar en todos los campos..."
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setCurrentPage(1); }}
        />
        <button onClick={() => openModal()} className="Loopst_btn btn-nuevo">+ Nuevo</button>
        <button onClick={exportarPlantilla} className="Loopst_btn">Descargar Plantilla</button>
        <button onClick={() => fileInputRef.current?.click()} className="Loopst_btn">Importar Masivo</button>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={handleFileImport} />
        <button onClick={() => fileUpdateRef.current?.click()} className="Loopst_btn">Actualizar por Excel</button>
        <input ref={fileUpdateRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={handleFileUpdate} />
        <button onClick={exportar} className="Loopst_btn btn-exportar">Exportar</button>
        <button onClick={handleBulkDelete} className="Loopst_btn btn-danger">
          Eliminar seleccionados {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
        </button>
      </div>

      {/* Tabla */}
      {loading ? (
        <LoopstLoading text="Cargando servicios Loop Totek..." />
      ) : (
        <div className="Loopst_table_wrapper">
          <table className="Loopst_table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} />
                </th>
                <th><button className="Loopst_th_btn" onClick={() => toggleSort("codigo_ot")}>OT {sortIndicator("codigo_ot")}</button></th>
                <th><button className="Loopst_th_btn" onClick={() => toggleSort("fecha_servicio")}>Fecha {sortIndicator("fecha_servicio")}</button></th>
                <th><button className="Loopst_th_btn" onClick={() => toggleSort("estado_servicio")}>Estado {sortIndicator("estado_servicio")}</button></th>
                <th><button className="Loopst_th_btn" onClick={() => toggleSort("tipo_empresa")}>Tipo Empresa {sortIndicator("tipo_empresa")}</button></th>
                <th><button className="Loopst_th_btn" onClick={() => toggleSort("categoria_servicio")}>Categoría {sortIndicator("categoria_servicio")}</button></th>
                <th><button className="Loopst_th_btn" onClick={() => toggleSort("cantidad_instalada")}>Cant. {sortIndicator("cantidad_instalada")}</button></th>
                <th><button className="Loopst_th_btn" onClick={() => toggleSort("ciudad_principal")}>Ciudad Principal {sortIndicator("ciudad_principal")}</button></th>
                <th><button className="Loopst_th_btn" onClick={() => toggleSort("nombre_instalador")}>Instalador {sortIndicator("nombre_instalador")}</button></th>
                <th><button className="Loopst_th_btn" onClick={() => toggleSort("satisfaccion_cliente")}>Satisfacción {sortIndicator("satisfaccion_cliente")}</button></th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paged.length > 0 ? paged.map((p) => (
                <tr key={p.id_registro}>
                  <td><input type="checkbox" checked={selectedIds.has(p.id_registro)} onChange={() => toggleSelect(p.id_registro)} /></td>
                  <td><strong>{p.codigo_ot || "-"}</strong></td>
                  <td>{p.fecha_servicio || "-"}</td>
                  <td><span className={`Loopst_badge ${estadoBadge(p.estado_servicio)}`}>{p.estado_servicio || "-"}</span></td>
                  <td>{p.tipo_empresa || "-"}</td>
                  <td>{p.categoria_servicio || "-"}</td>
                  <td style={{ textAlign: "center" }}>{p.cantidad_instalada ?? 0}</td>
                  <td>{p.ciudad_principal || "-"}</td>
                  <td>{p.nombre_instalador || "-"}</td>
                  <td style={{ textAlign: "center" }}>
                    {p.satisfaccion_cliente
                      ? <span style={{ fontWeight: 600, color: LOOPST_SAT_COLORS[p.satisfaccion_cliente - 1] }}>{p.satisfaccion_cliente} ★</span>
                      : "-"}
                  </td>
                  <td className="Loopst_actions_cell">
                    <button className="Loopst_btn_edit" onClick={() => openModal(p)}>Editar</button>
                    <button className="Loopst_btn_del" onClick={() => eliminar(p.id_registro, p.codigo_ot)}>Eliminar</button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="11"><LoopstEmpty title="No se encontraron servicios" /></td></tr>
              )}
            </tbody>
          </table>

          {/* Paginación */}
          <div className="Loopst_pagination">
            <div>
              <span>Mostrar </span>
              <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                {[10, 25, 50, 80, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <span> registros — Total: {totalRows}</span>
            </div>
            <div className="Loopst_pagination_controls">
              <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>Anterior</button>
              <span>Página {currentPage} de {totalPages}</span>
              <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Siguiente</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear/Editar */}
      {modalOpen && (
        <div className="Loopst_modal" onClick={closeModal}>
          <div className="Loopst_modal_content" onClick={(e) => e.stopPropagation()}>
            <div className="Loopst_modal_header">
              <h3>{active?.id_registro ? "Editar Servicio" : "Nuevo Servicio"}</h3>
              <button className="Loopst_modal_close" onClick={closeModal}>✕</button>
            </div>

            <div className="Loopst_modal_grid">
              {/* Codigo OT */}
              <div className="Loopst_form_group">
                <label>Código OT</label>
                <input type="text" placeholder="HCL..." value={active?.codigo_ot || ""} onChange={(e) => handleInput("codigo_ot", e.target.value)} />
              </div>

              {/* Fecha servicio */}
              <div className="Loopst_form_group">
                <label>Fecha Servicio</label>
                <input type="date" value={active?.fecha_servicio || ""} onChange={(e) => handleInput("fecha_servicio", e.target.value)} />
              </div>

              {/* Mes */}
              <div className="Loopst_form_group">
                <label>Mes</label>
                <input type="text" placeholder="ej: febrero" value={active?.mes || ""} onChange={(e) => handleInput("mes", e.target.value)} />
              </div>

              {/* Año */}
              <div className="Loopst_form_group">
                <label>Año</label>
                <input type="number" placeholder="2026" value={active?.ano || ""} onChange={(e) => handleInput("ano", e.target.value)} />
              </div>

              {/* Estado */}
              <div className="Loopst_form_group">
                <label>Estado Servicio <span style={{ color: "#ef4444" }}>*</span></label>
                <select value={active?.estado_servicio || "FINALIZADO"} onChange={(e) => handleInput("estado_servicio", e.target.value)}>
                  {LOOPST_ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              {/* Tipo empresa */}
              <div className="Loopst_form_group">
                <label>Tipo Empresa</label>
                <select value={active?.tipo_empresa || ""} onChange={(e) => handleInput("tipo_empresa", e.target.value)}>
                  <option value="">-- Seleccionar --</option>
                  {LOOPST_TIPOS_EMPRESA.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              {/* Categoria */}
              <div className="Loopst_form_group">
                <label>Categoría Servicio</label>
                <input type="text" placeholder="FERRETERIA, CASA INTELIGENTE..." value={active?.categoria_servicio || ""} onChange={(e) => handleInput("categoria_servicio", e.target.value)} />
              </div>

              {/* Descripcion (ancho completo) */}
              <div className="Loopst_form_group Loopst_full_width">
                <label>Descripción Servicio</label>
                <input type="text" placeholder="ej: 1x INSTALACION CERRADURA DIGITAL..." value={active?.descripcion_servicio || ""} onChange={(e) => handleInput("descripcion_servicio", e.target.value)} />
              </div>

              {/* Cantidad */}
              <div className="Loopst_form_group">
                <label>Cantidad Instalada</label>
                <input type="number" min="0" value={active?.cantidad_instalada ?? 0} onChange={(e) => handleInput("cantidad_instalada", Number(e.target.value))} />
              </div>

              {/* Motivo cancelacion */}
              <div className="Loopst_form_group">
                <label>Motivo Cancelación</label>
                <input type="text" value={active?.motivo_cancelacion || ""} onChange={(e) => handleInput("motivo_cancelacion", e.target.value)} />
              </div>

              {/* Motivo reprogramacion */}
              <div className="Loopst_form_group">
                <label>Motivo Reprogramación</label>
                <input type="text" value={active?.motivo_reprogramacion || ""} onChange={(e) => handleInput("motivo_reprogramacion", e.target.value)} />
              </div>

              {/* Satisfaccion */}
              <div className="Loopst_form_group">
                <label>Satisfacción Cliente</label>
                <select
                  value={active?.satisfaccion_cliente ?? ""}
                  onChange={(e) => handleInput("satisfaccion_cliente", e.target.value === "" ? null : Number(e.target.value))}
                >
                  <option value="">-- N/A --</option>
                  {LOOPST_SATISFACCION_ESCALA.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Ciudad principal */}
              <div className="Loopst_form_group">
                <label>Ciudad Principal</label>
                <select value={active?.ciudad_principal || ""} onChange={(e) => handleInput("ciudad_principal", e.target.value)}>
                  <option value="">-- Seleccionar --</option>
                  {LOOPST_CIUDADES_PRINCIPALES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Ciudad */}
              <div className="Loopst_form_group">
                <label>Ciudad</label>
                <input type="text" placeholder="ej: BOGOTA. D.C." value={active?.ciudad || ""} onChange={(e) => handleInput("ciudad", e.target.value)} />
              </div>

              {/* Instalador */}
              <div className="Loopst_form_group">
                <label>Nombre Instalador</label>
                <input type="text" placeholder="Nombre completo" value={active?.nombre_instalador || ""} onChange={(e) => handleInput("nombre_instalador", e.target.value)} />
              </div>

              {/* Notas */}
              <div className="Loopst_form_group Loopst_full_width">
                <label>Notas</label>
                <textarea rows={3} value={active?.notas || ""} onChange={(e) => handleInput("notas", e.target.value)} placeholder="Observaciones adicionales..." />
              </div>
            </div>

            <div className="Loopst_modal_actions">
              <button className="Loopst_btn btn-nuevo" onClick={save}>Guardar</button>
              <button className="Loopst_btn" onClick={closeModal}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {toast && <LoopstToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
