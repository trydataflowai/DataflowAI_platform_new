import React, { useEffect, useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import styles from '../../../styles/Dashboards/dashboard-ventas-e-inventarios/AnalisisVentas.module.css';

import {
  fetchDashVeinteVentas,
} from "../../../api/DashboardsApis/dashboard-ventas-e-inventarios/DashboardApiCrudVentas";

import {
  fetchDashVeinteMetas,
} from "../../../api/DashboardsApis/dashboard-ventas-e-inventarios/DashboardApiCrudMetas";

import {
  fetchTiendasForSelect,
  fetchProductosForSelect,
  fetchDashVeinteInventarios,
} from "../../../api/DashboardsApis/dashboard-ventas-e-inventarios/DashboardApiCrudInventarios";

// helpers
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const pad2 = (n) => String(n).padStart(2, "0");
const formatYMD = (y, m, d) => `${y}-${pad2(m + 1)}-${pad2(d)}`;
const money = (v) => Number(v || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 });
const pct = (v) => `${Number.isFinite(v) ? Number(v).toFixed(1) : 0}%`;

const AnalisisVentas = () => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0..11

  const [tiendas, setTiendas] = useState([]);
  const [productos, setProductos] = useState([]);

  const [ventasRaw, setVentasRaw] = useState([]);
  const [metasRaw, setMetasRaw] = useState([]);
  const [inventariosRaw, setInventariosRaw] = useState([]);

  // Datos del mes anterior para comparación
  const [ventasMesAnteriorRaw, setVentasMesAnteriorRaw] = useState([]);
  const [metasMesAnteriorRaw, setMetasMesAnteriorRaw] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // filtros
  const [selectedCiudad, setSelectedCiudad] = useState("");
  const [selectedTiendaId, setSelectedTiendaId] = useState("");
  const [selectedMarca, setSelectedMarca] = useState("");
  const [selectedProductoId, setSelectedProductoId] = useState("");

  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);

  // Calcular mes anterior
  const getMesAnterior = useMemo(() => {
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear = year - 1;
    }
    return { year: prevYear, month: prevMonth };
  }, [year, month]);

  // cargar tiendas y productos al montar
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [tResp, pResp] = await Promise.all([
          fetchTiendasForSelect(),
          fetchProductosForSelect(),
        ]);
        if (!mounted) return;
        const tList = Array.isArray(tResp) ? tResp : (tResp.results || []);
        const pList = Array.isArray(pResp) ? pResp : (pResp.results || []);
        setTiendas(tList);
        setProductos(pList);
      } catch (err) {
        console.warn("No se pudieron cargar tiendas/productos:", err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // maps de ayuda por id
  const tiendaById = useMemo(() => {
    const m = {};
    tiendas.forEach(t => {
      const id = t.id_tienda ?? t.id ?? t.pk;
      if (id !== undefined) m[id] = t;
    });
    return m;
  }, [tiendas]);

  const productoById = useMemo(() => {
    const m = {};
    productos.forEach(p => {
      const id = p.id_producto ?? p.id ?? p.pk;
      if (id !== undefined) m[id] = p;
    });
    return m;
  }, [productos]);

  // listas únicas para selects (ciudades y marcas)
  const ciudades = useMemo(() => {
    const s = new Set();
    tiendas.forEach(t => {
      if (t.ciudad) s.add(t.ciudad);
    });
    return Array.from(s).sort();
  }, [tiendas]);

  const marcas = useMemo(() => {
    const s = new Set();
    productos.forEach(p => {
      if (p.marca) s.add(p.marca);
    });
    return Array.from(s).sort();
  }, [productos]);

  // options para tiendas filtradas por ciudad (si selectedCiudad se usa)
  const tiendasFiltered = useMemo(() => {
    if (!selectedCiudad) return tiendas;
    return tiendas.filter(t => (t.ciudad || "").toString() === selectedCiudad);
  }, [tiendas, selectedCiudad]);

  // productos filtradas por marca (si selectedMarca se usa)
  const productosFiltered = useMemo(() => {
    if (!selectedMarca) return productos;
    return productos.filter(p => (p.marca || "").toString() === selectedMarca);
  }, [productos, selectedMarca]);

  // función para cargar datos del mes actual y anterior
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);

      // Fechas mes actual
      const start_date = formatYMD(year, month, 1);
      const end_date = formatYMD(year, month, daysInMonth);

      // Fechas mes anterior
      const prev = getMesAnterior;
      const prev_days = getDaysInMonth(prev.year, prev.month);
      const prev_start_date = formatYMD(prev.year, prev.month, 1);
      const prev_end_date = formatYMD(prev.year, prev.month, prev_days);

      const params = { start_date, end_date };
      // si seleccionó tienda o producto, enviarlos para reducir payload
      if (selectedTiendaId) params.id_tienda = selectedTiendaId;
      if (selectedProductoId) params.id_producto = selectedProductoId;

      // Parámetros para mes anterior (sin filtros de tienda/producto para mejor comparación)
      const paramsPrev = { 
        start_date: prev_start_date, 
        end_date: prev_end_date 
      };

      try {
        const [
          ventasResp, 
          metasResp, 
          invResp,
          ventasPrevResp,
          metasPrevResp
        ] = await Promise.all([
          fetchDashVeinteVentas(params),
          fetchDashVeinteMetas(params),
          fetchDashVeinteInventarios({ start_date, end_date }),
          fetchDashVeinteVentas(paramsPrev),
          fetchDashVeinteMetas(paramsPrev)
        ]);
        
        if (!mounted) return;
        
        const ventas = Array.isArray(ventasResp) ? ventasResp : (ventasResp.results || []);
        const metas = Array.isArray(metasResp) ? metasResp : (metasResp.results || []);
        const inventarios = Array.isArray(invResp) ? invResp : (invResp.results || []);
        
        const ventasPrev = Array.isArray(ventasPrevResp) ? ventasPrevResp : (ventasPrevResp.results || []);
        const metasPrev = Array.isArray(metasPrevResp) ? metasPrevResp : (metasPrevResp.results || []);
        
        setVentasRaw(ventas);
        setMetasRaw(metas);
        setInventariosRaw(inventarios);
        setVentasMesAnteriorRaw(ventasPrev);
        setMetasMesAnteriorRaw(metasPrev);
        
      } catch (err) {
        if (!mounted) return;
        setError(String(err));
        setVentasRaw([]);
        setMetasRaw([]);
        setInventariosRaw([]);
        setVentasMesAnteriorRaw([]);
        setMetasMesAnteriorRaw([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [year, month, daysInMonth, selectedTiendaId, selectedProductoId, getMesAnterior]);

  // Filtrar ventas/metas/inventarios client-side según ciudad/marca si aplica
  const ventasFiltered = useMemo(() => {
    if (!selectedCiudad && !selectedMarca) return ventasRaw;
    return ventasRaw.filter(v => {
      const tid = v.id_tienda ?? v.id ?? null;
      const pid = v.id_producto ?? v.id ?? null;
      if (selectedCiudad) {
        const tienda = tiendaById[tid];
        if (!tienda) return false;
        if ((tienda.ciudad || "").toString() !== selectedCiudad) return false;
      }
      if (selectedMarca) {
        const producto = productoById[pid];
        if (!producto) return false;
        if ((producto.marca || "").toString() !== selectedMarca) return false;
      }
      return true;
    });
  }, [ventasRaw, selectedCiudad, selectedMarca, tiendaById, productoById]);

  const metasFiltered = useMemo(() => {
    if (!selectedCiudad && !selectedMarca) return metasRaw;
    return metasRaw.filter(m => {
      const tid = m.id_tienda ?? m.id ?? null;
      const pid = m.id_producto ?? m.id ?? null;
      if (selectedCiudad) {
        const tienda = tiendaById[tid];
        if (!tienda) return false;
        if ((tienda.ciudad || "").toString() !== selectedCiudad) return false;
      }
      if (selectedMarca) {
        const producto = productoById[pid];
        if (!producto) return false;
        if ((producto.marca || "").toString() !== selectedMarca) return false;
      }
      return true;
    });
  }, [metasRaw, selectedCiudad, selectedMarca, tiendaById, productoById]);

  const inventariosFiltered = useMemo(() => {
    if (!selectedCiudad && !selectedMarca && !selectedTiendaId && !selectedProductoId) return inventariosRaw;
    return inventariosRaw.filter(inv => {
      const tid = inv.id_tienda ?? inv.id ?? null;
      const pid = inv.id_producto ?? inv.id ?? null;
      if (selectedTiendaId) {
        if ((String(tid) !== String(selectedTiendaId))) return false;
      } else if (selectedCiudad) {
        const tienda = tiendaById[tid];
        if (!tienda) return false;
        if ((tienda.ciudad || "").toString() !== selectedCiudad) return false;
      }
      if (selectedProductoId) {
        if ((String(pid) !== String(selectedProductoId))) return false;
      } else if (selectedMarca) {
        const producto = productoById[pid];
        if (!producto) return false;
        if ((producto.marca || "").toString() !== selectedMarca) return false;
      }
      return true;
    });
  }, [inventariosRaw, selectedCiudad, selectedMarca, selectedTiendaId, selectedProductoId, tiendaById, productoById]);

  // Ventas por día (suma dinero_vendido por fecha_venta day)
  const ventasPorDia = useMemo(() => {
    const map = {};
    ventasFiltered.forEach(v => {
      const raw = v.fecha_venta;
      if (!raw) return;
      const d = new Date(raw);
      if (isNaN(d.getTime())) return;
      const day = d.getDate();
      map[day] = (map[day] || 0) + Number(v.dinero_vendido || 0);
    });
    return map; // {1: val, 2: val, ...}
  }, [ventasFiltered]);

  // Meta diaria: total meta_dinero de metasFiltered dividido por días del mes
  const totalMetaMes = useMemo(() => {
    return metasFiltered.reduce((acc, m) => acc + Number(m.meta_dinero || 0), 0);
  }, [metasFiltered]);

  const metaDiaria = useMemo(() => {
    return daysInMonth > 0 ? (totalMetaMes / daysInMonth) : 0;
  }, [totalMetaMes, daysInMonth]);

  // construir series para gráfico principal
  const labels = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);
  const ventasSeries = useMemo(() => labels.map(d => Number((ventasPorDia[d] || 0).toFixed(2))), [labels, ventasPorDia]);
  const metasSeries = useMemo(() => labels.map(() => Number(metaDiaria.toFixed(2))), [labels, metaDiaria]);

  // ========== CÁLCULOS ADICIONALES ==========

  // 1. Calcular total de ventas del mes
  const totalVentasMes = useMemo(() => {
    return ventasFiltered.reduce((acc, v) => acc + Number(v.dinero_vendido || 0), 0);
  }, [ventasFiltered]);

  // 2. Calcular cumplimiento general
  const cumplimientoGeneral = useMemo(() => {
    return totalMetaMes > 0 ? (totalVentasMes / totalMetaMes) * 100 : 0;
  }, [totalVentasMes, totalMetaMes]);

  // 3. Calcular crecimiento vs mes anterior
  const ventasMesAnterior = useMemo(() => {
    // Filtrar ventas del mes anterior con los mismos criterios
    let ventasPrev = ventasMesAnteriorRaw;
    if (selectedCiudad || selectedMarca || selectedTiendaId || selectedProductoId) {
      ventasPrev = ventasPrev.filter(v => {
        const tid = v.id_tienda ?? v.id ?? null;
        const pid = v.id_producto ?? v.id ?? null;
        
        if (selectedTiendaId) {
          if ((String(tid) !== String(selectedTiendaId))) return false;
        } else if (selectedCiudad) {
          const tienda = tiendaById[tid];
          if (!tienda) return false;
          if ((tienda.ciudad || "").toString() !== selectedCiudad) return false;
        }
        
        if (selectedProductoId) {
          if ((String(pid) !== String(selectedProductoId))) return false;
        } else if (selectedMarca) {
          const producto = productoById[pid];
          if (!producto) return false;
          if ((producto.marca || "").toString() !== selectedMarca) return false;
        }
        return true;
      });
    }
    return ventasPrev.reduce((acc, v) => acc + Number(v.dinero_vendido || 0), 0);
  }, [ventasMesAnteriorRaw, selectedCiudad, selectedMarca, selectedTiendaId, selectedProductoId, tiendaById, productoById]);

  const crecimientoVsMesAnterior = useMemo(() => {
    if (ventasMesAnterior === 0) return totalVentasMes > 0 ? 100 : 0;
    return ((totalVentasMes - ventasMesAnterior) / ventasMesAnterior) * 100;
  }, [totalVentasMes, ventasMesAnterior]);

  // 4. Top 5 tiendas con más ventas
  const top5Tiendas = useMemo(() => {
    const ventasPorTienda = {};
    
    ventasFiltered.forEach(v => {
      const tid = v.id_tienda ?? v.id ?? null;
      if (tid) {
        const tiendaNombre = tiendaById[tid]?.nombre_tienda ?? tiendaById[tid]?.nombre ?? `Tienda ${tid}`;
        const key = `${tid}-${tiendaNombre}`;
        ventasPorTienda[key] = (ventasPorTienda[key] || 0) + Number(v.dinero_vendido || 0);
      }
    });
    
    // Convertir a array y ordenar
    return Object.entries(ventasPorTienda)
      .map(([key, valor]) => {
        const [id, nombre] = key.split('-');
        return { id, nombre, valor };
      })
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
  }, [ventasFiltered, tiendaById]);

  // 5. Productos más vendidos (por cantidad)
  const productosMasVendidos = useMemo(() => {
    const ventasPorProducto = {};
    
    ventasFiltered.forEach(v => {
      const pid = v.id_producto ?? v.id ?? null;
      if (pid) {
        const producto = productoById[pid];
        const nombre = producto?.nombre_producto ?? producto?.nombre ?? `Producto ${pid}`;
        const marca = producto?.marca ?? "Sin marca";
        const cantidad = Number(v.cantidad_vendida || 0);
        
        if (cantidad > 0) {
          const key = `${pid}-${nombre}`;
          if (!ventasPorProducto[key]) {
            ventasPorProducto[key] = { id: pid, nombre, marca, cantidad: 0, dinero: 0 };
          }
          ventasPorProducto[key].cantidad += cantidad;
          ventasPorProducto[key].dinero += Number(v.dinero_vendido || 0);
        }
      }
    });
    
    // Convertir a array y ordenar por cantidad
    return Object.values(ventasPorProducto)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  }, [ventasFiltered, productoById]);

  // 6. Datos para gráfico de barras apiladas por tienda
  const datosGraficoBarras = useMemo(() => {
    // Agrupar por tienda y marca
    const datosPorTienda = {};
    
    ventasFiltered.forEach(v => {
      const tid = v.id_tienda ?? v.id ?? null;
      const pid = v.id_producto ?? v.id ?? null;
      
      if (tid && pid) {
        const tiendaNombre = tiendaById[tid]?.nombre_tienda ?? tiendaById[tid]?.nombre ?? `Tienda ${tid}`;
        const producto = productoById[pid];
        const marca = producto?.marca ?? "Otras";
        const valor = Number(v.dinero_vendido || 0);
        
        if (!datosPorTienda[tiendaNombre]) {
          datosPorTienda[tiendaNombre] = {};
        }
        
        if (!datosPorTienda[tiendaNombre][marca]) {
          datosPorTienda[tiendaNombre][marca] = 0;
        }
        
        datosPorTienda[tiendaNombre][marca] += valor;
      }
    });
    
    // Preparar datos para ECharts
    const tiendasNombres = Object.keys(datosPorTienda);
    const marcasUnicas = new Set();
    
    Object.values(datosPorTienda).forEach(datos => {
      Object.keys(datos).forEach(marca => marcasUnicas.add(marca));
    });
    
    const series = Array.from(marcasUnicas).map(marca => ({
      name: marca,
      type: 'bar',
      stack: 'ventas',
      emphasis: { focus: 'series' },
      data: tiendasNombres.map(tienda => datosPorTienda[tienda][marca] || 0)
    }));
    
    return { tiendas: tiendasNombres, series };
  }, [ventasFiltered, tiendaById, productoById]);

  // 7. Datos para tabla pivot (resumen dinámico)
  const tablaPivot = useMemo(() => {
    if (!tiendasFiltered.length || !productosFiltered.length) return [];
    
    // Limitar a las primeras 5 tiendas y 5 marcas para mejor visualización
    const tiendasLimit = tiendasFiltered.slice(0, 5);
    const marcasLimit = Array.from(new Set(productosFiltered.map(p => p.marca))).slice(0, 5);
    
    const pivotData = [];
    
    // Filas: Tiendas
    tiendasLimit.forEach(tienda => {
      const tid = tienda.id_tienda ?? tienda.id ?? tienda.pk;
      const fila = {
        tienda: tienda.nombre_tienda ?? tienda.nombre,
        ciudad: tienda.ciudad || "N/A"
      };
      
      // Columnas: Marcas
      marcasLimit.forEach(marca => {
        // Calcular ventas para esta tienda y marca
        const ventasFiltradas = ventasFiltered.filter(v => {
          const vTid = v.id_tienda ?? v.id ?? null;
          const vPid = v.id_producto ?? v.id ?? null;
          const producto = productoById[vPid];
          return String(vTid) === String(tid) && producto?.marca === marca;
        });
        
        const totalVentas = ventasFiltradas.reduce((acc, v) => acc + Number(v.dinero_vendido || 0), 0);
        fila[marca] = totalVentas;
      });
      
      // Calcular total por tienda
      const totalTienda = Object.keys(fila)
        .filter(key => !['tienda', 'ciudad'].includes(key))
        .reduce((acc, key) => acc + (fila[key] || 0), 0);
      
      fila.total = totalTienda;
      pivotData.push(fila);
    });
    
    return pivotData;
  }, [tiendasFiltered, productosFiltered, ventasFiltered, productoById]);

  // ========== OPCIONES DE GRÁFICOS ==========

  // Opción para gráfico principal
  const optionPrincipal = useMemo(() => {
    return {
      title: {
        text: `Ventas vs Meta — ${new Date(year, month).toLocaleString("es-CO", { month: "long", year: "numeric" })}`,
        left: "center",
        textStyle: { 
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: 16,
          fontWeight: 600,
          color: 'var(--dhveinte-anlv-text-primary)'
        },
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: 'var(--dhveinte-anlv-card-bg)',
        borderColor: 'var(--dhveinte-anlv-card-border)',
        textStyle: { color: 'var(--dhveinte-anlv-text-primary)' },
        formatter: (params) => {
          const axisValue = params[0]?.axisValue;
          const ventaPoint = params.find(p => p.seriesName === "Ventas");
          const metaPoint = params.find(p => p.seriesName === "Meta diaria");
          const venta = ventaPoint?.value || 0;
          const meta = metaPoint?.value || 0;
          const cumplimiento = meta > 0 ? ((venta / meta) * 100).toFixed(1) : "0.0";

          const tiendaName = selectedTiendaId ? (tiendaById[selectedTiendaId]?.nombre_tienda || "") : (selectedCiudad ? `Ciudad: ${selectedCiudad}` : "");
          const productoName = selectedProductoId ? (productoById[selectedProductoId]?.nombre_producto || "") : (selectedMarca ? `Marca: ${selectedMarca}` : "");

          let header = `<strong style="color: var(--dhveinte-anlv-accent-1)">Día ${axisValue}</strong><br/>`;
          if (tiendaName) header += `${tiendaName}<br/>`;
          if (productoName) header += `${productoName}<br/>`;

          return `${header}
            <span style="color: #d9534f">🔴 Meta diaria: ${Number(meta).toLocaleString("es-CO", { maximumFractionDigits: 2 })}</span><br/>
            <span style="color: #111111">⚫ Ventas: ${Number(venta).toLocaleString("es-CO", { maximumFractionDigits: 2 })}</span><br/>
            <span style="color: var(--dhveinte-anlv-accent-1)">✅ Cumplimiento: <b>${cumplimiento}%</b></span>
          `;
        },
        axisPointer: { type: "shadow" },
      },
      legend: { 
        top: 36, 
        data: ["Meta diaria", "Ventas"], 
        textStyle: { 
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          color: 'var(--dhveinte-anlv-text-secondary)'
        } 
      },
      toolbox: { 
        feature: { 
          saveAsImage: { 
            title: "Guardar imagen",
            pixelRatio: 2
          },
          dataView: { 
            readOnly: true,
            title: "Ver datos"
          }
        }, 
        right: 10,
        top: 10
      },
      grid: { 
        left: "6%", 
        right: "6%", 
        bottom: "8%", 
        top: "15%",
        containLabel: true 
      },
      xAxis: { 
        type: "category", 
        data: labels.map(String), 
        name: "Día", 
        nameLocation: "middle",
        nameGap: 25,
        axisLabel: { 
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          color: 'var(--dhveinte-anlv-text-secondary)'
        },
        axisLine: {
          lineStyle: {
            color: 'var(--dhveinte-anlv-card-border)'
          }
        }
      },
      yAxis: {
        type: "value",
        name: "Valor ($)",
        nameLocation: "middle",
        nameGap: 40,
        axisLabel: {
          formatter: (v) => {
            if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
            if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
            return `$${v}`;
          },
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          color: 'var(--dhveinte-anlv-text-secondary)'
        },
        axisLine: {
          lineStyle: {
            color: 'var(--dhveinte-anlv-card-border)'
          }
        },
        splitLine: {
          lineStyle: {
            color: 'var(--dhveinte-anlv-card-border)',
            type: 'dashed'
          }
        }
      },
      series: [
        { 
          name: "Meta diaria", 
          type: "line", 
          smooth: true, 
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{
                offset: 0, color: 'rgba(217, 83, 79, 0.3)'
              }, {
                offset: 1, color: 'rgba(217, 83, 79, 0.05)'
              }]
            }
          }, 
          data: metasSeries, 
          lineStyle: { 
            width: 3, 
            color: '#d9534f' 
          },
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: {
            color: '#d9534f'
          }
        },
        { 
          name: "Ventas", 
          type: "line", 
          smooth: true, 
          data: ventasSeries, 
          showSymbol: true, 
          symbolSize: 8, 
          lineStyle: { 
            width: 3, 
            color: '#111111' 
          },
          itemStyle: {
            color: '#111111'
          }
        },
      ],
      color: ['#d9534f', '#111111', '#0A66C2']
    };
  }, [labels, metasSeries, ventasSeries, year, month, selectedTiendaId, selectedProductoId, selectedCiudad, selectedMarca, tiendaById, productoById]);

  // Opción para gráfico de barras apiladas
  const optionBarrasApiladas = useMemo(() => {
    return {
      title: {
        text: 'Top 5 Tiendas - Ventas por Marca',
        left: 'center',
        textStyle: { 
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: 16,
          fontWeight: 600,
          color: 'var(--dhveinte-anlv-text-primary)'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'var(--dhveinte-anlv-card-bg)',
        borderColor: 'var(--dhveinte-anlv-card-border)',
        textStyle: { color: 'var(--dhveinte-anlv-text-primary)' },
        formatter: function(params) {
          let result = `<strong style="color: var(--dhveinte-anlv-accent-1)">${params[0].name}</strong><br/>`;
          let total = 0;
          
          params.forEach(param => {
            const value = param.value || 0;
            total += value;
            result += `${param.marker} ${param.seriesName}: ${money(value)}<br/>`;
          });
          
          result += `<hr style="margin: 5px 0; border-color: var(--dhveinte-anlv-card-border);"/>`;
          result += `<strong style="color: var(--dhveinte-anlv-accent-1)">Total: ${money(total)}</strong>`;
          return result;
        }
      },
      legend: {
        top: 30,
        data: datosGraficoBarras.series.slice(0, 5).map(s => s.name),
        textStyle: { 
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          color: 'var(--dhveinte-anlv-text-secondary)'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: datosGraficoBarras.tiendas.slice(0, 5),
        axisLabel: {
          rotate: 45,
          fontSize: 12,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          color: 'var(--dhveinte-anlv-text-secondary)'
        },
        axisLine: {
          lineStyle: {
            color: 'var(--dhveinte-anlv-card-border)'
          }
        }
      },
      yAxis: {
        type: 'value',
        name: 'Ventas ($)',
        nameLocation: 'middle',
        nameGap: 30,
        axisLabel: {
          formatter: (value) => {
            if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
            return `$${value}`;
          },
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          color: 'var(--dhveinte-anlv-text-secondary)'
        },
        axisLine: {
          lineStyle: {
            color: 'var(--dhveinte-anlv-card-border)'
          }
        },
        splitLine: {
          lineStyle: {
            color: 'var(--dhveinte-anlv-card-border)',
            type: 'dashed'
          }
        }
      },
      series: datosGraficoBarras.series.slice(0, 5),
      color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc']
    };
  }, [datosGraficoBarras]);

  // Reset filters
  const resetFilters = () => {
    setSelectedCiudad("");
    setSelectedTiendaId("");
    setSelectedMarca("");
    setSelectedProductoId("");
  };

  // Datos para tablas
  const tablaPorTienda = useMemo(() => {
    const baseTiendas = selectedTiendaId ? (tiendaById[selectedTiendaId] ? [tiendaById[selectedTiendaId]] : []) : tiendasFiltered;
    return baseTiendas.map(t => {
      const tid = t.id_tienda ?? t.id ?? t.pk;
      const ventasT = ventasFiltered.filter(v => String(v.id_tienda) === String(tid));
      const metasT = metasFiltered.filter(m => String(m.id_tienda) === String(tid));
      const invT = inventariosFiltered.filter(i => String(i.id_tienda) === String(tid));

      const dinero_vendido = ventasT.reduce((a, b) => a + Number(b.dinero_vendido || 0), 0);
      const cantidad_vendida = ventasT.reduce((a, b) => a + Number(b.cantidad_vendida || 0), 0);
      const meta_dinero = metasT.reduce((a, b) => a + Number(b.meta_dinero || 0), 0);
      const inventario_cantidad = invT.reduce((a, b) => a + Number(b.inventario_cantidad || 0), 0);

      const cumplimiento = meta_dinero ? (dinero_vendido / meta_dinero) * 100 : 0;

      return {
        id: tid,
        nombre_tienda: t.nombre_tienda ?? t.nombre,
        meta_dinero,
        dinero_vendido,
        cumplimiento,
        cantidad_vendida,
        inventario_cantidad,
      };
    });
  }, [tiendasFiltered, selectedTiendaId, ventasFiltered, metasFiltered, inventariosFiltered, tiendaById]);

  const tablaPorProducto = useMemo(() => {
    const baseProductos = selectedProductoId ? (productoById[selectedProductoId] ? [productoById[selectedProductoId]] : []) : productosFiltered;
    return baseProductos.map(p => {
      const pid = p.id_producto ?? p.id ?? p.pk;
      const ventasP = ventasFiltered.filter(v => String(v.id_producto) === String(pid));
      const metasP = metasFiltered.filter(m => String(m.id_producto) === String(pid));
      const invP = inventariosFiltered.filter(i => String(i.id_producto) === String(pid));

      const dinero_vendido = ventasP.reduce((a, b) => a + Number(b.dinero_vendido || 0), 0);
      const cantidad_vendida = ventasP.reduce((a, b) => a + Number(b.cantidad_vendida || 0), 0);
      const meta_dinero = metasP.reduce((a, b) => a + Number(b.meta_dinero || 0), 0);
      const inventario_cantidad = invP.reduce((a, b) => a + Number(b.inventario_cantidad || 0), 0);

      const cumplimiento = meta_dinero ? (dinero_vendido / meta_dinero) * 100 : 0;

      return {
        id: pid,
        marca: p.marca,
        nombre_producto: p.nombre_producto ?? p.nombre,
        meta_dinero,
        dinero_vendido,
        cumplimiento,
        cantidad_vendida,
        inventario_cantidad,
      };
    });
  }, [productosFiltered, selectedProductoId, ventasFiltered, metasFiltered, inventariosFiltered, productoById]);

  /* ========== RENDER ========== */

  return (
    <main className={`${styles.DashboardGeneralcontainer} ${styles.DashboardGeneralLight}`}>
      
      {/* Header Section */}
      <section className={styles.DashboardGeneralheader}>
        <div className={styles.DashboardGeneralheaderContent}>
          <h1 className={styles.DashboardGeneraltitle}>
            Análisis de Ventas vs Metas
          </h1>
          <p className={styles.DashboardGeneralsubtitle}>
            Monitorea y analiza el desempeño de ventas comparado con las metas establecidas
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className={styles.filtersSection}>
        <div className={styles.filtersContainer}>
          
          {/* Date Filters */}
          <div className={styles.filterGroup}>
            <div className={styles.filterLabel}>Periodo</div>
            <div className={styles.filterControls}>
              <div className={styles.selectWrapper}>
                <select 
                  value={month} 
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className={styles.select}
                  aria-label="Seleccionar mes"
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i} value={i}>
                      {new Date(0, i).toLocaleString("es-CO", { month: "long" })}
                    </option>
                  ))}
                </select>
                <span className={styles.selectArrow}>▼</span>
              </div>

              <div className={styles.selectWrapper}>
                <input 
                  type="number" 
                  value={year} 
                  onChange={(e) => setYear(Number(e.target.value))}
                  className={styles.inputNumber}
                  aria-label="Año"
                  min="2000"
                  max="2100"
                />
              </div>
            </div>
          </div>

          {/* Location Filters */}
          <div className={styles.filterGroup}>
            <div className={styles.filterLabel}>Ubicación</div>
            <div className={styles.filterControls}>
              <div className={styles.selectWrapper}>
                <select 
                  value={selectedCiudad} 
                  onChange={(e) => { setSelectedCiudad(e.target.value); setSelectedTiendaId(""); }}
                  className={styles.select}
                  aria-label="Seleccionar ciudad"
                >
                  <option value="">Todas las ciudades</option>
                  {ciudades.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <span className={styles.selectArrow}>▼</span>
              </div>

              <div className={styles.selectWrapper}>
                <select 
                  value={selectedTiendaId} 
                  onChange={(e) => setSelectedTiendaId(e.target.value)}
                  className={styles.select}
                  aria-label="Seleccionar tienda"
                >
                  <option value="">Todas las tiendas</option>
                  {tiendasFiltered.map(t => {
                    const id = t.id_tienda ?? t.id ?? t.pk;
                    return <option key={id} value={id}>{t.nombre_tienda ?? t.nombre}</option>;
                  })}
                </select>
                <span className={styles.selectArrow}>▼</span>
              </div>
            </div>
          </div>

          {/* Product Filters */}
          <div className={styles.filterGroup}>
            <div className={styles.filterLabel}>Productos</div>
            <div className={styles.filterControls}>
              <div className={styles.selectWrapper}>
                <select 
                  value={selectedMarca} 
                  onChange={(e) => { setSelectedMarca(e.target.value); setSelectedProductoId(""); }}
                  className={styles.select}
                  aria-label="Seleccionar marca"
                >
                  <option value="">Todas las marcas</option>
                  {marcas.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <span className={styles.selectArrow}>▼</span>
              </div>

              <div className={styles.selectWrapper}>
                <select 
                  value={selectedProductoId} 
                  onChange={(e) => setSelectedProductoId(e.target.value)}
                  className={styles.select}
                  aria-label="Seleccionar producto"
                >
                  <option value="">Todos los productos</option>
                  {productosFiltered.map(p => {
                    const id = p.id_producto ?? p.id ?? p.pk;
                    return <option key={id} value={id}>{p.nombre_producto ?? p.nombre}</option>;
                  })}
                </select>
                <span className={styles.selectArrow}>▼</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.filterActions}>
            <button 
              className={`${styles.button} ${styles.buttonSecondary}`}
              onClick={resetFilters}
              aria-label="Restablecer todos los filtros"
            >
              <span className={styles.buttonIcon}>↺</span>
              Restablecer
            </button>
            <button 
              className={`${styles.button} ${styles.buttonPrimary}`}
              onClick={() => {
                setLoading(true);
                (async () => {
                  try {
                    const start_date = formatYMD(year, month, 1);
                    const end_date = formatYMD(year, month, daysInMonth);
                    const params = { start_date, end_date };
                    if (selectedTiendaId) params.id_tienda = selectedTiendaId;
                    if (selectedProductoId) params.id_producto = selectedProductoId;
                    const [vResp, mResp, iResp] = await Promise.all([
                      fetchDashVeinteVentas(params),
                      fetchDashVeinteMetas(params),
                      fetchDashVeinteInventarios({ start_date, end_date }),
                    ]);
                    setVentasRaw(Array.isArray(vResp) ? vResp : (vResp.results || []));
                    setMetasRaw(Array.isArray(mResp) ? mResp : (mResp.results || []));
                    setInventariosRaw(Array.isArray(iResp) ? iResp : (iResp.results || []));
                  } catch (err) {
                    setError(String(err));
                  } finally {
                    setLoading(false);
                  }
                })();
              }}
              aria-label="Actualizar datos"
              disabled={loading}
            >
              <span className={styles.buttonIcon}>↻</span>
              Actualizar
            </button>
          </div>

        </div>
      </section>

      {/* Loading & Error States */}
      {loading && (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingText}>Cargando datos...</div>
        </div>
      )}
      
      {error && (
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <div className={styles.errorText}>{error}</div>
          <button 
            className={styles.errorButton}
            onClick={() => setError(null)}
            aria-label="Cerrar mensaje de error"
          >
            ×
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Summary Cards */}
          <section className={styles.cardsSection}>
            <div className={styles.cardsContainer}>
              
              {/* Card 1: Meta Mensual */}
              <div className={styles.summaryCard}>
                <div className={styles.summaryCardHeader}>
                  <div className={styles.summaryCardIcon}>
                    <span style={{ background: '#d9534f' }}></span>
                  </div>
                  <h3 className={styles.summaryCardTitle}>Meta Mensual</h3>
                  <div className={styles.summaryCardBadge}>
                    {new Date(year, month).toLocaleString("es-CO", { month: "short", year: "numeric" })}
                  </div>
                </div>
                <div className={styles.summaryCardContent}>
                  <div className={styles.summaryCardValue}>{money(totalMetaMes)}</div>
                  <div className={styles.summaryCardSubtitle}>
                    Meta diaria: {money(metaDiaria)}
                  </div>
                </div>
                <div className={styles.summaryCardFooter}>
                  <span>{daysInMonth} días en el mes</span>
                </div>
              </div>

              {/* Card 2: Total de Ventas */}
              <div className={styles.summaryCard}>
                <div className={styles.summaryCardHeader}>
                  <div className={styles.summaryCardIcon}>
                    <span style={{ background: '#111111' }}></span>
                  </div>
                  <h3 className={styles.summaryCardTitle}>Total de Ventas</h3>
                  <div className={styles.summaryCardBadge}>
                    Actual
                  </div>
                </div>
                <div className={styles.summaryCardContent}>
                  <div className={styles.summaryCardValue}>{money(totalVentasMes)}</div>
                  <div className={styles.summaryCardSubtitle}>
                    Promedio diario: {money(totalVentasMes / daysInMonth)}
                  </div>
                </div>
                <div className={styles.summaryCardFooter}>
                  <span>{ventasFiltered.length} transacciones</span>
                </div>
              </div>

              {/* Card 3: Cumplimiento */}
              <div className={styles.summaryCard}>
                <div className={styles.summaryCardHeader}>
                  <div className={styles.summaryCardIcon}>
                    <span style={{ 
                      background: cumplimientoGeneral >= 100 ? '#28a745' : 
                                 cumplimientoGeneral >= 80 ? '#ffc107' : '#dc3545' 
                    }}></span>
                  </div>
                  <h3 className={styles.summaryCardTitle}>Cumplimiento</h3>
                  <div className={styles.summaryCardBadge}>
                    General
                  </div>
                </div>
                <div className={styles.summaryCardContent}>
                  <div className={styles.summaryCardValue} style={{ 
                    color: cumplimientoGeneral >= 100 ? '#28a745' : 
                           cumplimientoGeneral >= 80 ? '#ffc107' : '#dc3545' 
                  }}>
                    {pct(cumplimientoGeneral)}
                  </div>
                  <div className={styles.summaryCardSubtitle}>
                    {cumplimientoGeneral >= 100 ? '✅ Meta superada' : 
                     cumplimientoGeneral >= 80 ? '⚠️ Cerca de la meta' : '❌ Por debajo de la meta'}
                  </div>
                </div>
                <div className={styles.summaryCardFooter}>
                  <span>
                    {totalMetaMes > 0 ? 
                      `${money(totalVentasMes)} / ${money(totalMetaMes)}` : 
                      'Sin meta definida'}
                  </span>
                </div>
              </div>

              {/* Card 4: Crecimiento */}
              <div className={styles.summaryCard}>
                <div className={styles.summaryCardHeader}>
                  <div className={styles.summaryCardIcon}>
                    <span style={{ 
                      background: crecimientoVsMesAnterior >= 0 ? '#28a745' : '#dc3545' 
                    }}></span>
                  </div>
                  <h3 className={styles.summaryCardTitle}>Crecimiento</h3>
                  <div className={styles.summaryCardBadge}>
                    vs {new Date(getMesAnterior.year, getMesAnterior.month).toLocaleString("es-CO", { month: "short" })}
                  </div>
                </div>
                <div className={styles.summaryCardContent}>
                  <div className={styles.summaryCardValue} style={{ 
                    color: crecimientoVsMesAnterior >= 0 ? '#28a745' : '#dc3545' 
                  }}>
                    {crecimientoVsMesAnterior >= 0 ? '+' : ''}{pct(crecimientoVsMesAnterior)}
                  </div>
                  <div className={styles.summaryCardSubtitle}>
                    {crecimientoVsMesAnterior >= 0 ? '📈 Crecimiento positivo' : '📉 Crecimiento negativo'}
                  </div>
                </div>
                <div className={styles.summaryCardFooter}>
                  <span>Mes anterior: {money(ventasMesAnterior)}</span>
                </div>
              </div>

              {/* Card 5: Top Productos */}
              <div className={styles.summaryCard}>
                <div className={styles.summaryCardHeader}>
                  <div className={styles.summaryCardIcon}>
                    <span style={{ background: '#17a2b8' }}></span>
                  </div>
                  <h3 className={styles.summaryCardTitle}>Productos Más Vendidos</h3>
                  <div className={styles.summaryCardBadge}>
                    Top 5
                  </div>
                </div>
                <div className={styles.summaryCardContent}>
                  {productosMasVendidos.length > 0 ? (
                    <div className={styles.topList}>
                      {productosMasVendidos.slice(0, 3).map((prod, idx) => (
                        <div key={prod.id} className={styles.topListItem}>
                          <div className={styles.topListRank}>{idx + 1}</div>
                          <div className={styles.topListContent}>
                            <div className={styles.topListTitle}>{prod.nombre}</div>
                            <div className={styles.topListMeta}>
                              <span>{prod.cantidad} unidades</span>
                              <span>{money(prod.dinero)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyState}>Sin datos</div>
                  )}
                </div>
                <div className={styles.summaryCardFooter}>
                  <span>
                    Total: {productosMasVendidos.reduce((acc, prod) => acc + prod.cantidad, 0)} unidades
                  </span>
                </div>
              </div>

              {/* Card 6: Top Tiendas */}
              <div className={styles.summaryCard}>
                <div className={styles.summaryCardHeader}>
                  <div className={styles.summaryCardIcon}>
                    <span style={{ background: '#6f42c1' }}></span>
                  </div>
                  <h3 className={styles.summaryCardTitle}>Top 5 Tiendas</h3>
                  <div className={styles.summaryCardBadge}>
                    Por ventas
                  </div>
                </div>
                <div className={styles.summaryCardContent}>
                  {top5Tiendas.length > 0 ? (
                    <div className={styles.topList}>
                      {top5Tiendas.map((tienda, idx) => (
                        <div key={tienda.id} className={styles.topListItem}>
                          <div className={styles.topListRank}>{idx + 1}</div>
                          <div className={styles.topListContent}>
                            <div className={styles.topListTitle}>{tienda.nombre}</div>
                            <div className={styles.topListMeta}>
                              <span>{money(tienda.valor)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyState}>Sin datos</div>
                  )}
                </div>
                <div className={styles.summaryCardFooter}>
                  <span>
                    Total top 5: {money(top5Tiendas.reduce((acc, t) => acc + t.valor, 0))}
                  </span>
                </div>
              </div>

            </div>
          </section>

          {/* Main Chart Section */}
          <section className={styles.chartSection}>
            <div className={styles.chartContainer}>
              <h2 className={styles.sectionTitle}>Ventas vs Meta Diaria</h2>
              <div className={styles.chartWrapper}>
                <ReactECharts 
                  option={optionPrincipal} 
                  style={{ height: 480, width: "100%" }} 
                  notMerge={true} 
                  lazyUpdate={true}
                  className={styles.chart}
                />
              </div>
            </div>
          </section>

          {/* Stacked Bar Chart */}
          <section className={styles.chartSection}>
            <div className={styles.chartContainer}>
              <h2 className={styles.sectionTitle}>Ventas por Tienda y Marca (Top 5)</h2>
              <div className={styles.chartWrapper}>
                <ReactECharts 
                  option={optionBarrasApiladas} 
                  style={{ height: 400, width: "100%" }}
                  className={styles.chart}
                />
              </div>
            </div>
          </section>

          {/* Pivot Table */}
          <section className={styles.tableSection}>
            <div className={styles.tableContainer}>
              <div className={styles.tableHeader}>
                <h2 className={styles.sectionTitle}>Resumen Dinámico: Tiendas vs Marcas</h2>
              </div>
              <div className={styles.tableWrapper}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th className={styles.tableHeaderCell}>Tienda</th>
                      <th className={styles.tableHeaderCell}>Ciudad</th>
                      {tablaPivot.length > 0 && Object.keys(tablaPivot[0])
                        .filter(key => !['tienda', 'ciudad', 'total'].includes(key))
                        .map(marca => (
                          <th key={marca} className={styles.tableHeaderCell} style={{ textAlign: 'right' }}>
                            {marca}
                          </th>
                        ))
                      }
                      <th className={styles.tableHeaderCell} style={{ textAlign: 'right', fontWeight: 600 }}>
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tablaPivot.length === 0 && (
                      <tr>
                        <td colSpan="10" className={styles.tableEmptyCell}>
                          No hay datos para mostrar la tabla pivot
                        </td>
                      </tr>
                    )}
                    {tablaPivot.map((fila, idx) => (
                      <tr key={idx} className={styles.tableRow}>
                        <td className={styles.tableCell} style={{ fontWeight: 600 }}>{fila.tienda}</td>
                        <td className={styles.tableCell}>{fila.ciudad}</td>
                        {Object.keys(fila)
                          .filter(key => !['tienda', 'ciudad', 'total'].includes(key))
                          .map(marca => (
                            <td key={marca} className={styles.tableCell} style={{ textAlign: 'right' }}>
                              {money(fila[marca])}
                            </td>
                          ))
                        }
                        <td className={styles.tableCell} style={{ 
                          textAlign: 'right', 
                          fontWeight: 600,
                          background: 'var(--dhveinte-anlv-bg-secondary)'
                        }}>
                          {money(fila.total)}
                        </td>
                      </tr>
                    ))}
                    {/* Totals Row */}
                    {tablaPivot.length > 0 && (
                      <tr className={styles.tableTotalsRow}>
                        <td className={styles.tableCell} colSpan="2" style={{ fontWeight: 600 }}>
                          Total General
                        </td>
                        {Object.keys(tablaPivot[0])
                          .filter(key => !['tienda', 'ciudad', 'total'].includes(key))
                          .map(marca => {
                            const totalMarca = tablaPivot.reduce((sum, fila) => sum + (fila[marca] || 0), 0);
                            return (
                              <td key={marca} className={styles.tableCell} style={{ textAlign: 'right', fontWeight: 600 }}>
                                {money(totalMarca)}
                              </td>
                            );
                          })
                        }
                        <td className={styles.tableCell} style={{ 
                          textAlign: 'right', 
                          fontWeight: 600,
                          background: 'var(--dhveinte-anlv-accent-1)',
                          color: 'white'
                        }}>
                          {money(tablaPivot.reduce((sum, fila) => sum + fila.total, 0))}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Detailed Tables */}
          <section className={styles.tablesGrid}>
            
            {/* Stores Table */}
            <div className={styles.tableCard}>
              <div className={styles.tableCardHeader}>
                <h3 className={styles.tableCardTitle}>Resumen por Tienda</h3>
                <div className={styles.tableCardCount}>
                  {tablaPorTienda.length} tiendas
                </div>
              </div>
              <div className={styles.tableWrapper}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th className={styles.tableHeaderCell}>Nombre Tienda</th>
                      <th className={styles.tableHeaderCell} style={{ textAlign: 'right' }}>Meta</th>
                      <th className={styles.tableHeaderCell} style={{ textAlign: 'right' }}>Ventas</th>
                      <th className={styles.tableHeaderCell} style={{ textAlign: 'right' }}>Cumplimiento</th>
                      <th className={styles.tableHeaderCell} style={{ textAlign: 'right' }}>Cantidad</th>
                      <th className={styles.tableHeaderCell} style={{ textAlign: 'right' }}>Inventario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tablaPorTienda.length === 0 && (
                      <tr>
                        <td colSpan="6" className={styles.tableEmptyCell}>
                          No hay datos
                        </td>
                      </tr>
                    )}
                    {tablaPorTienda.map(row => (
                      <tr key={row.id} className={styles.tableRow}>
                        <td className={styles.tableCell}>{row.nombre_tienda}</td>
                        <td className={styles.tableCell} style={{ textAlign: 'right' }}>{money(row.meta_dinero)}</td>
                        <td className={styles.tableCell} style={{ textAlign: 'right' }}>{money(row.dinero_vendido)}</td>
                        <td className={styles.tableCell} style={{ 
                          textAlign: 'right',
                          color: row.cumplimiento >= 100 ? '#28a745' : 
                                 row.cumplimiento >= 80 ? '#ffc107' : '#dc3545',
                          fontWeight: 600
                        }}>
                          {pct(row.cumplimiento)}
                        </td>
                        <td className={styles.tableCell} style={{ textAlign: 'right' }}>{row.cantidad_vendida}</td>
                        <td className={styles.tableCell} style={{ textAlign: 'right' }}>{row.inventario_cantidad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Products Table */}
            <div className={styles.tableCard}>
              <div className={styles.tableCardHeader}>
                <h3 className={styles.tableCardTitle}>Resumen por Producto / Marca</h3>
                <div className={styles.tableCardCount}>
                  {tablaPorProducto.length} productos
                </div>
              </div>
              <div className={styles.tableWrapper}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th className={styles.tableHeaderCell}>Marca</th>
                      <th className={styles.tableHeaderCell}>Producto</th>
                      <th className={styles.tableHeaderCell} style={{ textAlign: 'right' }}>Meta</th>
                      <th className={styles.tableHeaderCell} style={{ textAlign: 'right' }}>Ventas</th>
                      <th className={styles.tableHeaderCell} style={{ textAlign: 'right' }}>Cumplimiento</th>
                      <th className={styles.tableHeaderCell} style={{ textAlign: 'right' }}>Cantidad</th>
                      <th className={styles.tableHeaderCell} style={{ textAlign: 'right' }}>Inventario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tablaPorProducto.length === 0 && (
                      <tr>
                        <td colSpan="7" className={styles.tableEmptyCell}>
                          No hay datos
                        </td>
                      </tr>
                    )}
                    {tablaPorProducto.map(row => (
                      <tr key={row.id} className={styles.tableRow}>
                        <td className={styles.tableCell}>{row.marca}</td>
                        <td className={styles.tableCell}>{row.nombre_producto}</td>
                        <td className={styles.tableCell} style={{ textAlign: 'right' }}>{money(row.meta_dinero)}</td>
                        <td className={styles.tableCell} style={{ textAlign: 'right' }}>{money(row.dinero_vendido)}</td>
                        <td className={styles.tableCell} style={{ 
                          textAlign: 'right',
                          color: row.cumplimiento >= 100 ? '#28a745' : 
                                 row.cumplimiento >= 80 ? '#ffc107' : '#dc3545',
                          fontWeight: 600
                        }}>
                          {pct(row.cumplimiento)}
                        </td>
                        <td className={styles.tableCell} style={{ textAlign: 'right' }}>{row.cantidad_vendida}</td>
                        <td className={styles.tableCell} style={{ textAlign: 'right' }}>{row.inventario_cantidad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </section>
        </>
      )}
    </main>
  );
};

export default AnalisisVentas;