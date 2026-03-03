import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getVentasBelkin,
  createVentasBelkin,
  updateVentasBelkin,
  deleteVentasBelkin,
  exportVentasBelkin,
  bulkImportVentasBelkin,
  bulkUpdateVentasBelkinExcel,
  bulkDeleteVentasBelkin,
} from "../../../api/DashboardsCrudApis/Crudventasbelkin";

import "../../../styles/CrudDashboard/Crudventasbelkin.css";

// ============================
// ESTRUCTURA INICIAL
// ============================
const VENTA_INICIAL = {
  fecha_venta: "",
  canal_cliente: "",
  punto_venta: "",
  categoria: "",
  marca: "",
  producto: "",
  precio_unitario_venta: "",
  cantidad: "",
  total_ventas: "",
};

// ============================
// TOAST
// ============================
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`Crudventasbelkin_toast ${type}`}>
      <span style={{ fontSize: "20px" }}>
        {type === "success" ? "âœ“" : "âš "}
      </span>
      <span>{message}</span>
    </div>
  );
};

// ============================
// LOADING
// ============================
const Loading = () => (
  <div className="Crudventasbelkin_loading">
    <div className="Crudventasbelkin_spinner"></div>
    <p>Cargando ventas...</p>
  </div>
);

// ============================
// EMPTY
// ============================
const EmptyState = () => (
  <div className="Crudventasbelkin_empty">
    <p>No se encontraron ventas</p>
    <p style={{ fontSize: 14, marginTop: 8 }}>
      Agrega tu primera venta o ajusta los filtros
    </p>
  </div>
);

export default function Crudventasbelkin() {
  const [ventas, setVentas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [ventaActiva, setVentaActiva] = useState(null);
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
    cargarVentas();
  }, [busqueda, fechaDesde, fechaHasta, rowsPerPage]);
  useEffect(() => {
    cargarVentas(1);
  }, [busqueda, fechaDesde, fechaHasta, rowsPerPage]);


  useEffect(() => {
  const handleClickOutside = (e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setMenuOpen(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);


  const cargarVentas = async () => {
    try {
      setLoading(true);
      const data = await getVentasBelkin();
      setVentas(data);
    } catch (e) {
      mostrarToast("Error cargando ventas", "error");
    } finally {
      setLoading(false);
    }
  };

  const mostrarToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const abrirModal = (venta = null) => {
    setVentaActiva(venta ? { ...venta } : { ...VENTA_INICIAL });
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setVentaActiva(null);
    setModalOpen(false);
  };

  const guardarVenta = async () => {
    try {
      if (!ventaActiva.producto || !ventaActiva.fecha_venta) {
        mostrarToast("Completa los campos obligatorios", "error");
        return;
      }

      if (ventaActiva.id) {
        await updateVentasBelkin(ventaActiva.id, ventaActiva);
        mostrarToast("Venta actualizada", "success");
      } else {
        await createVentasBelkin(ventaActiva);
        mostrarToast("Venta creada", "success");
      }

      cerrarModal();
      cargarVentas();
    } catch (e) {
      mostrarToast("Error guardando venta", "error");
    }
  };

  const eliminarVenta = async (id) => {
    if (!window.confirm("Â¿Eliminar esta venta?")) return;
    try {
      await deleteVentasBelkin(id);
      mostrarToast("Venta eliminada", "success");
      cargarVentas();
    } catch {
      mostrarToast("Error eliminando venta", "error");
    }
  };

  const ventasFiltradas = ventas.filter((v) => {
  const textoMatch = Object.values(v)
    .join(" ")
    .toLowerCase()
    .includes(busqueda.toLowerCase());

  const fechaVenta = new Date(v.fecha_venta);

  const desdeOk = fechaDesde
    ? fechaVenta >= new Date(fechaDesde)
    : true;

  const hastaOk = fechaHasta
    ? fechaVenta <= new Date(fechaHasta)
    : true;

  return textoMatch && desdeOk && hastaOk;
});

  const totalPages = Math.ceil(ventasFiltradas.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const ventasPaginadas = ventasFiltradas.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  const exportar = async () => {
    try {
      const response = await exportVentasBelkin();
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `ventas_belkin_${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      mostrarToast("Ventas exportadas", "success");
    } catch {
      mostrarToast("Error exportando ventas", "error");
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      await bulkImportVentasBelkin(file);
      mostrarToast("Importacion completada", "success");
      cargarVentas();
    } catch (e) {
      mostrarToast("Error importando ventas", "error");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      mostrarToast("Selecciona ventas", "error");
      return;
    }
    try {
      await bulkDeleteVentasBelkin(Array.from(selectedIds));
      mostrarToast("Ventas eliminadas", "success");
      setSelectedIds(new Set());
      setSelectAll(false);
      cargarVentas();
    } catch {
      mostrarToast("Error eliminacion masiva", "error");
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      copy.has(id) ? copy.delete(id) : copy.add(id);
      return copy;
    });
  };

  const handleSelectAllToggle = () => {
    if (selectAll) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(ventasFiltradas.map((v) => v.id_registro)));
    }
    setSelectAll(!selectAll);
  };

  const handleInputChange = (field, value) => {
    setVentaActiva((prev) => ({ ...prev, [field]: value }));
  };

  const formFields = [
    { key: "fecha_venta", label: "Fecha Venta", type: "date" },
    { key: "canal_cliente", label: "Canal" },
    { key: "punto_venta", label: "Punto de Venta" },
    { key: "categoria", label: "Categoria" },
    { key: "marca", label: "Marca" },
    { key: "producto", label: "Producto" },
    { key: "precio_unitario_venta", label: "Precio Unitario" },
    { key: "cantidad", label: "Cantidad" },
    { key: "total_ventas", label: "Total Ventas" },
  ];


  return (
    <div className="Crudventasbelkin_container">
      <h2 className="Crudventasbelkin_title">Ventas Belkin</h2>

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

      <button onClick={() => navigate("/ProductosBelkin")}>
        Productos
      </button>

      <button onClick={() => navigate("/PdvBelkin")}>
        Puntos de Venta
      </button>

      <button onClick={() => navigate("/InventariosBelkin")}>
        Inventarios
      </button>
    </div>
  )}
</div>


      <div className="Crudventasbelkin_actions">
        <input
          className="Crudventasbelkin_search"
          placeholder="Buscar..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        
        <input
  type="date"
  className="Crudventasbelkin_date"
  value={fechaDesde}
  onChange={(e) => setFechaDesde(e.target.value)}
/>

<input
  type="date"
  className="Crudventasbelkin_date"
  value={fechaHasta}
  onChange={(e) => setFechaHasta(e.target.value)}
/>

        <button onClick={() => abrirModal()} className="Crudventasbelkin_btn">
          Nueva Venta
        </button>

        <button onClick={() => fileInputRef.current.click()} className="Crudventasbelkin_btn">
          Importar
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        <button onClick={handleBulkDelete} className="Crudventasbelkin_btn btn-danger">
          Eliminar seleccionadas
        </button>

        <button onClick={exportar} className="Crudventasbelkin_btn btn-exportar">
          Exportar
        </button>

      </div>

      {loading ? (
        <Loading />
      ) : (
        <div className="Crudventasbelkin_table_wrapper">
          <table className="Crudventasbelkin_table">
            <thead>
              <tr>
                <th>
                  <input type="checkbox" checked={selectAll} onChange={handleSelectAllToggle} />
                </th>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Canal</th>
                <th>Cantidad</th>
                <th>Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ventasPaginadas.length ? (
                ventasPaginadas.map((v) => (
                  <tr key={v.id_registro}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(v.id_registro)}
                        onChange={() => handleToggleSelect(v.id_registro)}
                      />
                    </td>
                    <td>{v.fecha_venta}</td>
                    <td>{v.producto}</td>
                    <td>{v.canal_cliente}</td>
                    <td>{v.cantidad}</td>
                    <td>{v.total_ventas}</td>
                    <td>
                      <button onClick={() => abrirModal(v)}>Editar</button>
                      <button onClick={() => eliminarVenta(v.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">
                    <EmptyState />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
    <div className="Crudventasbelkin_pagination">
  <div>
    <span>Mostrar </span>
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
    <span> registros</span>
  </div>

  <div className="Crudventasbelkin_pagination_controls">
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
      onClick={() =>
        setCurrentPage((p) => Math.min(p + 1, totalPages))
      }
      disabled={currentPage === totalPages || totalPages === 0}
    >
      Siguiente
    </button>
  </div>
</div>

        </div>
      )}

      {modalOpen && (
        <div className="Crudventasbelkin_modal" onClick={cerrarModal}>
          <div className="Crudventasbelkin_modal_content" onClick={(e) => e.stopPropagation()}>
            <div className="Crudventasbelkin_modal_header">
              <h3>{ventaActiva?.id ? "Editar Venta" : "Nueva Venta"}</h3>
              <button className="Crudventasbelkin_modal_close" onClick={cerrarModal}>âœ•</button>
            </div>

            {formFields.map((f) => (
              <div key={f.key} className="Crudventasbelkin_form_group">
                <label>{f.label}</label>
                <input
                  type={f.type || "text"}
                  value={ventaActiva?.[f.key] || ""}
                  onChange={(e) => handleInputChange(f.key, e.target.value)}
                />
              </div>
            ))}

            <div className="Crudventasbelkin_modal_actions">
              <button onClick={guardarVenta}>Guardar</button>
              <button onClick={cerrarModal}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}


