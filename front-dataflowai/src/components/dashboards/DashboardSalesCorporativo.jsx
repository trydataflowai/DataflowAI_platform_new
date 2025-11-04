import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import dashboardStyles from '../../styles/Dashboards/DashboardSalesCorporativo.module.css';

import {
  getCotizaciones,
  getMetas,
  aplicarFiltros,
  aplicarFiltrosCotizaciones,
  calcularEstadisticas,
  obtenerValoresUnicosCombinados,
  formatearMoneda,
  handleAuthError,
  calcularAnalisisAdicional,
} from '../../api/DashboardsCrudApis/CrudDashboardSalesCorporativoInicio';

// MultiSelectDropdown component (self-contained)
const MultiSelectDropdown = ({ label, options = [], selected = [], onChange, placeholder = 'Seleccionar', maxHeight = 200 }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const clearAll = (e) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div className={dashboardStyles.DashSalesCorpoFilterItem} ref={ref} style={{ position: 'relative' }}>
      <label className={dashboardStyles.DashSalesCorpoLabel} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{label} {selected.length > 0 && <span style={{ color: '#10b981', fontWeight: 'bold' }}>({selected.length})</span>}</span>
        {selected.length > 0 && <button onClick={clearAll} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }} title="Limpiar">✖</button>}
      </label>

      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={dashboardStyles.DashSalesCorpoMultiSelectBtn}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: 6,
          backgroundColor: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>
          {selected.length === 0 ? placeholder : options.filter(o => selected.includes(o)).join(', ')}
        </span>
        <span style={{ marginLeft: 8 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          width: '100%',
          zIndex: 30,
          border: '1px solid #e5e7eb',
          borderRadius: 6,
          background: 'white',
          boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
          maxHeight: maxHeight,
          overflowY: 'auto',
          padding: '6px'
        }}>
          {options.length === 0 && <div style={{ padding: 8, color: '#6b7280' }}>Sin opciones</div>}
          {options.map(opt => (
            <label key={opt} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '6px 8px',
              cursor: 'pointer',
              borderRadius: 4,
              marginBottom: 4
            }}>
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggleOption(opt)}
                style={{ marginRight: 8 }}
              />
              <span style={{ fontSize: 14 }}>{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const DashboardVentasCorporativo = () => {
  const navigate = useNavigate();

  // carga e estado
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [metas, setMetas] = useState([]);
  const [filteredCotizaciones, setFilteredCotizaciones] = useState([]);
  const [filteredMetas, setFilteredMetas] = useState([]);

  // filtros principales (seccion superior)
  const [filters, setFilters] = useState({
    ano: [],
    mes: [],
    categoriaCliente: [],
    nombreCliente: [],
    categoriaProducto: [],
    fechaDesde: '',
    fechaHasta: '',
    marcas: [],
    productos: [],
    estadoCotizacion: []
  });

  // filtros exclusivos para la seccion de analisis (solo cotizaciones)
  const [filtersAnalisis, setFiltersAnalisis] = useState({
    fechaDesde: '',
    fechaHasta: '',
    mes: [],
    categoriaCliente: [],
    nombreCliente: [],
    categoriaProducto: [],
    marcas: [],
    productos: [],
    estadoCotizacion: []
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [cotizacionesData, metasData] = await Promise.all([
        getCotizaciones(),
        getMetas()
      ]);

      setCotizaciones(cotizacionesData);
      setMetas(metasData);
      setFilteredCotizaciones(cotizacionesData);
      setFilteredMetas(metasData);
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError(err.message || 'Error al cargar el dashboard');
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  // aplicar filtros para la seccion principal (metas + cotizaciones)
  useEffect(() => {
    const { filteredCot, filteredMet } = aplicarFiltros(cotizaciones, metas, filters);
    setFilteredCotizaciones(filteredCot);
    setFilteredMetas(filteredMet);
  }, [filters, cotizaciones, metas]);

  // Para la seccion de analisis: aplicamos solo sobre cotizaciones con filtersAnalisis
  const cotizacionesParaAnalisis = aplicarFiltrosCotizaciones(cotizaciones, filtersAnalisis);
  const analisisAdicional = calcularAnalisisAdicional(cotizacionesParaAnalisis);

  const clearFilters = () => {
    setFilters({
      ano: [],
      mes: [],
      categoriaCliente: [],
      nombreCliente: [],
      categoriaProducto: [],
      fechaDesde: '',
      fechaHasta: '',
      marcas: [],
      productos: [],
      estadoCotizacion: []
    });
  };

  const clearFiltersAnalisis = () => {
    setFiltersAnalisis({
      fechaDesde: '',
      fechaHasta: '',
      mes: [],
      categoriaCliente: [],
      nombreCliente: [],
      categoriaProducto: [],
      marcas: [],
      productos: [],
      estadoCotizacion: []
    });
  };

  const handleFilterArrayChange = (filterName, newArray) => {
    setFilters(prev => ({ ...prev, [filterName]: newArray }));
  };

  const handleFilterAnalisisChange = (filterName, newArray) => {
    setFiltersAnalisis(prev => ({ ...prev, [filterName]: newArray }));
  };

  // Estadisticas base
  const stats = calcularEstadisticas(filteredCotizaciones, filteredMetas);

  const calcularCumplimientoConMeta = () => {
    const metaTotal = filteredMetas.reduce((sum, m) => sum + parseFloat(m.meta || 0), 0);
    const clientesConMeta = new Set(filteredMetas.map(m => m.nombre_cliente));
    const cotizacionesCerradasConMeta = filteredCotizaciones.filter(c =>
      Number(c.estado_cotizacion) === 100 && clientesConMeta.has(c.nombre_cliente)
    );
    const vendidoConMeta = cotizacionesCerradasConMeta.reduce((sum, c) => {
      const valor = (parseFloat(c.precio_unitario) || 0) * (Number(c.unidades) || 0);
      return sum + valor;
    }, 0);
    const porcentajeConMeta = metaTotal > 0 ? ((vendidoConMeta / metaTotal) * 100).toFixed(1) : '0.0';
    return {
      vendidoConMeta,
      porcentajeConMeta: parseFloat(porcentajeConMeta)
    };
  };

  const cumplimientoConMeta = calcularCumplimientoConMeta();

  // datos para dropdowns (tomados del dataset completo)
  const anos = obtenerValoresUnicosCombinados(metas, cotizaciones, 'ano');
  const meses = obtenerValoresUnicosCombinados(metas, cotizaciones, 'mes');
  const categoriasClientes = obtenerValoresUnicosCombinados(metas, cotizaciones, 'categoria_cliente');
  const nombresClientes = obtenerValoresUnicosCombinados(metas, cotizaciones, 'nombre_cliente');
  const categoriasProductos = obtenerValoresUnicosCombinados(metas, cotizaciones, 'categoria_producto');
  const marcas = obtenerValoresUnicosCombinados(metas, cotizaciones, 'marca');
  const productos = obtenerValoresUnicosCombinados(metas, cotizaciones, 'producto');
  const estados = [...new Set(cotizaciones.map(c => String(Number(c.estado_cotizacion))))].sort((a, b) => Number(b) - Number(a));

  // helpers para graficos y tablas (se mantienen similares)
  const getCategoriaClienteData = () => {
    const categoriasMap = {};

    filteredMetas.forEach(meta => {
      const cat = meta.categoria_cliente || 'Sin categoria';
      if (!categoriasMap[cat]) categoriasMap[cat] = { categoria: cat, meta: 0, vendido: 0 };
      categoriasMap[cat].meta += parseFloat(meta.meta || 0);
    });

    const cotizacionesCerradas = filteredCotizaciones.filter(c => Number(c.estado_cotizacion) === 100);
    cotizacionesCerradas.forEach(cot => {
      const cat = cot.categoria_cliente || 'Sin categoria';
      if (!categoriasMap[cat]) categoriasMap[cat] = { categoria: cat, meta: 0, vendido: 0 };
      const valor = (parseFloat(cot.precio_unitario) || 0) * (Number(cot.unidades) || 0);
      categoriasMap[cat].vendido += valor;
    });

    return Object.values(categoriasMap);
  };

  const getCategoriaProductoData = () => {
    const categoriasMap = {};

    filteredMetas.forEach(meta => {
      const cat = meta.categoria_producto || 'Sin categoria';
      if (!categoriasMap[cat]) categoriasMap[cat] = { categoria: cat, meta: 0, vendido: 0 };
      categoriasMap[cat].meta += parseFloat(meta.meta || 0);
    });

    const cotizacionesCerradas = filteredCotizaciones.filter(c => Number(c.estado_cotizacion) === 100);
    cotizacionesCerradas.forEach(cot => {
      const cat = cot.categoria_producto || 'Sin categoria';
      if (!categoriasMap[cat]) categoriasMap[cat] = { categoria: cat, meta: 0, vendido: 0 };
      const valor = (parseFloat(cot.precio_unitario) || 0) * (Number(cot.unidades) || 0);
      categoriasMap[cat].vendido += valor;
    });

    return Object.values(categoriasMap);
  };

  const getClienteData = () => {
    const clientesMap = {};

    filteredMetas.forEach(meta => {
      const cliente = meta.nombre_cliente || 'Sin nombre';
      if (!clientesMap[cliente]) {
        clientesMap[cliente] = { cliente, meta: 0, vendido: 0, tieneMeta: true };
      }
      clientesMap[cliente].meta += parseFloat(meta.meta || 0);
    });

    const cotizacionesCerradas = filteredCotizaciones.filter(c => Number(c.estado_cotizacion) === 100);
    cotizacionesCerradas.forEach(cot => {
      const cliente = cot.nombre_cliente || 'Sin nombre';
      if (!clientesMap[cliente]) {
        clientesMap[cliente] = { cliente, meta: 0, vendido: 0, tieneMeta: false };
      }
      const valor = (parseFloat(cot.precio_unitario) || 0) * (Number(cot.unidades) || 0);
      clientesMap[cliente].vendido += valor;
    });

    return Object.values(clientesMap)
      .sort((a, b) => b.meta - a.meta)
      .slice(0, 15);
  };

  const getTableData = () => {
    const clientesMap = {};

    filteredMetas.forEach(meta => {
      const cliente = meta.nombre_cliente || 'Sin nombre';
      if (!clientesMap[cliente]) {
        clientesMap[cliente] = {
          cliente,
          categoria: meta.categoria_cliente,
          meta: 0,
          vendido: 0,
          tieneMeta: true,
        };
      }
      clientesMap[cliente].meta += parseFloat(meta.meta || 0);
    });

    const cotizacionesCerradas = filteredCotizaciones.filter(c => Number(c.estado_cotizacion) === 100);
    cotizacionesCerradas.forEach(cot => {
      const cliente = cot.nombre_cliente || 'Sin nombre';
      if (!clientesMap[cliente]) {
        clientesMap[cliente] = {
          cliente,
          categoria: cot.categoria_cliente,
          meta: 0,
          vendido: 0,
          tieneMeta: false,
        };
      }
      const valor = (parseFloat(cot.precio_unitario) || 0) * (Number(cot.unidades) || 0);
      clientesMap[cliente].vendido += valor;
    });

    return Object.values(clientesMap)
      .filter(c => c.vendido > 0 || c.meta > 0)
      .sort((a, b) => b.vendido - a.vendido);
  };

  const getEstadoBadge = (porcentaje, tieneMeta) => {
    if (!tieneMeta) {
      return <span className={`${dashboardStyles.DashSalesCorpoBadge} ${dashboardStyles.DashSalesCorpoBadgeInfo}`}>Sin Meta</span>;
    }
    if (porcentaje >= 100) {
      return <span className={`${dashboardStyles.DashSalesCorpoBadge} ${dashboardStyles.DashSalesCorpoBadgeSuccess}`}>Excelente</span>;
    }
    if (porcentaje >= 80) {
      return <span className={`${dashboardStyles.DashSalesCorpoBadge} ${dashboardStyles.DashSalesCorpoBadgeWarning}`}>Bueno</span>;
    }
    return <span className={`${dashboardStyles.DashSalesCorpoBadge} ${dashboardStyles.DashSalesCorpoBadgeDanger}`}>Bajo</span>;
  };

  if (loading) {
    return <div className={dashboardStyles.DashSalesCorpoLoading}>Cargando datos del dashboard...</div>;
  }

  if (error) {
    return (
      <div className={dashboardStyles.DashSalesCorpoContainer}>
        <div style={{
          padding: '20px',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3>ERROR al cargar el dashboard</h3>
          <p>{error}</p>
          <button
            onClick={loadData}
            style={{
              marginTop: '10px',
              padding: '10px 20px',
              backgroundColor: '#991b1b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={dashboardStyles.DashSalesCorpoContainer}>
      <div className={dashboardStyles.DashSalesCorpoHeader}>
        <h1 className={dashboardStyles.DashSalesCorpoTitle}>📊 Dashboard de Ventas Corporativo - Inicio</h1>

        <div className={dashboardStyles.DashSalesCorpoNavButtons}>
          <button
            onClick={() => navigate("/DashboardSalescorporativo")}
            className={`${dashboardStyles.DashSalesCorpoNavBtn} ${dashboardStyles.DashSalesCorpoBtnInicio}`}
            type="button"
          >
            INICIO
          </button>

          <button
            onClick={() => navigate("/dashboardSalescorporativo/Metas")}
            className={`${dashboardStyles.DashSalesCorpoNavBtn} ${dashboardStyles.DashSalesCorpoBtnMetas}`}
            type="button"
          >
            METAS
          </button>

          <button
            onClick={() => navigate("/dashboardSalescorporativo/Cotizaciones")}
            className={`${dashboardStyles.DashSalesCorpoNavBtn} ${dashboardStyles.DashSalesCorpoBtnCotizaciones}`}
            type="button"
          >
            COTIZACIONES
          </button>
        </div>
      </div>

      {/* FILTROS PRINCIPALES (seccion superior) */}
      <div className={dashboardStyles.DashSalesCorpoFiltersContainer}>
        <h3 className={dashboardStyles.DashSalesCorpoFiltersTitle}>🔍 Filtros de Analisis Metas vs Cotizaciones</h3>
        <div className={dashboardStyles.DashSalesCorpoFiltersGrid}>

          <MultiSelectDropdown
            label="Ano"
            options={anos}
            selected={filters.ano}
            onChange={(arr) => handleFilterArrayChange('ano', arr)}
            placeholder="Todos los anos"
            maxHeight={180}
          />

          <MultiSelectDropdown
            label="Mes"
            options={meses}
            selected={filters.mes}
            onChange={(arr) => handleFilterArrayChange('mes', arr)}
            placeholder="Todos los meses"
            maxHeight={180}
          />

          <MultiSelectDropdown
            label="Categoria Cliente"
            options={categoriasClientes}
            selected={filters.categoriaCliente}
            onChange={(arr) => handleFilterArrayChange('categoriaCliente', arr)}
            placeholder="Todas las categorias"
            maxHeight={180}
          />

          <MultiSelectDropdown
            label="Cliente"
            options={nombresClientes}
            selected={filters.nombreCliente}
            onChange={(arr) => handleFilterArrayChange('nombreCliente', arr)}
            placeholder="Todos los clientes"
            maxHeight={180}
          />

          <MultiSelectDropdown
            label="Categoria Producto"
            options={categoriasProductos}
            selected={filters.categoriaProducto}
            onChange={(arr) => handleFilterArrayChange('categoriaProducto', arr)}
            placeholder="Todas las categorias"
            maxHeight={180}
          />

    
          <MultiSelectDropdown
            label="Marcas"
            options={marcas}
            selected={filters.marcas}
            onChange={(arr) => handleFilterArrayChange('marcas', arr)}
            placeholder="Todas las marcas"
            maxHeight={180}
          />


          <MultiSelectDropdown
            label="Estado Cotizacion"
            options={estados}
            selected={filters.estadoCotizacion}
            onChange={(arr) => handleFilterArrayChange('estadoCotizacion', arr)}
            placeholder="Todos los estados"
            maxHeight={180}
          />

          <button className={dashboardStyles.DashSalesCorpoBtnClear} onClick={clearFilters}>
            🧹 Limpiar Filtros
          </button>
        </div>
      </div>

      {/* CARDS Y GRAFICOS INICIALES (sin cambios funcionales) */}
      <div className={dashboardStyles.DashSalesCorpoCardsContainer}>
        <div className={dashboardStyles.DashSalesCorpoCard}>
          <div className={dashboardStyles.DashSalesCorpoCardIcon} style={{ background: '#dbeafe' }}>🎯</div>
          <h3 className={dashboardStyles.DashSalesCorpoCardTitle}>Meta Total</h3>
          <div className={dashboardStyles.DashSalesCorpoCardValue}>{formatearMoneda(stats.metaTotal)}</div>
        </div>

        <div className={dashboardStyles.DashSalesCorpoCard}>
          <div className={dashboardStyles.DashSalesCorpoCardIcon} style={{ background: '#d1fae5' }}>🏆</div>
          <h3 className={dashboardStyles.DashSalesCorpoCardTitle}>Vendido Real</h3>
          <div className={dashboardStyles.DashSalesCorpoCardValue}>{formatearMoneda(stats.vendidoReal)}</div>
        </div>

        <div className={dashboardStyles.DashSalesCorpoCard}>
          <div className={dashboardStyles.DashSalesCorpoCardIcon} style={{ background: stats.porcentajeCumplimiento >= 100 ? '#d1fae5' : '#fef3c7' }}>📊</div>
          <h3 className={dashboardStyles.DashSalesCorpoCardTitle}>% Cumplimiento</h3>
          <div className={dashboardStyles.DashSalesCorpoCardValue}>{stats.porcentajeCumplimiento}%</div>
          <div style={{
            fontSize: '11px',
            color: '#666',
            marginTop: '8px',
            padding: '0 8px'
          }}>
            (Real: {stats.porcentajeCumplimiento}% | Con meta: {cumplimientoConMeta.porcentajeConMeta}%)
          </div>
        </div>

        <div className={dashboardStyles.DashSalesCorpoCard}>
          <div className={dashboardStyles.DashSalesCorpoCardIcon} style={{ background: stats.diferencia >= 0 ? '#d1fae5' : '#fee2e2' }}>⚖️</div>
          <h3 className={dashboardStyles.DashSalesCorpoCardTitle}>Diferencia vs Meta</h3>
          <div className={dashboardStyles.DashSalesCorpoCardValue} style={{ color: stats.diferencia >= 0 ? '#10b981' : '#ef4444' }}>
            {formatearMoneda(stats.diferencia)}
          </div>
        </div>
      </div>

      {/* GRAFICOS INICIALES */}
      <div className={dashboardStyles.DashSalesCorpoChartsContainer}>
        <div className={dashboardStyles.DashSalesCorpoChartItem}>
          <h3 className={dashboardStyles.DashSalesCorpoChartTitle}>Cumplimiento por Categoria Cliente</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getCategoriaClienteData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="categoria" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value) => formatearMoneda(value)} />
              <Legend />
              <Bar dataKey="meta" fill="#3498db" name="Meta" />
              <Bar dataKey="vendido" fill="#27ae60" name="Vendido" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={dashboardStyles.DashSalesCorpoChartItem}>
          <h3 className={dashboardStyles.DashSalesCorpoChartTitle}>Cumplimiento por Categoria Producto</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getCategoriaProductoData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="categoria" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value) => formatearMoneda(value)} />
              <Legend />
              <Bar dataKey="meta" fill="#3498db" name="Meta" />
              <Bar dataKey="vendido" fill="#27ae60" name="Vendido" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={`${dashboardStyles.DashSalesCorpoChartsContainer} ${dashboardStyles.DashSalesCorpoChartWide}`}>
        <div className={dashboardStyles.DashSalesCorpoChartItem}>
          <h3 className={dashboardStyles.DashSalesCorpoChartTitle}>Meta vs Vendido por Cliente</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={getClienteData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cliente" angle={-45} textAnchor="end" height={120} />
              <YAxis />
              <Tooltip formatter={(value) => formatearMoneda(value)} />
              <Legend />
              <Bar dataKey="meta" fill="#3498db" name="Meta" />
              <Bar dataKey="vendido" fill="#27ae60" name="Vendido" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABLA FINAL RESUMEN EXISTENTE */}
      <div className={dashboardStyles.DashSalesCorpoTableContainer} style={{ marginTop: 16 }}>
        <div className={dashboardStyles.DashSalesCorpoTableHeader}>
          <span style={{ fontSize: '20px' }}>📋</span>
          <h3 style={{ margin: 0 }}>Resumen de Cumplimiento por Cliente</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className={dashboardStyles.DashSalesCorpoTable}>
            <thead>
              <tr>
                <th className={dashboardStyles.DashSalesCorpoTh}>Cliente</th>
                <th className={dashboardStyles.DashSalesCorpoTh}>Categoria</th>
                <th className={dashboardStyles.DashSalesCorpoTh}>Meta</th>
                <th className={dashboardStyles.DashSalesCorpoTh}>Vendido</th>
                <th className={dashboardStyles.DashSalesCorpoTh}>% Cumplimiento</th>
                <th className={dashboardStyles.DashSalesCorpoTh}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {getTableData().map((row, idx) => {
                const porcentaje = row.meta > 0 ? (row.vendido / row.meta * 100).toFixed(1) : 0;

                let backgroundColor;
                if (!row.tieneMeta && row.vendido > 0) {
                  backgroundColor = '#F8FAA0';
                } else {
                  backgroundColor = idx % 2 === 0 ? '#f9f9f9' : 'white';
                }

                return (
                  <tr key={idx} style={{ background: backgroundColor }}>
                    <td className={dashboardStyles.DashSalesCorpoTd}>{row.cliente}</td>
                    <td className={dashboardStyles.DashSalesCorpoTd}>{row.categoria || 'N/A'}</td>
                    <td className={dashboardStyles.DashSalesCorpoTd}>{row.tieneMeta ? formatearMoneda(row.meta) : 'N/A'}</td>
                    <td className={dashboardStyles.DashSalesCorpoTd}>{formatearMoneda(row.vendido)}</td>
                    <td className={dashboardStyles.DashSalesCorpoTd}>{row.tieneMeta ? `${porcentaje}%` : 'N/A'}</td>
                    <td className={dashboardStyles.DashSalesCorpoTd}>{getEstadoBadge(parseFloat(porcentaje), row.tieneMeta)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* NUEVA SECCION: filtros EXCLUSIVOS para analisis de cotizaciones */}
      <div className={dashboardStyles.DashSalesCorpoFiltersContainer} style={{ marginTop: 18 }}>
        <h3 className={dashboardStyles.DashSalesCorpoFiltersTitle}>🔎 Filtros Analisis Cotizaciones</h3>
        <div className={dashboardStyles.DashSalesCorpoFiltersGrid}>

          <MultiSelectDropdown
            label="Mes"
            options={meses}
            selected={filtersAnalisis.mes}
            onChange={(arr) => handleFilterAnalisisChange('mes', arr)}
            placeholder="Todos los meses"
            maxHeight={180}
          />

          <MultiSelectDropdown
            label="Categoria Cliente"
            options={categoriasClientes}
            selected={filtersAnalisis.categoriaCliente}
            onChange={(arr) => handleFilterAnalisisChange('categoriaCliente', arr)}
            placeholder="Todas las categorias"
            maxHeight={180}
          />

          <MultiSelectDropdown
            label="Cliente"
            options={nombresClientes}
            selected={filtersAnalisis.nombreCliente}
            onChange={(arr) => handleFilterAnalisisChange('nombreCliente', arr)}
            placeholder="Todos los clientes"
            maxHeight={180}
          />

          <MultiSelectDropdown
            label="Categoria Producto"
            options={categoriasProductos}
            selected={filtersAnalisis.categoriaProducto}
            onChange={(arr) => handleFilterAnalisisChange('categoriaProducto', arr)}
            placeholder="Todas las categorias"
            maxHeight={180}
          />

          <MultiSelectDropdown
            label="Marcas"
            options={marcas}
            selected={filtersAnalisis.marcas}
            onChange={(arr) => handleFilterAnalisisChange('marcas', arr)}
            placeholder="Todas las marcas"
            maxHeight={180}
          />


          <MultiSelectDropdown
            label="Estado Cotizacion"
            options={estados}
            selected={filtersAnalisis.estadoCotizacion}
            onChange={(arr) => handleFilterAnalisisChange('estadoCotizacion', arr)}
            placeholder="Todos los estados"
            maxHeight={180}
          />

          <button className={dashboardStyles.DashSalesCorpoBtnClear} onClick={clearFiltersAnalisis}>
            🧹 Limpiar Filtros
          </button>
        </div>
      </div>

      {/* SECCION ANALISIS (usa cotizaciones filtradas por filtersAnalisis) */}
      <div className={dashboardStyles.DashSalesCorpoAnalisisContainer} style={{ marginTop: 12 }}>
  <div className={dashboardStyles.DashSalesCorpoCardsContainer}>
    <div className={dashboardStyles.DashSalesCorpoCard}>
      <div className={dashboardStyles.DashSalesCorpoCardIcon} style={{ background: '#d1fae5' }}>💰</div>
      <h3 className={dashboardStyles.DashSalesCorpoCardTitle}>Ventas (estado 100)</h3>
      <div className={dashboardStyles.DashSalesCorpoCardValue}>{formatearMoneda(analisisAdicional.ventasEstado100)}</div>
    </div>

    <div className={dashboardStyles.DashSalesCorpoCard}>
      <div className={dashboardStyles.DashSalesCorpoCardIcon} style={{ background: '#eef2ff' }}>📦</div>
      <h3 className={dashboardStyles.DashSalesCorpoCardTitle}>Ordenes</h3>
      <div className={dashboardStyles.DashSalesCorpoCardValue}>{analisisAdicional.totalOrdenesDistinct}</div>
    </div>

    <div className={dashboardStyles.DashSalesCorpoCard}>
      <div className={dashboardStyles.DashSalesCorpoCardIcon} style={{ background: '#fff7ed' }}>🔁</div>
      <h3 className={dashboardStyles.DashSalesCorpoCardTitle}>% Ordenes al 100</h3>
      <div className={dashboardStyles.DashSalesCorpoCardValue}>{analisisAdicional.porcentajeOrdenes100.toFixed(1)}%</div>
    </div>

    <div className={dashboardStyles.DashSalesCorpoCard}>
      <div className={dashboardStyles.DashSalesCorpoCardIcon} style={{ background: '#fee2e2' }}>🧾</div>
      <h3 className={dashboardStyles.DashSalesCorpoCardTitle}>Valor total ordenes</h3>
      <div className={dashboardStyles.DashSalesCorpoCardValue}>{formatearMoneda(analisisAdicional.valorTodasOrdenes)}</div>
    </div>
  </div>


<div
  className={dashboardStyles.DashSalesCorpoChartsContainer}
  style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: '12px',
    marginTop: 12
  }}
>
  <div
    className={dashboardStyles.DashSalesCorpoChartItem}
    style={{ flex: '1', background: 'white', borderRadius: 8, padding: 12 }}
  >
    <h4 className={dashboardStyles.DashSalesCorpoChartTitle}>Acumulado $ por Estado de Cotizacion</h4>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={analisisAdicional.dataPorEstado}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="estado" />
        <YAxis />
        <Tooltip formatter={(value) => formatearMoneda(value)} />
        <Bar dataKey="valor" name="Valor" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  </div>

<div
  className={dashboardStyles.DashSalesCorpoChartItem}
  style={{
    flex: '1',
    background: 'white',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  }}
>
  <h4
    className={dashboardStyles.DashSalesCorpoChartTitle}
    style={{
      fontSize: '16px',
      fontWeight: 600,
      marginBottom: 12,
      color: '#1f2937',
    }}
  >
    Distribucion por Categoria Producto
  </h4>

  <ResponsiveContainer width="100%" height={300}>
    <PieChart>
      <Tooltip formatter={(value) => formatearMoneda(value)} />
      <Legend />

      <Pie
        data={analisisAdicional.dataPorCategoria}
        dataKey="valor"
        nameKey="categoria"
        outerRadius={110}
      >
        {analisisAdicional.dataPorCategoria.map((entry, index) => {
          const hue = (index * 137.508) % 360;
          const color = `hsl(${hue}, 65%, 65%)`;
          return <Cell key={`cell-${index}`} fill={color} stroke="white" strokeWidth={1.5} />;
        })}
      </Pie>
    </PieChart>
  </ResponsiveContainer>
</div>


</div>


        <div className={dashboardStyles.DashSalesCorpoChartsContainer} style={{ marginTop: 12 }}>
          <div className={dashboardStyles.DashSalesCorpoChartItem} style={{ width: '100%' }}>
            <h4 className={dashboardStyles.DashSalesCorpoChartTitle}>Top Clientes - Vendido (estado 100)</h4>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={analisisAdicional.barrasClientes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="cliente" angle={-45} textAnchor="end" height={120} />
                <YAxis />
                <Tooltip formatter={(value) => formatearMoneda(value)} />
                <Bar dataKey="vendido100" name="Vendido 100" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TABLA: Resumen por Cliente (estilo igual a la tabla existente) */}
<div className={dashboardStyles.DashSalesCorpoTableContainer} style={{ marginTop: 12 }}>
  <div className={dashboardStyles.DashSalesCorpoTableHeader}>
    <span style={{ fontSize: '20px' }}>📋</span>
    <h3 style={{ margin: 0 }}>Resumen por Cliente</h3>
  </div>

  <div style={{ overflowX: 'auto' }}>
    <table className={dashboardStyles.DashSalesCorpoTable}>
      <thead>
        <tr>
          <th className={dashboardStyles.DashSalesCorpoTh}>Cliente</th>
          <th className={dashboardStyles.DashSalesCorpoTh}>Total Ordenes</th>
          <th className={dashboardStyles.DashSalesCorpoTh}>Vendido al 100 $</th>
          <th className={dashboardStyles.DashSalesCorpoTh}>En proceso $</th>
          <th className={dashboardStyles.DashSalesCorpoTh}>% Conversion</th>
        </tr>
      </thead>

      <tbody>
        {analisisAdicional.resumenClientes && analisisAdicional.resumenClientes.map((r, idx) => {
          const backgroundColor = idx % 2 === 0 ? '#f9f9f9' : 'white';

          return (
            <tr key={r.cliente + idx} style={{ background: backgroundColor }}>
              <td className={dashboardStyles.DashSalesCorpoTd}>{r.cliente}</td>
              <td className={dashboardStyles.DashSalesCorpoTd}>{r.totalOrdenesDistinct}</td>
              <td className={dashboardStyles.DashSalesCorpoTd}>{formatearMoneda(r.vendido100)}</td>
              <td className={dashboardStyles.DashSalesCorpoTd}>{formatearMoneda(r.enProceso)}</td>
              <td className={dashboardStyles.DashSalesCorpoTd}>{r.porcentajeConversion ? `${r.porcentajeConversion.toFixed(1)}%` : '0.0%'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
</div>
        </div>

      

    </div>
  );
};

export default DashboardVentasCorporativo;
