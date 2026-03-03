import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BLUETTI_MODULE_LINKS } from "../../../constants/moduleMenus";
import {
  getInventariosBluetti,
  createInventarioBluetti,
  updateInventarioBluetti,
  deleteInventarioBluetti,
  exportInventariosBluetti,
  exportTemplateInventariosBluetti,
  bulkImportInventariosBluetti,
  bulkUpdateInventariosBluettiExcel,
  bulkDeleteInventariosBluetti,
  getCuentasClientesBluetti,
  getCanalesBluetti,
} from "../../../api/DashboardsCrudApis/Crudinventariosbluetti";

import "../../../styles/CrudDashboard/CrudBluetti.css";

const INVENTARIO_INICIAL = {
  fecha_inventario: "",
  cantidad_disponible: 0,
  cantidad_reservada: 0,
  pais: "",
  canal: null,
  cliente: null,
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

const Loading = ({ text = "Cargando inventarios..." }) => (
  <div className="CrudBluetti_loading">
    <div className="CrudBluetti_spinner" />
    <p style={{ color: "var(--text-secondary)" }}>{text}</p>
  </div>
);

const EmptyState = ({ title = "No hay inventario" }) => (
  <div className="CrudBluetti_empty">
    <p>{title}</p>
  </div>
);

const normalizarIdRelacion = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "object") return value.id_registro ?? value.id ?? null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export default function Crudinventariosbluetti() {
  const [items, setItems] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [clientesMap, setClientesMap] = useState({});
  const [clientesCanalMap, setClientesCanalMap] = useState({});
  const [clientesPaisMap, setClientesPaisMap] = useState({});
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

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const getCanalIdFromCliente = useCallback(
    (clienteIdRaw) => {
      const clienteId = normalizarIdRelacion(clienteIdRaw);
      if (!clienteId) return null;

      const cliente = clientes.find((c) => {
        const id = normalizarIdRelacion(c.id_registro ?? c.id);
        return id === clienteId;
      });

      if (!cliente) return null;
      return normalizarIdRelacion(
        cliente.canal ??
        cliente.canal_id ??
        cliente.id_canal ??
        clientesCanalMap[clienteId]
      );
    },
    [clientes, clientesCanalMap]
  );

  const getPaisFromCliente = useCallback(
    (clienteIdRaw) => {
      const clienteId = normalizarIdRelacion(clienteIdRaw);
      if (!clienteId) return "";

      const cliente = clientes.find((c) => {
        const id = normalizarIdRelacion(c.id_registro ?? c.id);
        return id === clienteId;
      });

      if (!cliente) return "";
      return (cliente.pais ?? clientesPaisMap[clienteId] ?? "").toString().trim();
    },
    [clientes, clientesPaisMap]
  );

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getInventariosBluetti();
      const list = Array.isArray(data) ? data : [];

      const normalizados = list.map((item) => {
        const clienteId = normalizarIdRelacion(item.cliente);
        const canalId = normalizarIdRelacion(item.canal);

        const clienteNombreDesdeObjeto =
          typeof item.cliente === "object"
            ? item.cliente?.nombre_cliente ?? item.cliente?.nombre
            : null;

        const canalNombreDesdeObjeto =
          typeof item.canal === "object"
            ? item.canal?.nombre_canal ?? item.canal?.nombre
            : null;

        return {
          ...item,
          cliente: clienteId,
          canal: canalId,
          cliente_nombre:
            item.cliente_nombre ??
            clientesMap[clienteId] ??
            clienteNombreDesdeObjeto ??
            (clienteId ? `Cliente ${clienteId}` : "-"),
          canal_nombre:
            item.canal_nombre ??
            canalesMap[canalId] ??
            canalNombreDesdeObjeto ??
            (canalId ? `Canal ${canalId}` : "-"),
        };
      });

      setItems(normalizados);
    } catch (err) {
      console.error(err);
      showToast("Error cargando inventarios", "error");
    } finally {
      setLoading(false);
    }
  }, [canalesMap, clientesMap, showToast]);

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [clientesData, canalesData] = await Promise.all([
          getCuentasClientesBluetti(),
          getCanalesBluetti(),
        ]);

        const clientesList = Array.isArray(clientesData) ? clientesData : [];
        const canalesList = Array.isArray(canalesData) ? canalesData : [];

        setClientes(clientesList);
        setCanales(canalesList);

        const clientesNombre = {};
        const clienteCanal = {};
        const clientePais = {};
        clientesList.forEach((c) => {
          const key = normalizarIdRelacion(c.id_registro ?? c.id);
          if (!key) return;
          clientesNombre[key] = c.nombre_cliente ?? c.nombre ?? `Cliente ${key}`;
          clienteCanal[key] = normalizarIdRelacion(c.canal);
          clientePais[key] = (c.pais ?? "").toString().trim();
        });

        const canalesNombre = {};
        canalesList.forEach((c) => {
          const key = normalizarIdRelacion(c.id_registro ?? c.id);
          if (!key) return;
          canalesNombre[key] = c.nombre_canal ?? c.nombre ?? `Canal ${key}`;
        });

        setClientesMap(clientesNombre);
        setClientesCanalMap(clienteCanal);
        setClientesPaisMap(clientePais);
        setCanalesMap(canalesNombre);
      } catch (err) {
        console.error(err);
        showToast("Error cargando clientes/canales", "error");
      }
    };

    cargarCatalogos();
  }, [showToast]);

  useEffect(() => {
    cargar();
  }, [rowsPerPage, cargar]);

  useEffect(() => {
    const onOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  useEffect(() => {
    if (!items.length) return;
    setItems((prev) =>
      prev.map((item) => {
        const clienteId = normalizarIdRelacion(item.cliente);
        const canalId = normalizarIdRelacion(item.canal);

        return {
          ...item,
          cliente_nombre:
            clientesMap[clienteId] ??
            item.cliente_nombre ??
            (clienteId ? `Cliente ${clienteId}` : "-"),
          canal_nombre:
            canalesMap[canalId] ??
            item.canal_nombre ??
            (canalId ? `Canal ${canalId}` : "-"),
        };
      })
    );
  }, [clientesMap, canalesMap]);

  const openModal = useCallback((item = null) => {
    if (!item) {
      setActive({ ...INVENTARIO_INICIAL });
      setModalOpen(true);
      return;
    }

    setActive({
      ...item,
      cliente: normalizarIdRelacion(item.cliente),
      canal: normalizarIdRelacion(item.canal),
    });
    setModalOpen(true);
  }, []);

  const closeModal = () => {
    setActive(null);
    setModalOpen(false);
  };

  const save = async () => {
    try {
      if (!active?.fecha_inventario) {
        showToast("Fecha de inventario requerida", "error");
        return;
      }

      const clienteId = normalizarIdRelacion(active.cliente);
      const clienteExiste = clientes.some((c) => {
        const id = normalizarIdRelacion(c.id_registro ?? c.id);
        return id === clienteId;
      });

      if (!clienteId || !clienteExiste) {
        showToast("Debes seleccionar un cliente existente", "error");
        return;
      }

      const canalRelacionado = getCanalIdFromCliente(clienteId);
      const paisRelacionado = getPaisFromCliente(clienteId);

      if (!canalRelacionado) {
        showToast("El cliente seleccionado no tiene canal asociado", "error");
        return;
      }

      if (!paisRelacionado) {
        showToast("El cliente seleccionado no tiene pais asociado", "error");
        return;
      }

      const payload = {
        ...active,
        cliente: clienteId,
        canal: canalRelacionado,
        pais: paisRelacionado,
      };

      if (payload.fecha_inventario) {
        const [ano, mes] = String(payload.fecha_inventario)
          .split("T")[0]
          .split("-");
        payload.ano = Number(ano);
        payload.mes = Number(mes);
      }

      setLoading(true);
      if (active.id) {
        await updateInventarioBluetti(active.id, payload);
        showToast("Inventario actualizado", "success");
      } else {
        await createInventarioBluetti(payload);
        showToast("Inventario creado", "success");
      }
      closeModal();
      await cargar();
    } catch (err) {
      console.error(err);
      showToast("Error guardando inventario", "error");
    } finally {
      setLoading(false);
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm("Eliminar registro de inventario?")) return;
    try {
      setLoading(true);
      await deleteInventarioBluetti(id);
      showToast("Inventario eliminado", "success");
      await cargar();
    } catch (err) {
      console.error(err);
      showToast("Error eliminando", "error");
    } finally {
      setLoading(false);
    }
  };

  const filtered = items.filter((p) =>
    Object.values(p).join(" ").toLowerCase().includes(busqueda.toLowerCase())
  );
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
    if (key === "fecha_inventario") return (p.fecha_inventario ? String(p.fecha_inventario).split("T")[0] : "");
    if (key === "canal") return p.canal_nombre ?? canalesMap[p.canal] ?? (p.canal ?? "");
    if (key === "cliente") return p.cliente_nombre ?? clientesMap[p.cliente] ?? (p.cliente ?? "");
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
  const paged = sorted.slice(
    (currentPage - 1) * rowsPerPage,
    (currentPage - 1) * rowsPerPage + rowsPerPage
  );

  const exportar = async () => {
    try {
      const res = await exportInventariosBluetti();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inventarios_bluetti_${new Date().toISOString().split("T")[0]}.xlsx`;
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
      const res = await exportTemplateInventariosBluetti();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "plantilla_inventarios_bluetti.xlsx";
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
      const res = await bulkUpdateInventariosBluettiExcel(file);
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
      const res = await bulkImportInventariosBluetti(file);
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
    if (!window.confirm(`Eliminar ${selectedIds.size} inventarios?`)) return;
    try {
      setLoading(true);
      await bulkDeleteInventariosBluetti(Array.from(selectedIds));
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
    setSortConfig((prev) => (prev.key === key ? { key, direction: prev.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" }));
  };

  const handleInput = (field, value) => {
    setActive((prev) => ({ ...prev, [field]: value }));
  };

  const handleClienteChange = (value) => {
    const clienteId = value ? Number(value) : null;
    const canalPorDefecto = getCanalIdFromCliente(clienteId);
    const paisPorDefecto = getPaisFromCliente(clienteId);

    setActive((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        cliente: clienteId,
        canal: canalPorDefecto,
        pais: paisPorDefecto,
      };
    });
  };

  useEffect(() => {
    if (!active?.cliente) return;
    const canalRelacionado = getCanalIdFromCliente(active.cliente);
    if (!canalRelacionado) return;
    if (normalizarIdRelacion(active.canal) === normalizarIdRelacion(canalRelacionado)) return;

    setActive((prev) => {
      if (!prev) return prev;
      return { ...prev, canal: canalRelacionado };
    });
  }, [active?.cliente, clientes, clientesCanalMap, getCanalIdFromCliente]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!active?.cliente) return;
    const paisRelacionado = getPaisFromCliente(active.cliente);
    if (!paisRelacionado) return;
    if ((active.pais ?? "").toString().trim() === paisRelacionado) return;

    setActive((prev) => {
      if (!prev) return prev;
      return { ...prev, pais: paisRelacionado };
    });
  }, [active?.cliente, clientes, clientesPaisMap, getPaisFromCliente]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="CrudBluetti_container">
      <h2 className="CrudBluetti_title">Inventarios Bluetti</h2>

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
        <input
          className="CrudBluetti_search"
          placeholder="Buscar..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <button onClick={() => openModal()} className="CrudBluetti_btn btn-nuevo">Nuevo</button>
        <button onClick={exportarPlantilla} className="CrudBluetti_btn">Plantilla para Importar nuevos Registros</button>
        <button onClick={() => fileInputRef.current?.click()} className="CrudBluetti_btn">
          Importar (masivo)
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: "none" }}
          onChange={handleFileImport}
        />
        <button onClick={() => fileUpdateRef.current.click()} className="CrudBluetti_btn">
          Actualizar por Excel
        </button>
        <input
          ref={fileUpdateRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: "none" }}
          onChange={handleFileUpdate}
        />
        <button onClick={exportar} className="CrudBluetti_btn btn-exportar">Exportar</button>
        <button onClick={handleBulkDelete} className="CrudBluetti_btn btn-danger">
          Eliminar seleccionados
        </button>
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
                <th><button type="button" className="CrudBluetti_th_btn" onClick={() => toggleSort("fecha_inventario")}>Fecha <span>{sortIndicator("fecha_inventario")}</span></button></th>
                <th><button type="button" className="CrudBluetti_th_btn" onClick={() => toggleSort("canal")}>Canal <span>{sortIndicator("canal")}</span></button></th>
                <th><button type="button" className="CrudBluetti_th_btn" onClick={() => toggleSort("cliente")}>Cliente <span>{sortIndicator("cliente")}</span></button></th>
                <th><button type="button" className="CrudBluetti_th_btn" onClick={() => toggleSort("pais")}>Pais <span>{sortIndicator("pais")}</span></button></th>
                <th><button type="button" className="CrudBluetti_th_btn" onClick={() => toggleSort("cantidad_disponible")}>Cantidad <span>{sortIndicator("cantidad_disponible")}</span></button></th>
                <th><button type="button" className="CrudBluetti_th_btn" onClick={() => toggleSort("cantidad_reservada")}>Reservada <span>{sortIndicator("cantidad_reservada")}</span></button></th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length > 0 ? (
                paged.map((p) => (
                  <tr key={p.id_registro || p.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(p.id_registro || p.id)}
                        onChange={() => toggleSelect(p.id_registro || p.id)}
                      />
                    </td>
                    <td>{p.fecha_inventario || "-"}</td>
                    <td>{p.canal_nombre ?? canalesMap[p.canal] ?? (p.canal || "-")}</td>
                    <td>{p.cliente_nombre ?? clientesMap[p.cliente] ?? (p.cliente || "-")}</td>
                    <td>{p.pais || "-"}</td>
                    <td>{p.cantidad_disponible ?? "-"}</td>
                    <td>{p.cantidad_reservada ?? "-"}</td>
                    <td>
                      <button onClick={() => openModal(p)}>Editar</button>
                      <button onClick={() => eliminar(p.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8">
                    <EmptyState title="No se encontraron inventarios" />
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
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </button>
              <span>Pagina {currentPage} de {totalPages}</span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="CrudBluetti_modal" onClick={closeModal}>
          <div className="CrudBluetti_modal_content" onClick={(e) => e.stopPropagation()}>
            <div className="CrudBluetti_modal_header">
              <h3>{active?.id ? "Editar Inventario" : "Nuevo Inventario"}</h3>
              <button className="CrudBluetti_modal_close" onClick={closeModal}>X</button>
            </div>

            <div className="CrudBluetti_form_group">
              <label className="CrudBluetti_form_label">Fecha</label>
              <input
                type="date"
                value={active?.fecha_inventario ? active.fecha_inventario.split("T")[0] : ""}
                onChange={(e) => handleInput("fecha_inventario", e.target.value)}
              />
            </div>

            <div className="CrudBluetti_form_group">
              <label className="CrudBluetti_form_label">Cliente</label>
              <select
                value={active?.cliente ?? ""}
                required
                onChange={(e) => handleClienteChange(e.target.value)}
              >
                <option value="">(Seleccionar cliente)</option>
                {clientes.map((c) => {
                  const key = c.id_registro ?? c.id;
                  return (
                    <option key={key} value={key}>
                      {c.nombre_cliente ?? c.nombre}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="CrudBluetti_form_group">
              <label className="CrudBluetti_form_label">Canal asignado</label>
              <input
                type="text"
                value={
                  active?.cliente
                    ? canalesMap[getCanalIdFromCliente(active.cliente)] ?? "-"
                    : "-"
                }
                readOnly
              />
            </div>

            <div className="CrudBluetti_form_group">
              <label className="CrudBluetti_form_label">Pais asignado</label>
              <input
                type="text"
                value={active?.cliente ? getPaisFromCliente(active.cliente) || "-" : "-"}
                readOnly
              />
            </div>

            <div className="CrudBluetti_form_group">
              <label className="CrudBluetti_form_label">Cantidad disponible</label>
              <input
                type="number"
                value={active?.cantidad_disponible || 0}
                onChange={(e) => handleInput("cantidad_disponible", Number(e.target.value))}
              />
            </div>

            <div className="CrudBluetti_form_group">
              <label className="CrudBluetti_form_label">Cantidad reservada</label>
              <input
                type="number"
                value={active?.cantidad_reservada || 0}
                onChange={(e) => handleInput("cantidad_reservada", Number(e.target.value))}
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




