import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getPdvBelkin,
  createPdvBelkin,
  updatePdvBelkin,
  deletePdvBelkin,
  exportPdvBelkin,
  bulkImportPdvBelkin,
  bulkUpdatePdvBelkinExcel,
  bulkDeletePdvBelkin,
} from "../../../api/DashboardsCrudApis/Crudpdvbelkin";

import "../../../styles/CrudDashboard/Crudpdvbelkin.css";

// Estructura inicial para un nuevo PDV
const PDV_INICIAL = {
  ean_pdv: "",
  punto_venta: "",
  cliente_canal: "",
};

// Toast
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`crudpdvbelkin_toast ${type}`}>
      <span style={{ fontSize: "20px" }}>{type === "success" ? "âœ“" : "âš "}</span>
      <span>{message}</span>
    </div>
  );
};

// Loading
const Loading = () => (
  <div className="crudpdvbelkin_loading">
    <div className="crudpdvbelkin_spinner"></div>
    <p style={{ color: "var(--text-secondary)" }}>Cargando PDV...</p>
  </div>
);

// Empty
const EmptyState = () => (
  <div className="crudpdvbelkin_empty">
    <p>No se encontraron puntos de venta</p>
    <p style={{ fontSize: "14px", marginTop: "8px" }}>
      Agrega tu primer PDV o ajusta los filtros de busqueda
    </p>
  </div>
);

export default function Crudpdvbelkin() {
  const [pdvs, setPdvs] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [pdvActivo, setPdvActivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fileInputRef = useRef(null);
  const fileUpdateRef = useRef(null);

  const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
  
    const navigate = useNavigate();
  

  useEffect(() => {
    cargarPdvs(1);
  }, [busqueda, rowsPerPage]);


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);
  
  useEffect(() => {
  cargarPdvs();
}, []);


  const cargarPdvs = async () => {
    try {
      setLoading(true);
      const data = await getPdvBelkin();
      setPdvs(data);
    } catch (error) {
      console.error(error);
      mostrarToast("Error al cargar PDV", "error");
    } finally {
      setLoading(false);
    }
  };

  const mostrarToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const abrirModal = useCallback((pdv = null) => {
    setPdvActivo(pdv ? { ...pdv } : { ...PDV_INICIAL });
    setModalOpen(true);
  }, []);

  const cerrarModal = () => {
    setPdvActivo(null);
    setModalOpen(false);
  };

  const guardarPdv = async () => {
    try {
      if (!pdvActivo.ean_pdv || !pdvActivo.punto_venta) {
        mostrarToast("Completa los campos obligatorios", "error");
        return;
      }

      if (pdvActivo.id) {
        await updatePdvBelkin(pdvActivo.id, pdvActivo);
        mostrarToast("PDV actualizado correctamente");
      } else {
        await createPdvBelkin(pdvActivo);
        mostrarToast("PDV creado correctamente");
      }

      cerrarModal();
      cargarPdvs();
    } catch (err) {
      console.error(err);
      mostrarToast("Error al guardar PDV", "error");
    }
  };

  const eliminarPdv = async (id, nombre) => {
    if (!window.confirm(`Â¿Eliminar PDV "${nombre}"?`)) return;

    try {
      await deletePdvBelkin(id);
      mostrarToast("PDV eliminado");
      setSelectedIds((prev) => {
        const c = new Set(prev);
        c.delete(id);
        return c;
      });
      cargarPdvs();
    } catch (err) {
      console.error(err);
      mostrarToast("Error eliminando PDV", "error");
    }
  };

  const pdvsFiltrados = pdvs.filter((p) =>
    Object.values(p).join(" ").toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalPages = Math.ceil(pdvsFiltrados.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const pdvsPaginados = pdvsFiltrados.slice(startIndex, endIndex);

  const exportar = async () => {
    try {
      const response = await exportPdvBelkin();
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `pdv_belkin_${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      mostrarToast("PDV exportados");
    } catch {
      mostrarToast("Error exportando", "error");
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      await bulkImportPdvBelkin(file);
      mostrarToast("Importacion completada");
      cargarPdvs();
    } catch (err) {
      mostrarToast(err.message, "error");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleBulkUpdateExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const res = await bulkUpdatePdvBelkinExcel(file);
      mostrarToast(`Actualizados: ${res.updated}`);
      cargarPdvs();
    } catch (err) {
      mostrarToast(err.message, "error");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      mostrarToast("Selecciona al menos un PDV", "error");
      return;
    }

    if (!window.confirm(`Eliminar ${selectedIds.size} PDV?`)) return;

    try {
      await bulkDeletePdvBelkin(Array.from(selectedIds));
      mostrarToast("PDV eliminados");
      setSelectedIds(new Set());
      setSelectAll(false);
      cargarPdvs();
    } catch {
      mostrarToast("Error eliminacion masiva", "error");
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const c = new Set(prev);
      c.has(id) ? c.delete(id) : c.add(id);
      setSelectAll(false);
      return c;
    });
  };

  const handleSelectAllToggle = () => {
    if (selectAll) {
      setSelectedIds(new Set());
      setSelectAll(false);
    } else {
      setSelectedIds(new Set(pdvsFiltrados.map((p) => p.id_registro)));
      setSelectAll(true);
    }
  };

  const handleInputChange = (field, value) => {
    setPdvActivo((prev) => ({ ...prev, [field]: value }));
  };

  const formFields = [
    { key: "ean_pdv", label: "EAN PDV", required: true },
    { key: "punto_venta", label: "Punto de Venta", required: true },
    { key: "cliente_canal", label: "Cliente / Canal", required: false },
  ];

  return (
    <div className="crudpdvbelkin_container">
      <h2 className="crudpdvbelkin_title">PDV Belkin</h2>

    <div className="Crudventasbelkin_nav_wrapper" ref={menuRef}>
  <button
    className="Crudventasbelkin_nav_btn"
    onClick={() => setMenuOpen((p) => !p)}
  >
    Menú
  </button>

  {menuOpen && (
    <div className="Crudventasbelkin_nav_menu">

    <button onClick={() => navigate("/DashboardsummaryBelkin")}>
        Dashboard Ventas
      </button>

      <button onClick={() => navigate("/VentasBelkin")}>
        Ventas
      </button>

      <button onClick={() => navigate("/ProductosBelkin")}>
        Productos
      </button>

      <button onClick={() => navigate("/InventariosBelkin")}>
        Inventarios
      </button>
    </div>
  )}
</div>




      <div className="crudpdvbelkin_actions">
        <input
          className="crudpdvbelkin_search"
          placeholder="Buscar..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <button onClick={() => abrirModal()} className="crudpdvbelkin_btn">
          Nuevo PDV
        </button>

        <button onClick={() => fileInputRef.current.click()} className="crudpdvbelkin_btn">
          Importar
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        <button onClick={() => fileUpdateRef.current.click()} className="crudpdvbelkin_btn">
          Actualizar por Excel
        </button>

        <input
          ref={fileUpdateRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: "none" }}
          onChange={handleBulkUpdateExcel}
        />

        <button onClick={handleBulkDelete} className="crudpdvbelkin_btn btn-danger">
          Eliminar seleccionados
        </button>

        <button onClick={exportar} className="crudpdvbelkin_btn btn-exportar">
          Exportar
        </button>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div className="crudpdvbelkin_table_wrapper">
          <table className="crudpdvbelkin_table">
            <thead>
              <tr>
                <th>
                  <input type="checkbox" checked={selectAll} onChange={handleSelectAllToggle} />
                </th>
                <th>EAN PDV</th>
                <th>Punto de Venta</th>
                <th>Cliente / Canal</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pdvsPaginados.length ? (
                pdvsPaginados.map((p) => (
                  <tr key={p.id_registro}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(p.id_registro)}
                        onChange={() => handleToggleSelect(p.id_registro)}
                      />
                    </td>
                    <td>{p.ean_pdv}</td>
                    <td>{p.punto_venta}</td>
                    <td>{p.cliente_canal || "-"}</td>
                    <td>
                      <button onClick={() => abrirModal(p)}>Editar</button>
                      <button onClick={() => eliminarPdv(p.id, p.punto_venta)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">
                    <EmptyState />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
<div className="crudpdvbelkin_pagination">
  <div className="pagination_left">
    <span>Mostrando</span>

    <select
      value={rowsPerPage}
      onChange={(e) => setRowsPerPage(Number(e.target.value))}
    >
      {[10, 25, 50, 80, 100].map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>

    <span>
      de <strong>{pdvsFiltrados.length}</strong> registros
    </span>
  </div>

  <div className="pagination_right">
    <button
      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
      disabled={currentPage === 1}
    >
      â† Anterior
    </button>

    <span className="pagination_page">
      Pagina <strong>{currentPage}</strong> de{" "}
      <strong>{totalPages}</strong>
    </span>

    <button
      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
      disabled={currentPage === totalPages}
    >
      Siguiente â†’
    </button>
  </div>
</div>


        </div>
      )}

      {modalOpen && (
        <div className="crudpdvbelkin_modal" onClick={cerrarModal}>
          <div className="crudpdvbelkin_modal_content" onClick={(e) => e.stopPropagation()}>
            <h3>{pdvActivo?.id ? "Editar PDV" : "Nuevo PDV"}</h3>
            <button className="crudpdvbelkin_modal_close" onClick={cerrarModal}>âœ•</button>

            {formFields.map((f) => (
              <div key={f.key} className="crudpdvbelkin_form_group">
                <label>{f.label}</label>
                <input
                  value={pdvActivo?.[f.key] || ""}
                  onChange={(e) => handleInputChange(f.key, e.target.value)}
                />
              </div>
            ))}

            <div className="crudpdvbelkin_modal_actions">
              <button onClick={guardarPdv}>Guardar</button>
              <button onClick={cerrarModal}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}


