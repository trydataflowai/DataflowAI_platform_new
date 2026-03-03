import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import {
  getVentasBelkin,
  getInventariosBelkin,
  getProductosBelkin,
  getPdvBelkin,
  filtrarVentas
} from "../../api/DashboardsApis/Dashboardsummarybelkin";


import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import "../../styles/Dashboards/Dashboardsummarybelkin.css";

export default function Dashboardsummarybelkin() {
  const [ventas, setVentas] = useState([]);
  const [inventarios, setInventarios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [pdv, setPdv] = useState([]);

  const [filtros, setFiltros] = useState({
    fechaInicio: "",
    fechaFin: "",
    productos: [],
    marcas: [],
    categorias: [],
    puntosVenta: [],
    canales: []
  });



const [canalesSeleccionados, setCanalesSeleccionados] = useState([]);


  const [menuOpen, setMenuOpen] = useState(false);
        const menuRef = useRef(null);
      
        const navigate = useNavigate();
      
useEffect(() => {
  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setMenuOpen(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);



        
  useEffect(() => {
    cargarData();
  }, []);

  async function cargarData() {
    try {
      const [ventasData, inventariosData, productosData, pdvData] =
        await Promise.all([
          getVentasBelkin(),
          getInventariosBelkin(),
          getProductosBelkin(),
          getPdvBelkin()
        ]);

      setVentas(ventasData || []);
      setInventarios(inventariosData || []);
      setProductos(productosData || []);
      setPdv(pdvData || []);
    } catch (error) {
      console.error("Error cargando datos del dashboard:", error);
    }
  }

  // opciones unicas para selects (derivadas de productos y pdv)
  const opciones = useMemo(() => {
    const uniq = (arr, key) => {
      const s = new Set();
      (arr || []).forEach(r => {
        const v = r && r[key];
        if (v !== null && v !== undefined && String(v).trim() !== "") s.add(String(v));
      });
      return Array.from(s).sort();
    };

    return {
      productos: uniq(productos, "nombre_producto").length ? uniq(productos, "nombre_producto") : uniq(ventas, "producto"),
      marcas: uniq(productos, "marca").length ? uniq(productos, "marca") : uniq(ventas, "marca"),
      categorias: uniq(productos, "categoria").length ? uniq(productos, "categoria") : uniq(ventas, "categoria"),
      puntosVenta: uniq(pdv, "punto_venta").length ? uniq(pdv, "punto_venta") : uniq(ventas, "punto_venta"),
      canales: uniq(pdv, "cliente_canal").length ? uniq(pdv, "cliente_canal") : uniq(ventas, "canal_cliente")
    };
  }, [productos, pdv, ventas]);

  // ventas filtradas usando la misma logica (memoizada)
  const ventasFiltradas = useMemo(() => {
    return filtrarVentas(ventas, filtros);
  }, [ventas, filtros]);


/* =============================
   KPI GLOBALES
============================= */
const kpisGlobales = useMemo(() => {
  const totalUnidades = ventasFiltradas.reduce(
    (acc, v) => acc + Number(v.cantidad || 0),
    0
  );

  const totalVentas = ventasFiltradas.reduce(
    (acc, v) => acc + Number(v.total_ventas || 0),
    0
  );

  return {
    totalUnidades,
    totalVentas
  };
}, [ventasFiltradas]);



  // =============================
// RESUMEN VENTAS POR CANAL
// =============================
const ventasPorCanal = useMemo(() => {
  const resumen = ventasFiltradas.reduce((acc, v) => {
    const canal = v.canal_cliente || "SIN_CANAL";

    if (!acc[canal]) {
      acc[canal] = 0;
    }

    acc[canal] += Number(v.total_ventas || 0);
    return acc;
  }, {});

  return Object.entries(resumen).map(([canal, total]) => ({
    canal,
    total,
  }));
}, [ventasFiltradas]);

const dataGrafico = ventasPorCanal.map(item => {
  const estaActivo =
    canalesSeleccionados.length === 0 ||
    canalesSeleccionados.includes(item.canal);

  return {
    ...item,
    total: estaActivo ? item.total : 0
  };
});


// Total general
const totalVentasGeneral = dataGrafico.reduce(
  (acc, item) => acc + Number(item.total),
  0
);

// Datos ordenados de mayor a menor + participaciÃ³n
const dataBarras = [...dataGrafico]
  .sort((a, b) => b.total - a.total)
  .map((item) => ({
    ...item,
    participacion: ((item.total / totalVentasGeneral) * 100).toFixed(1),
  }));


const CustomTooltipBarras = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    return (
      <div
        style={{
          background: "white",
          padding: "10px 14px",
          borderRadius: "10px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
          fontSize: "13px",
        }}
      >
        <strong>{data.canal}</strong>
        <div>Total: ${Number(data.total).toLocaleString()}</div>
        <div>ParticipaciÃ³n: {data.participacion}%</div>
      </div>
    );
  }

  return null;
};


const COLORS = ["#96CEE3", "#96A8E3", "#AB96E3", "#E3D196", "#E3AB96", "#CEE396", "#E396A8", "#A8E396", "#E39696", "#96E3C9", "#E3E396", "#96E3E0", "#D196E3", "#96E3A8", "#E3A896", "#A896E3", "#E3E096", "#96A8E3"];


const dataFiltradaGrafico =
  canalesSeleccionados.length === 0
    ? ventasPorCanal
    : ventasPorCanal.filter(item =>
        canalesSeleccionados.includes(item.canal)
      );

const handleSeleccionCanal = (canal) => {
  setCanalesSeleccionados((prev) => {
    if (prev.includes(canal)) {
      return prev.filter((c) => c !== canal);
    } else {
      return [...prev, canal];
    }
  });
};



  /* =============================
   FORMAT SELECT OPTIONS
============================= */
const toSelectOptions = (arr) =>
  arr.map(item => ({
    value: item,
    label: item
  }));

  

  // handlers multiselect (works for select multiple)
  const onMultiChange = (e, key) => {
    const selected = Array.from(e.target.selectedOptions).map(o => o.value);
    setFiltros(prev => ({ ...prev, [key]: selected }));
  };

  const onDateChange = (e, key) => {
    setFiltros(prev => ({ ...prev, [key]: e.target.value }));
  };

  const clearFilters = () => {
  setFiltros({
    fechaInicio: "",
    fechaFin: "",
    productos: [],
    marcas: [],
    categorias: [],
    puntosVenta: [],
    canales: []
  });
};


  return (
    <div className="Dashboardsummarybelkin">

      {/* HEADER simple */}
      <div className="Dashboardsummarybelkin-header">
        <h2>Dashboard Summary Belkin</h2>
        
      </div>
<div className="Crudventasbelkin_nav_wrapper" ref={menuRef}>
  <button
    className="Crudventasbelkin_nav_btn"
    onClick={() => setMenuOpen((p) => !p)}
  >
    Menú
  </button>

  {menuOpen && (
    <div className="Crudventasbelkin_nav_menu">

    <button onClick={() => navigate("/InventariosBelkin")}>
        Inventarios
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







      {/* FILTROS */}
      <div className="Dashboardsummarybelkin-filtros">

        <div className="filtro-col">
          <label>Fecha inicio</label>
          <input type="date" value={filtros.fechaInicio} onChange={(e) => onDateChange(e, "fechaInicio")} />
        </div>

        <div className="filtro-col">
          <label>Fecha fin</label>
          <input type="date" value={filtros.fechaFin} onChange={(e) => onDateChange(e, "fechaFin")} />
        </div>

        <div className="filtro-col">
          <label>Productos</label>
  <Select
    isMulti
    options={toSelectOptions(opciones.productos)}
    value={toSelectOptions(filtros.productos)}
    onChange={(selected) =>
      setFiltros(prev => ({
        ...prev,
        productos: selected ? selected.map(s => s.value) : []
      }))
    }
    placeholder="Buscar producto..."
    isClearable
  />
</div>


        <div className="filtro-col">
  <label>Marcas</label>
  <Select
    isMulti
    options={toSelectOptions(opciones.marcas)}
    value={toSelectOptions(filtros.marcas)}
    onChange={(selected) =>
      setFiltros(prev => ({
        ...prev,
        marcas: selected ? selected.map(s => s.value) : []
      }))
    }
    placeholder="Buscar marca..."
    isClearable
  />
</div>


<div className="filtro-col">
  <label>CategorÃ­as</label>
        <Select
  isMulti
  options={toSelectOptions(opciones.categorias)}
  value={toSelectOptions(filtros.categorias)}
  onChange={(selected) =>
    setFiltros(prev => ({
      ...prev,
      categorias: selected ? selected.map(s => s.value) : []
    }))
  }
  placeholder="Buscar categoria..."
  isClearable
/>
</div>

<div className="filtro-col">
  <label>Puntos de Venta</label>
        <Select
  isMulti
  options={toSelectOptions(opciones.puntosVenta)}
  value={toSelectOptions(filtros.puntosVenta)}
  onChange={(selected) =>
    setFiltros(prev => ({
      ...prev,
      puntosVenta: selected ? selected.map(s => s.value) : []
    }))
  }
  placeholder="Buscar PDV..."
  isClearable
/>
</div>

<div className="filtro-col">
  <label>Clientes/Canales</label>
<Select
  isMulti
  options={toSelectOptions(opciones.canales)}
  value={toSelectOptions(filtros.canales)}
  onChange={(selected) =>
    setFiltros(prev => ({
      ...prev,
      canales: selected ? selected.map(s => s.value) : []
    }))
  }
  placeholder="Buscar canal..."
  isClearable
/>
</div>


<div className="filtro-col filtro-actions">
  <button
    className="btn-clear-filters"
    onClick={clearFilters}
  >
    Limpiar filtros
  </button>
</div>



      </div>


      {/* =============================
    KPI GLOBALES
============================= */}
<div className="Dashboardsummarybelkin-kpis-globales">

  <div className="Dashboardsummarybelkin-kpi-card unidades">
    <p className="kpi-label">Total unidades vendidas</p>
    <h2 className="kpi-valor">
      {kpisGlobales.totalUnidades.toLocaleString()}
    </h2>
  </div>

  <div className="Dashboardsummarybelkin-kpi-card ventas">
    <p className="kpi-label">Total ventas</p>
    <h2 className="kpi-valor">
      ${kpisGlobales.totalVentas.toLocaleString()}
    </h2>
  </div>

</div>


{/* GRAFICOS */}
<div className="Dashboardsummarybelkin-graficos">

  {/* GRAFICO TORTA VENTAS POR CANAL */}
  <div className="Dashboardsummarybelkin-grafico-card">
    <h3>Distribucion Ventas por Canal</h3>

    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
 <Pie
  data={dataGrafico}
  dataKey="total"
  nameKey="canal"
  outerRadius={110}
  innerRadius={60}
  onClick={(data) => handleSeleccionCanal(data.canal)}
>



   {ventasPorCanal.map((entry, index) => {
  const activo =
    canalesSeleccionados.length === 0 ||
    canalesSeleccionados.includes(entry.canal);

  return (
    <Cell
      key={`cell-${index}`}
      fill={COLORS[index % COLORS.length]}
      opacity={activo ? 1 : 0.25}
    />
  );
})}

        </Pie>

        <Tooltip
  formatter={(value, name, props) => {
    const totalGeneral = ventasPorCanal.reduce(
      (acc, item) => acc + item.total,
      0
    );

    const porcentaje = ((value / totalGeneral) * 100).toFixed(1);

    return [
      `$${Number(value).toLocaleString()} - ${porcentaje}%`,
      name
    ];
  }}
/>

<Legend
  layout="vertical"
  align="right"
  verticalAlign="middle"
  onClick={(e) => handleSeleccionCanal(e.value)}
  wrapperStyle={{
    cursor: "pointer",
    maxHeight: "250px",
    overflowY: "auto",
  }}
/>


      </PieChart>
    </ResponsiveContainer>

    {canalesSeleccionados.length > 0 && (
  <button
    onClick={() => setCanalesSeleccionados([])}
    className="Dashboardsummarybelkin-btn-clear-selection"
  >
    Limpiar selecciÃ³n
  </button>
)}

  </div>

  {/* AQUI IRA TU SEGUNDO GRAFICO */}
  <div className="Dashboardsummarybelkin-grafico-card">
  <h3>Ranking Ventas por Canal</h3>

  <div className="Dashboardsummarybelkin-bar-wrapper">
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={dataBarras}
        margin={{ top: 20, right: 30, left: 10, bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="3 3" />

        <XAxis
          dataKey="canal"
          angle={-30}
          textAnchor="end"
          interval={0}
        />

        <YAxis />

        <Tooltip content={<CustomTooltipBarras />} />

        <Bar
          dataKey="total"
          fill="#6C8AE4"   /* mismo color fijo */
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>


</div>



      {/* TABLA DE MUESTRA */}
      <div className="Dashboardsummarybelkin-table">
        <h4>Ventas - muestra (max 50)</h4>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente /Canal</th>
                <th>Punto venta</th>
                <th>Producto</th>
                <th>Marca</th>
                <th>Categoria</th>
                <th>Cant.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {ventasFiltradas.slice(0,50).map(v => (
                <tr key={v.id_registro || Math.random()}>
                  <td>{v.fecha_venta}</td>
                  <td>{v.canal_cliente}</td>
                  <td>{v.punto_venta}</td>
                  <td>{v.producto}</td>
                  <td>{v.marca}</td>
                  <td>{v.categoria}</td>
                  <td>{v.cantidad}</td>
                  <td>{Number(v.total_ventas).toLocaleString()}</td>
                </tr>
              ))}
              {ventasFiltradas.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: "center" }}>Sin filas filtradas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}


