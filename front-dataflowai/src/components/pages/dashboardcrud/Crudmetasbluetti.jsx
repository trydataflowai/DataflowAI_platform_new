import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BLUETTI_MODULE_LINKS } from "../../../constants/moduleMenus";
import {
  getMetasComercialesBluetti,
  createMetaComercialBluetti,
  updateMetaComercialBluetti,
  deleteMetaComercialBluetti,
  exportMetasComercialesBluetti,
  exportTemplateMetasComercialesBluetti,
  bulkImportMetasComercialesBluetti,
  bulkUpdateMetasComercialesBluettiExcel,
  bulkDeleteMetasComercialesBluetti,
} from "../../../api/DashboardsCrudApis/Crudmetasbluetti";
import { getCanalesBluetti } from "../../../api/DashboardsCrudApis/Crudcanalesbluetti";
import { COUNTRY_OPTIONS } from "../../../utils/countryOptions";

import "../../../styles/CrudDashboard/CrudBluetti.css";

const META_INICIAL = {
  ano: new Date().getFullYear(),
  mes: null,
  canal: null,
  pais: "",
  meta_monetaria: 0,
  meta_unidades: null,
};

const MESES = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
];

const normalizarIdRelacion = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "object") return value.id_registro ?? value.id ?? null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const getMesLabel = (mes) => {
  const m = Number(mes);
  const found = MESES.find((x) => x.value === m);
  return found ? found.label : "-";
};

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`CrudBluetti_toast ${type}`}>
      <span style={{ fontSize: 20 }}>{type === "success" ? "OK" : "!"}</span>
      <span>{message}</span>
    </div>
  );
};

const Loading = ({ text = "Cargando metas..." }) => (
  <div className="CrudBluetti_loading">
    <div className="CrudBluetti_spinner" />
    <p style={{ color: "var(--text-secondary)" }}>{text}</p>
  </div>
);

const EmptyState = ({ title = "No hay metas" }) => (
  <div className="CrudBluetti_empty">
    <p>{title}</p>
  </div>
);

export default function Crudmetasbluetti() {
  const [items, setItems] = useState([]);
  const [canales, setCanales] = useState([]);
  const [canalesMap, setCanalesMap] = useState({});
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

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  useEffect(() => {
    cargar();
  }, [rowsPerPage]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let mounted = true;
    const loadCanales = async () => {
      try {
        const data = await getCanalesBluetti();
        const list = Array.isArray(data) ? data : [];
        if (!mounted) return;
        setCanales(list);
        const map = {};
        list.forEach((c) => {
          const key = c.id_registro ?? c.id;
          map[key] = c.nombre_canal ?? c.nombre;
        });
        setCanalesMap(map);
      } catch (err) {
        console.error(err);
      }
    };

    loadCanales();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!items.length) return;
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        canal_nombre: it.canal_nombre ?? canalesMap[it.canal] ?? null,
      }))
    );
  }, [canalesMap]); // eslint-disable-line react-hooks/exhaustive-deps

  const cargar = async () => {
    try {
      setLoading(true);
      const data = await getMetasComercialesBluetti();
      const list = Array.isArray(data) ? data : [];
      const normal = list.map((item) => {
        const canalId = normalizarIdRelacion(item.canal);
        const canalNombreObjeto =
          typeof item.canal === "object" ? item.canal?.nombre_canal ?? item.canal?.nombre ?? null : null;
        return {
          ...item,
          id: item.id ?? item.id_registro,
          canal: canalId,
          canal_nombre: item.canal_nombre ?? canalNombreObjeto ?? canalesMap[canalId] ?? null,
        };
      });
      setItems(normal);
    } catch (err) {
      console.error(err);
      showToast("Error cargando metas", "error");
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

  const openModal = useCallback((item = null) => {
    if (!item) {
      setActive({ ...META_INICIAL });
      setModalOpen(true);
      return;
    }

    setActive({
      ...item,
      id: item.id ?? item.id_registro,
      ano: item.ano ? Number(item.ano) : new Date().getFullYear(),
      mes: item.mes ? Number(item.mes) : null,
      canal: normalizarIdRelacion(item.canal),
      meta_monetaria: Number(item.meta_monetaria ?? 0),
      meta_unidades:
        item.meta_unidades === null || item.meta_unidades === undefined || item.meta_unidades === ""
          ? null
          : Number(item.meta_unidades),
    });
    setModalOpen(true);
  }, []);

  const closeModal = () => {
    setActive(null);
    setModalOpen(false);
  };

  const save = async () => {
    try {
      if (!active?.ano || active?.meta_monetaria === null || active?.meta_monetaria === undefined) {
        showToast("Ano y meta monetaria son requeridos", "error");
        return;
      }

      const payload = {
        ...active,
        ano: Number(active.ano),
        mes: active.mes ? Number(active.mes) : null,
        canal: active.canal ? Number(active.canal) : null,
        meta_monetaria: Number(active.meta_monetaria ?? 0),
        meta_unidades:
          active.meta_unidades === null || active.meta_unidades === undefined || active.meta_unidades === ""
            ? null
            : Number(active.meta_unidades),
      };

      setLoading(true);
      if (active.id) {
        await updateMetaComercialBluetti(active.id, payload);
        showToast("Meta actualizada", "success");
      } else {
        await createMetaComercialBluetti(payload);
        showToast("Meta creada", "success");
      }
      closeModal();
      await cargar();
    } catch (err) {
      console.error(err);
      showToast("Error guardando meta", "error");
    } finally {
      setLoading(false);
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm("Eliminar meta?")) return;
    try {
      setLoading(true);
      await deleteMetaComercialBluetti(id);
      showToast("Meta eliminada", "success");
      await cargar();
    } catch (err) {
      console.error(err);
      showToast("Error eliminando", "error");
    } finally {
      setLoading(false);
    }
  };

  const filtered = items.filter((p) => Object.values(p).join(" ").toLowerCase().includes(busqueda.toLowerCase()));
  const sortIndicator = (key) => (sortConfig.key !== key ? "\u2195" : sortConfig.direction === "asc" ? "\u2191" : "\u2193");
  const compareValues = (a, b) => {
    if (typeof a === "number" && typeof b === "number") return a - b;
    const aNum = Number(a);
    const bNum = Number(b);
    const bothNumeric = a !== "" && b !== "" && !Number.isNaN(aNum) && !Number.isNaN(bNum);
    if (bothNumeric) return aNum - bNum;
    return String(a).localeCompare(String(b), "es", { numeric: true, sensitivity: "base" });
  };
  const getSortValue = (p, key) => {
    if (key === "mes") return Number(p.mes) || 0;
    if (key === "canal") return p.canal_nombre ?? canalesMap[p.canal] ?? "";
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
  const paged = sorted.slice((currentPage - 1) * rowsPerPage, (currentPage - 1) * rowsPerPage + rowsPerPage);

  const exportar = async () => {
    try {
      const res = await exportMetasComercialesBluetti();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `metas_bluetti_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("Exportado", "success");
    } catch (err) {
      console.error(err);
      showToast("Error exportando", "error");
    }
  };

  const exportarPlantilla = async () => {
    try {
      const res = await exportTemplateMetasComercialesBluetti();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "plantilla_metas_comerciales_bluetti.xlsx";
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
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const res = await bulkUpdateMetasComercialesBluettiExcel(file);
      showToast(`Actualizados: ${res.updated || "?"}`, "success");
      await cargar();
    } catch (err) {
      console.error(err);
      showToast("Error actualizando desde Excel", "error");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const res = await bulkImportMetasComercialesBluetti(file);
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
    if (selectedIds.size === 0) {
      showToast("Selecciona registros", "error");
      return;
    }
    if (!window.confirm(`Eliminar ${selectedIds.size} metas?`)) return;
    try {
      setLoading(true);
      await bulkDeleteMetasComercialesBluetti(Array.from(selectedIds));
      showToast("Eliminados", "success");
      setSelectedIds(new Set());
      setSelectAll(false);
      await cargar();
    } catch (err) {
      console.error(err);
      showToast("Error eliminando", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) =>
    setSelectedIds((prev) => {
      const c = new Set(prev);
      if (c.has(id)) c.delete(id);
      else c.add(id);
      setSelectAll(false);
      return c;
    });
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
      setSelectAll(false);
    } else {
      const allIds = sorted.map((p) => p.id_registro || p.id);
      setSelectedIds(new Set(allIds));
      setSelectAll(true);
    }
  };
  const toggleSort = (key) => {
    setCurrentPage(1);
    setSortConfig((prev) =>
      prev.key === key ? { key, direction: prev.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" }
    );
  };

  const handleInput = (field, value) => setActive((p) => ({ ...p, [field]: value }));
  const countryOptions = useMemo(() => {
    const current = (active?.pais || "").trim();
    if (current && !COUNTRY_OPTIONS.includes(current)) return [current, ...COUNTRY_OPTIONS];
    return COUNTRY_OPTIONS;
  }, [active?.pais]);

  return (
    <div className="CrudBluetti_container">
      <h2 className="CrudBluetti_title">Metas Comerciales Bluetti</h2>

      <div className="CrudBluetti_nav_wrapper" ref={menuRef}>
        <button className="CrudBluetti_nav_btn" onClick={() => setMenuOpen((p) => !p)}>
          Menu de modulos
        </button>
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
        <button onClick={exportarPlantilla} className="CrudBluetti_btn">Plantilla para Importar nuevos Registros</button>
        <button onClick={() => fileInputRef.current?.click()} className="CrudBluetti_btn">Importar (masivo)</button>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={handleFileImport} />
        <button onClick={() => fileUpdateRef.current.click()} className="CrudBluetti_btn">Actualizar por Excel</button>
        <input ref={fileUpdateRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={handleFileUpdate} />
        <button onClick={exportar} className="CrudBluetti_btn btn-exportar">Exportar</button>
        <button onClick={handleBulkDelete} className="CrudBluetti_btn btn-danger">Eliminar seleccionados</button>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div className="CrudBluetti_table_wrapper">
          <table className="CrudBluetti_table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} />
                </th>
                <th>
                  <button type="button" className="CrudBluetti_th_btn" onClick={() => toggleSort("ano")}>
                    {"A\u00F1o"} <span>{sortIndicator("ano")}</span>
                  </button>
                </th>
                <th>
                  <button type="button" className="CrudBluetti_th_btn" onClick={() => toggleSort("mes")}>
                    Mes <span>{sortIndicator("mes")}</span>
                  </button>
                </th>
                <th>
                  <button type="button" className="CrudBluetti_th_btn" onClick={() => toggleSort("canal")}>
                    Canal <span>{sortIndicator("canal")}</span>
                  </button>
                </th>
                <th>
                  <button type="button" className="CrudBluetti_th_btn" onClick={() => toggleSort("pais")}>
                    Pais <span>{sortIndicator("pais")}</span>
                  </button>
                </th>
                <th>
                  <button type="button" className="CrudBluetti_th_btn" onClick={() => toggleSort("meta_monetaria")}>
                    Meta <span>{sortIndicator("meta_monetaria")}</span>
                  </button>
                </th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length > 0 ? (
                paged.map((p) => (
                  <tr key={p.id_registro || p.id}>
                    <td>
                      <input type="checkbox" checked={selectedIds.has(p.id_registro || p.id)} onChange={() => toggleSelect(p.id_registro || p.id)} />
                    </td>
                    <td>{p.ano}</td>
                    <td>{getMesLabel(p.mes)}</td>
                    <td>{p.canal_nombre ?? canalesMap[p.canal] ?? "-"}</td>
                    <td>{p.pais || "-"}</td>
                    <td>{p.meta_monetaria ?? "-"}</td>
                    <td>
                      <button onClick={() => openModal(p)}>Editar</button>
                      <button onClick={() => eliminar(p.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">
                    <EmptyState title="No se encontraron metas" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="CrudBluetti_pagination">
            <div>
              <span>Mostrar </span>
              <select value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}>
                {[10, 25, 50, 80, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span> registros</span>
            </div>
            <div className="CrudBluetti_pagination_controls">
              <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>Anterior</button>
              <span>Pagina {currentPage} de {totalPages}</span>
              <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Siguiente</button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="CrudBluetti_modal" onClick={closeModal}>
          <div className="CrudBluetti_modal_content" onClick={(e) => e.stopPropagation()}>
            <div className="CrudBluetti_modal_header">
              <h3>{active?.id ? "Editar Meta" : "Nueva Meta"}</h3>
              <button className="CrudBluetti_modal_close" onClick={closeModal}>X</button>
            </div>

            <div className="CrudBluetti_form_group">
              <label className="CrudBluetti_form_label">Ano</label>
              <input type="number" value={active?.ano || ""} onChange={(e) => handleInput("ano", Number(e.target.value))} />
            </div>

            <div className="CrudBluetti_form_group">
              <label className="CrudBluetti_form_label">Mes (opcional)</label>
              <select
                value={active?.mes ?? ""}
                onChange={(e) => handleInput("mes", e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">(Sin mes)</option>
                {MESES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div className="CrudBluetti_form_group">
              <label className="CrudBluetti_form_label">Canal</label>
              <select
                value={active?.canal ?? ""}
                onChange={(e) => handleInput("canal", e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">(Sin canal)</option>
                {canales.map((c) => {
                  const key = c.id_registro ?? c.id;
                  return (
                    <option key={key} value={key}>
                      {c.nombre_canal ?? c.nombre}
                    </option>
                  );
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
            <div className="CrudBluetti_form_group">
              <label className="CrudBluetti_form_label">Meta monetaria</label>
              <input type="number" value={active?.meta_monetaria || 0} onChange={(e) => handleInput("meta_monetaria", Number(e.target.value))} />
            </div>
            <div className="CrudBluetti_form_group">
              <label className="CrudBluetti_form_label">Meta unidades</label>
              <input
                type="number"
                value={active?.meta_unidades ?? ""}
                onChange={(e) => handleInput("meta_unidades", e.target.value === "" ? null : Number(e.target.value))}
              />
            </div>

            <div className="CrudBluetti_modal_actions">
              <button onClick={save}>Guardar</button>
              <button onClick={closeModal}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
