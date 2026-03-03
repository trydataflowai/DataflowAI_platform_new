import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getInventariosBelkin,
  createInventarioBelkin,
  updateInventarioBelkin,
  deleteInventarioBelkin,
  exportInventariosBelkin,
  bulkImportInventariosBelkin,
  bulkUpdateInventariosBelkinExcel,
  bulkDeleteInventariosBelkin,
} from "../../../api/DashboardsCrudApis/Crudinventariosbelkin";

import "../../../styles/CrudDashboard/Crudinventariosbelkin.css";

// ==========================
// ESTRUCTURA INICIAL
// ==========================
const INVENTARIO_INICIAL = {
  fecha_inventario: "",
  ano: "",
  mes: "",
  canal_cliente: "",
  punto_venta: "",
  categoria: "",
  marca: "",
  producto: "",
  cantidad_inventario: "",
};

// ==========================
// TOAST
// ==========================
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`crudinventarios_belkin_toast ${type}`}>
      <span style={{ fontSize: "20px" }}>{type === "success" ? "âœ“" : "âš "}</span>
      <span>{message}</span>
    </div>
  );
};

// ==========================
// LOADING
// ==========================
const Loading = () => (
  <div className="crudinventarios_belkin_loading">
    <div className="crudinventarios_belkin_spinner"></div>
    <p style={{ color: "var(--text-secondary)" }}>
      Cargando inventarios...
    </p>
  </div>
);

// ==========================
// EMPTY
// ==========================
const EmptyState = () => (
  <div className="crudinventarios_belkin_empty">
    <p>No se encontraron inventarios</p>
    <p style={{ fontSize: "14px", marginTop: "8px" }}>
      Agrega tu primer inventario o ajusta los filtros
    </p>
  </div>
);

export default function Crudinventariosbelkin() {
  const [inventarios, setInventarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [inventarioActivo, setInventarioActivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // seleccion multiple
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // paginacion
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // refs
  const fileInputRef = useRef(null);
  const fileUpdateRef = useRef(null);

  const [menuOpen, setMenuOpen] = useState(false);
      const menuRef = useRef(null);
    
      const navigate = useNavigate();
    

  // ==========================
  // CARGA
  // ==========================
  useEffect(() => {
    cargarInventarios();
  }, [busqueda, rowsPerPage]);

  const cargarInventarios = async () => {
    try {
      setLoading(true);
      const data = await getInventariosBelkin();
      setInventarios(data);
    } catch (error) {
      console.error(error);
      mostrarToast("Error al cargar inventarios", "error");
    } finally {
      setLoading(false);
    }
  };

  const mostrarToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);


  useEffect(() => {
      const handleClickOutside = (e) => {
        if (menuRef.current && !menuRef.current.contains(e.target)) {
          setMenuOpen(false);
        }
      };
  
      
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ==========================
  // MODAL
  // ==========================
  const abrirModal = (inv = null) => {
    setInventarioActivo(inv ? { ...inv } : { ...INVENTARIO_INICIAL });
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setInventarioActivo(null);
    setModalOpen(false);
  };

  const guardarInventario = async () => {
    try {
      if (!inventarioActivo.producto || !inventarioActivo.fecha_inventario) {
        mostrarToast("Completa los campos requeridos", "error");
        return;
      }

      if (inventarioActivo.id) {
        await updateInventarioBelkin(inventarioActivo.id, inventarioActivo);
        mostrarToast("Inventario actualizado", "success");
      } else {
        await createInventarioBelkin(inventarioActivo);
        mostrarToast("Inventario creado", "success");
      }

      cerrarModal();
      cargarInventarios();
    } catch (err) {
      console.error(err);
      mostrarToast("Error al guardar inventario", "error");
    }
  };

  // ==========================
  // ELIMINAR
  // ==========================
  const eliminarInventario = async (id) => {
    if (!window.confirm("Â¿Eliminar este inventario?")) return;

    try {
      await deleteInventarioBelkin(id);
      mostrarToast("Inventario eliminado", "success");
      setSelectedIds((prev) => {
        const copy = new Set(prev);
        copy.delete(id);
        return copy;
      });
      cargarInventarios();
    } catch (err) {
      console.error(err);
      mostrarToast("Error al eliminar inventario", "error");
    }
  };

  // ==========================
  // FILTRADO + PAGINACION
  // ==========================
  const inventariosFiltrados = inventarios.filter((i) =>
    Object.values(i).join(" ").toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalRows = inventariosFiltrados.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const inventariosPaginados = inventariosFiltrados.slice(startIndex, endIndex);

  // ==========================
  // EXPORT
  // ==========================
  const exportar = async () => {
    try {
      const response = await exportInventariosBelkin();
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `inventarios_belkin_${new Date()
        .toISOString()
        .split("T")[0]}.xlsx`;
      a.click();

      window.URL.revokeObjectURL(url);
      mostrarToast("Inventarios exportados", "success");
    } catch (err) {
      console.error(err);
      mostrarToast("Error al exportar", "error");
    }
  };

  // ==========================
  // BULK
  // ==========================
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      await bulkImportInventariosBelkin(file);
      mostrarToast("Importacion masiva exitosa", "success");
      cargarInventarios();
    } catch (err) {
      console.error(err);
      mostrarToast("Error en importacion", "error");
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
      const res = await bulkUpdateInventariosBelkinExcel(file);
      mostrarToast(`Actualizados: ${res.updated}`, "success");
      cargarInventarios();
    } catch (err) {
      console.error(err);
      mostrarToast("Error en actualizacion masiva", "error");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      mostrarToast("Selecciona registros", "error");
      return;
    }

    if (!window.confirm(`Eliminar ${selectedIds.size} inventarios?`)) return;

    try {
      setLoading(true);
      await bulkDeleteInventariosBelkin(Array.from(selectedIds));
      mostrarToast("Inventarios eliminados", "success");
      setSelectedIds(new Set());
      setSelectAll(false);
      cargarInventarios();
    } catch (err) {
      console.error(err);
      mostrarToast("Error en eliminacion masiva", "error");
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // SELECCION
  // ==========================
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      copy.has(id) ? copy.delete(id) : copy.add(id);
      setSelectAll(false);
      return copy;
    });
  };

  const handleSelectAllToggle = () => {
    if (selectAll) {
      setSelectedIds(new Set());
      setSelectAll(false);
    } else {
      setSelectedIds(new Set(inventariosFiltrados.map((i) => i.id_registro)));
      setSelectAll(true);
    }
  };

  // ==========================
  // FORM
  // ==========================
  const handleInputChange = (field, value) => {
    setInventarioActivo((prev) => ({ ...prev, [field]: value }));
  };

  const formFields = [
    { key: "fecha_inventario", label: "Fecha Inventario", type: "date" },
    { key: "ano", label: "Ano" },
    { key: "mes", label: "Mes" },
    { key: "canal_cliente", label: "Canal Cliente" },
    { key: "punto_venta", label: "Punto de Venta" },
    { key: "categoria", label: "Categoria" },
    { key: "marca", label: "Marca" },
    { key: "producto", label: "Producto" },
    { key: "cantidad_inventario", label: "Cantidad", type: "number" },
  ];

  return (
    <div className="crudinventarios_belkin_container">
      <h2 className="crudinventarios_belkin_title">Inventarios Belkin</h2>

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

      <button onClick={() => navigate("/PdvBelkin")}>
        Puntos de Venta
      </button>
    </div>
  )}
</div>



      {/* ACTIONS */}
      <div className="crudinventarios_belkin_actions">
        <input
          className="crudinventarios_belkin_search"
          placeholder="Buscar..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <button onClick={() => abrirModal()} className="crudinventarios_belkin_btn">
          Nuevo Inventario
        </button>

        <button onClick={() => fileInputRef.current.click()} className="crudinventarios_belkin_btn">
          Importar
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        <button onClick={() => fileUpdateRef.current.click()} className="crudinventarios_belkin_btn">
          Actualizar por Excel
        </button>

        <input
          ref={fileUpdateRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: "none" }}
          onChange={handleBulkUpdateExcel}
        />

        <button onClick={handleBulkDelete} className="crudinventarios_belkin_btn btn-danger">
          Eliminar seleccionados
        </button>

        <button onClick={exportar} className="crudinventarios_belkin_btn btn-exportar">
          Exportar
        </button>
      </div>

      {/* TABLA */}
      {loading ? (
        <Loading />
      ) : (
        <div className="crudinventarios_belkin_table_wrapper">
          <table className="crudinventarios_belkin_table">
            <thead>
              <tr>
                <th>
                  <input type="checkbox" checked={selectAll} onChange={handleSelectAllToggle} />
                </th>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Marca</th>
                <th>Canal</th>
                <th>Punto Venta</th>
                <th>Cantidad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {inventariosPaginados.length ? (
                inventariosPaginados.map((i) => (
                  <tr key={i.id_registro}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(i.id_registro)}
                        onChange={() => handleToggleSelect(i.id_registro)}
                      />
                    </td>
                    <td>{i.fecha_inventario}</td>
                    <td>{i.producto}</td>
                    <td>{i.marca}</td>
                    <td>{i.canal_cliente}</td>
                    <td>{i.punto_venta}</td>
                    <td>{i.cantidad_inventario}</td>
                    <td>
                      <button onClick={() => abrirModal(i)}>Editar</button>
                      <button onClick={() => eliminarInventario(i.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8">
                    <EmptyState />
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* PAGINADOR */}
          <div className="crudinventarios_belkin_pagination">
            <div>
              Mostrar{" "}
              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
              >
                {[10, 25, 50, 80, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>{" "}
              registros
            </div>

            <div>
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </button>

              <span>
                Pagina {currentPage} de {totalPages || 1}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL */}
      {modalOpen && (
        <div className="crudinventarios_belkin_modal" onClick={cerrarModal}>
          <div
            className="crudinventarios_belkin_modal_content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="crudinventarios_belkin_modal_header">
              <h3>{inventarioActivo?.id ? "Editar Inventario" : "Nuevo Inventario"}</h3>
              <button className="crudinventarios_belkin_modal_close" onClick={cerrarModal}>
                âœ•
              </button>
            </div>

            {formFields.map((f) => (
              <div key={f.key} className="crudinventarios_belkin_form_group">
                <label>{f.label}</label>
                <input
                  type={f.type || "text"}
                  value={inventarioActivo?.[f.key] || ""}
                  onChange={(e) => handleInputChange(f.key, e.target.value)}
                />
              </div>
            ))}

            <div className="crudinventarios_belkin_modal_actions">
              <button onClick={guardarInventario}>Guardar</button>
              <button onClick={cerrarModal}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}


