import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getProductosBelkin,
  createProductoBelkin,
  updateProductoBelkin,
  deleteProductoBelkin,
  exportProductosBelkin,
  bulkImportProductosBelkin,
  bulkUpdateProductosBelkinExcel,
  bulkDeleteProductosBelkin,
} from "../../../api/DashboardsCrudApis/Crudproductosbelkin";

import "../../../styles/CrudDashboard/Crudproductosbelkin.css";

// Estructura inicial para un nuevo producto
const PRODUCTO_INICIAL = {
  ean: "",
  part_number: "",
  nombre_producto: "",
  marca: "",
  categoria: "",
  sku_suplidor: "",
};

// Toast
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`crudproductos_belkin_toast ${type}`}>
      <span style={{ fontSize: "20px" }}>
        {type === "success" ? "âœ“" : "âš "}
      </span>
      <span>{message}</span>
    </div>
  );
};

// Loading
const Loading = () => (
  <div className="crudproductos_belkin_loading">
    <div className="crudproductos_belkin_spinner"></div>
    <p style={{ color: "var(--text-secondary)" }}>Cargando productos...</p>
  </div>
);

// Empty
const EmptyState = () => (
  <div className="crudproductos_belkin_empty">
    <p>No se encontraron productos</p>
    <p style={{ fontSize: "14px", marginTop: "8px" }}>
      Agrega tu primer producto o ajusta los filtros de bÃºsqueda
    </p>
  </div>
);

export default function Crudproductosbelkin() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [modalOpen, setModalOpen] = useState(false); // para 1 registro
  const [bulkModalOpen, setBulkModalOpen] = useState(false); // para bulk update
  const [productoActivo, setProductoActivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // selecciÃ³n para bulk
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // campos para bulk update (vacios = ignorar)
  const [bulkFields, setBulkFields] = useState({
    ean: "",
    part_number: "",
    nombre_producto: "",
    marca: "",
    categoria: "",
    sku_suplidor: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);


  // ref para input file
  const fileInputRef = useRef(null);
  const fileUpdateRef = useRef(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const navigate = useNavigate();



  useEffect(() => {
    cargarProductos();
  }, [busqueda, rowsPerPage]);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const data = await getProductosBelkin();
      setProductos(data);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      mostrarToast("Error al cargar los productos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);
  

  const mostrarToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  // MODAL UNICO
  const abrirModal = useCallback((producto = null) => {
    setProductoActivo(producto ? { ...producto } : { ...PRODUCTO_INICIAL });
    setModalOpen(true);
  }, []);

  const cerrarModal = useCallback(() => {
    setProductoActivo(null);
    setModalOpen(false);
  }, []);

  const guardarProducto = async () => {
    try {
      if (!productoActivo.nombre_producto || !productoActivo.ean) {
        mostrarToast("Por favor completa los campos requeridos", "error");
        return;
      }
      if (productoActivo.id) {
        await updateProductoBelkin(productoActivo.id, productoActivo);
        mostrarToast("Producto actualizado exitosamente", "success");
      } else {
        await createProductoBelkin(productoActivo);
        mostrarToast("Producto creado exitosamente", "success");
      }
      cerrarModal();
      cargarProductos();
    } catch (error) {
      console.error("Error al guardar producto:", error);
      mostrarToast("Error al guardar el producto", "error");
    }
  };

  // ELIMINAR
  const eliminarProducto = async (id, nombreProducto) => {
    if (
      window.confirm(
        `Â¿EstÃ¡s seguro de eliminar "${nombreProducto}"?\n\nEsta acciÃ³n no se puede deshacer.`
      )
    ) {
      try {
        await deleteProductoBelkin(id);
        mostrarToast("Producto eliminado exitosamente", "success");
        // limpiar seleccion si estaba seleccionado
        setSelectedIds((prev) => {
          const copy = new Set(prev);
          copy.delete(id);
          return copy;
        });
        cargarProductos();
      } catch (error) {
        console.error("Error al eliminar producto:", error);
        mostrarToast("Error al eliminar el producto", "error");
      }
    }
  };

  // FILTRADO
  const productosFiltrados = productos.filter((p) =>
    Object.values(p)
      .join(" ")
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  const totalRows = productosFiltrados.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;

  const productosPaginados = productosFiltrados.slice(startIndex, endIndex);



  // EXPORTAR
  const exportar = async () => {
    try {
      const response = await exportProductosBelkin();
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `productos_belkin_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      mostrarToast("Productos exportados exitosamente", "success");
    } catch (error) {
      console.error("Error al exportar:", error);
      mostrarToast("Error al exportar los productos", "error");
    }
  };

  // ============================
  // BULK IMPORT
  // ============================
  const triggerFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      await bulkImportProductosBelkin(file);
      mostrarToast("Importacion masiva completada", "success");
      cargarProductos();
    } catch (error) {
      console.error("Error en bulk import:", error);
      mostrarToast(`Error importando: ${error.message || error}`, "error");
    } finally {
      setLoading(false);
      // limpiar input
      e.target.value = "";
    }
  };



  const handleBulkUpdateExcel = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    setLoading(true);
    const res = await bulkUpdateProductosBelkinExcel(file);
    mostrarToast(`Actualizados: ${res.updated}`, "success");
    cargarProductos();
  } catch (err) {
    console.error(err);
    mostrarToast(err.message || "Error en actualizacion masiva", "error");
  } finally {
    setLoading(false);
    e.target.value = "";
  }
};


const handleBulkDelete = async () => {
  if (selectedIds.size === 0) {
    mostrarToast("Selecciona al menos un producto", "error");
    return;
  }

  if (
    !window.confirm(
      `Â¿Eliminar ${selectedIds.size} productos?\n\nEsta accion NO se puede deshacer.`
    )
  ) {
    return;
  }

  try {
    setLoading(true);

    // Convertir Set -> Array
    const ids = Array.from(selectedIds);

    const res = await bulkDeleteProductosBelkin(ids);

    mostrarToast("Productos eliminados correctamente", "success");

    // limpiar estado
    setSelectedIds(new Set());
    setSelectAll(false);

    cargarProductos();
  } catch (err) {
    console.error(err);
    mostrarToast("Error en eliminacion masiva", "error");
  } finally {
    setLoading(false);
  }
};



  // ============================
  // SELECCION MULTIPLE (checkbox)
  // ============================
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      setSelectAll(false);
      return copy;
    });
  };

  const handleSelectAllToggle = () => {
    if (selectAll) {
      setSelectedIds(new Set());
      setSelectAll(false);
    } else {
      const allIds = productosFiltrados.map((p) => p.id_registro);
      setSelectedIds(new Set(allIds));
      setSelectAll(true);
    }
  };

  // ============================
  // BULK UPDATE
  // ============================
  const abrirBulkModal = () => {
    if (selectedIds.size === 0) {
      mostrarToast("Selecciona al menos un producto para actualizar", "error");
      return;
    }
    // resetear campos del bulk
    setBulkFields({
      ean: "",
      part_number: "",
      nombre_producto: "",
      marca: "",
      categoria: "",
      sku_suplidor: "",
    });
    setBulkModalOpen(true);
  };

  const cerrarBulkModal = () => {
    setBulkModalOpen(false);
  };

  const handleBulkFieldChange = (field, value) => {
    setBulkFields((prev) => ({ ...prev, [field]: value }));
  };

  
  // MANEJO FORM SINGLE
  const handleInputChange = (field, value) => {
    setProductoActivo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Campos del formulario con sus etiquetas
  const formFields = [
    { key: "ean", label: "EAN", required: true, placeholder: "Codigo EAN del producto" },
    { key: "part_number", label: "Part Number", required: true, placeholder: "Numero de parte" },
    { key: "nombre_producto", label: "Nombre del Producto", required: true, placeholder: "Nombre completo" },
    { key: "marca", label: "Marca", required: false, placeholder: "Marca del producto" },
    { key: "categoria", label: "Categoria", required: false, placeholder: "Categoria del producto" },
    { key: "sku_suplidor", label: "SKU Suplidor", required: false, placeholder: "SKU del suplidor" },
  ];

  return (
    <div className="crudproductos_belkin_container">
      {/* Titulo */}
      <h2 className="crudproductos_belkin_title">Productos Belkin</h2>

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

      <button onClick={() => navigate("/PdvBelkin")}>
        Puntos de Venta
      </button>

      <button onClick={() => navigate("/InventariosBelkin")}>
        Inventarios
      </button>
    </div>
  )}
</div>


      {/* Barra de acciones */}
      <div className="crudproductos_belkin_actions">
        <input
          className="crudproductos_belkin_search"
          placeholder="Buscar por cualquier campo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <button onClick={() => abrirModal()} className="crudproductos_belkin_btn btn-nuevo">
          Nuevo Producto
        </button>

        <button onClick={triggerFileInput} className="crudproductos_belkin_btn">
          Importar (masivo)
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        
        
        <button onClick={() => fileUpdateRef.current.click()}
          className="crudproductos_belkin_btn">
          
  Actualizar por Excel
</button>

<input
  ref={fileUpdateRef}
  type="file"
  accept=".xlsx,.xls,.csv"
  style={{ display: "none" }}
  onChange={handleBulkUpdateExcel}
/>

<button
  onClick={handleBulkDelete}
  className="crudproductos_belkin_btn btn-danger"
>
  Eliminar seleccionados
</button>





        <button onClick={exportar} className="crudproductos_belkin_btn btn-exportar">
          Exportar
        </button>
      </div>

      {/* Tabla */}
      {loading ? (
        <Loading />
      ) : (
        <div className="crudproductos_belkin_table_wrapper">
          <table className="crudproductos_belkin_table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAllToggle}
                    aria-label="Seleccionar todo"
                  />
                </th>
                <th>EAN</th>
                <th>Part Number</th>
                <th>Producto</th>
                <th>Marca</th>
                <th>Categoria</th>
                <th>SKU Suplidor</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.length > 0 ? (
                productosPaginados.map((p) => (
                  <tr key={p.id_registro}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(p.id_registro)}
                        onChange={() => handleToggleSelect(p.id_registro)}
                        aria-label={`Seleccionar ${p.nombre_producto}`}
                      />
                    </td>
                    <td>{p.ean || "-"}</td>
                    <td>{p.part_number || "-"}</td>
                    <td><strong>{p.nombre_producto || "-"}</strong></td>
                    <td>{p.marca || "-"}</td>
                    <td>{p.categoria || "-"}</td>
                    <td>{p.sku_suplidor || "-"}</td>
                    <td>
                      <button onClick={() => abrirModal(p)}>Editar</button>
                      <button onClick={() => eliminarProducto(p.id, p.nombre_producto)}>Eliminar</button>
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
          <div className="crudproductos_belkin_pagination">
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

  <div className="crudproductos_belkin_pagination_controls">
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

      {/* Modal para crear/editar producto (single) */}
      {modalOpen && (
        <div className="crudproductos_belkin_modal" onClick={cerrarModal}>
          <div className="crudproductos_belkin_modal_content" onClick={(e) => e.stopPropagation()}>
            <div className="crudproductos_belkin_modal_header">
              <h3>{productoActivo?.id ? "Editar Producto" : "Nuevo Producto"}</h3>
              <button className="crudproductos_belkin_modal_close" onClick={cerrarModal}>âœ•</button>
            </div>

            {formFields.map((field) => (
              <div key={field.key} className="crudproductos_belkin_form_group">
                <label className="crudproductos_belkin_form_label">
                  {field.label}
                  {field.required && <span style={{ color: "var(--accent-red)" }}> *</span>}
                </label>
                <input
                  type="text"
                  placeholder={field.placeholder}
                  value={productoActivo?.[field.key] || ""}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  required={field.required}
                />
              </div>
            ))}

            <div className="crudproductos_belkin_modal_actions">
              <button onClick={guardarProducto}>Guardar</button>
              <button onClick={cerrarModal}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para BULK UPDATE */}
      {bulkModalOpen && (
        <div className="crudproductos_belkin_modal" onClick={cerrarBulkModal}>
          <div className="crudproductos_belkin_modal_content" onClick={(e) => e.stopPropagation()}>
            <div className="crudproductos_belkin_modal_header">
              <h3>Actualizacion masiva ({selectedIds.size} seleccionados)</h3>
              <button className="crudproductos_belkin_modal_close" onClick={cerrarBulkModal}>âœ•</button>
            </div>

            <p style={{ color: "var(--text-tertiary)", marginTop: 4 }}>
              Completa solo los campos que quieres aplicar a los registros seleccionados.
            </p>

            {formFields.map((field) => (
              <div key={field.key} className="crudproductos_belkin_form_group">
                <label className="crudproductos_belkin_form_label">{field.label}</label>
                <input
                  type="text"
                  placeholder={`(opcional) ${field.placeholder}`}
                  value={bulkFields[field.key] || ""}
                  onChange={(e) => handleBulkFieldChange(field.key, e.target.value)}
                />
              </div>
            ))}

            <div className="crudproductos_belkin_modal_actions">
              <button onClick={enviarBulkUpdate}>Aplicar cambios</button>
              <button onClick={cerrarBulkModal}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}


