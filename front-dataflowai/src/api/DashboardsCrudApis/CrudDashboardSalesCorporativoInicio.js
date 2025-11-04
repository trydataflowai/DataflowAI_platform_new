// front-dataflowai/src/api/DashboardsCrudApis/CrudDashboardSalesCorporativoInicio.js

// URL base de tu API - AJUSTA SEGUN TU CONFIGURACION
const API_BASE_URL = 'http://localhost:8000/api'; // Cambia esto por tu URL real

// Funcion para obtener el token del usuario logueado
const getToken = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No se encontro token de autenticacion');
  }
  return token;
};

// Headers comunes para las peticiones
const getHeaders = () => {
  const token = getToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Obtener cotizaciones
export const getCotizaciones = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard_salescorporativo_prod15/`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Normalizar los datos para asegurar tipos correctos
    return data.map(item => ({
      ...item,
      estado_cotizacion: Number(item.estado_cotizacion),
      unidades: Number(item.unidades) || 0,
      precio_unitario: parseFloat(item.precio_unitario) || 0,
      fecha: item.fecha,
    }));
  } catch (error) {
    console.error('Error en getCotizaciones:', error);
    throw error;
  }
};

// Obtener metas
export const getMetas = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard_salescorporativometas/product15/`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Normalizar los datos para asegurar tipos correctos
    return data.map(item => ({
      ...item,
      ano: Number(item.ano),
      meta: parseFloat(item.meta) || 0,
      mes: item.mes,
    }));
  } catch (error) {
    console.error('Error en getMetas:', error);
    throw error;
  }
};

// Funcion para obtener valores unicos combinando metas y cotizaciones
export const obtenerValoresUnicosCombinados = (metas, cotizaciones, field) => {
  let valores = [];

  if (field === 'ano') {
    const anosMetas = metas.map(m => Number(m.ano)).filter(a => !isNaN(a));
    const anosCotizaciones = cotizaciones
      .filter(c => c.fecha)
      .map(c => {
        const fecha = new Date(c.fecha);
        return fecha.getFullYear();
      })
      .filter(a => !isNaN(a));
    valores = [...anosMetas, ...anosCotizaciones];
  } else if (field === 'mes') {
    const mesesMetas = metas.map(m => m.mes).filter(Boolean);
    const mesesCotizaciones = cotizaciones.map(c => c.mes_nombre).filter(Boolean);
    valores = [...mesesMetas, ...mesesCotizaciones];
  } else {
    const valoresMetas = metas.map(m => m[field]).filter(Boolean);
    const valoresCotizaciones = cotizaciones.map(c => c[field]).filter(Boolean);
    valores = [...valoresMetas, ...valoresCotizaciones];
  }

  const valoresUnicos = [...new Set(valores)];

  return valoresUnicos.sort((a, b) => {
    if (typeof a === 'number' && typeof b === 'number') {
      return b - a;
    }
    return String(a).localeCompare(String(b));
  });
};

// aplicarFiltros original (para la primera parte del dashboard)
export const aplicarFiltros = (cotizaciones, metas, filters) => {
  let filteredCot = [...cotizaciones];
  let filteredMet = [...metas];

  // Filtro por rango de fechas
  if (filters.fechaDesde || filters.fechaHasta) {
    const desde = filters.fechaDesde ? new Date(filters.fechaDesde) : null;
    const hasta = filters.fechaHasta ? new Date(filters.fechaHasta) : null;

    filteredCot = filteredCot.filter(c => {
      if (!c.fecha) return false;
      const f = new Date(c.fecha);
      if (desde && f < desde) return false;
      if (hasta && f > hasta) return false;
      return true;
    });
  }

  // Ano
  if (filters.ano && filters.ano.length > 0) {
    const anosSeleccionados = filters.ano.map(a => Number(a));
    filteredMet = filteredMet.filter(m => anosSeleccionados.includes(Number(m.ano)));
    filteredCot = filteredCot.filter(c => {
      if (!c.fecha) return false;
      const fecha = new Date(c.fecha);
      return anosSeleccionados.includes(fecha.getFullYear());
    });
  }

  // Mes
  if (filters.mes && filters.mes.length > 0) {
    filteredMet = filteredMet.filter(m => filters.mes.includes(m.mes));
    filteredCot = filteredCot.filter(c => filters.mes.includes(c.mes_nombre));
  }

  // Categoria cliente
  if (filters.categoriaCliente && filters.categoriaCliente.length > 0) {
    filteredMet = filteredMet.filter(m => filters.categoriaCliente.includes(m.categoria_cliente));
    filteredCot = filteredCot.filter(c => filters.categoriaCliente.includes(c.categoria_cliente));
  }

  // Nombre cliente
  if (filters.nombreCliente && filters.nombreCliente.length > 0) {
    filteredMet = filteredMet.filter(m => filters.nombreCliente.includes(m.nombre_cliente));
    filteredCot = filteredCot.filter(c => filters.nombreCliente.includes(c.nombre_cliente));
  }

  // Categoria producto
  if (filters.categoriaProducto && filters.categoriaProducto.length > 0) {
    filteredMet = filteredMet.filter(m => filters.categoriaProducto.includes(m.categoria_producto));
    filteredCot = filteredCot.filter(c => filters.categoriaProducto.includes(c.categoria_producto));
  }

  // Marcas
  if (filters.marcas && filters.marcas.length > 0) {
    filteredCot = filteredCot.filter(c => filters.marcas.includes(c.marca));
  }

  // Productos
  if (filters.productos && filters.productos.length > 0) {
    filteredCot = filteredCot.filter(c => filters.productos.includes(c.producto));
  }

  // Estado cotizacion
  if (filters.estadoCotizacion && filters.estadoCotizacion.length > 0) {
    const estadosNum = filters.estadoCotizacion.map(s => {
      const n = Number(s);
      return isNaN(n) ? s : n;
    });
    filteredCot = filteredCot.filter(c => estadosNum.includes(Number(c.estado_cotizacion)));
  }

  return { filteredCot, filteredMet };
};

// Nueva funcion: aplica filtros SOLO a cotizaciones (para la seccion analisis)
export const aplicarFiltrosCotizaciones = (cotizaciones, filtersCot) => {
  let filtered = [...cotizaciones];

  // Rango fechas
  if (filtersCot.fechaDesde || filtersCot.fechaHasta) {
    const desde = filtersCot.fechaDesde ? new Date(filtersCot.fechaDesde) : null;
    const hasta = filtersCot.fechaHasta ? new Date(filtersCot.fechaHasta) : null;
    filtered = filtered.filter(c => {
      if (!c.fecha) return false;
      const f = new Date(c.fecha);
      if (desde && f < desde) return false;
      if (hasta && f > hasta) return false;
      return true;
    });
  }

  // Mes
  if (filtersCot.mes && filtersCot.mes.length > 0) {
    filtered = filtered.filter(c => filtersCot.mes.includes(c.mes_nombre));
  }

  // Categoria cliente
  if (filtersCot.categoriaCliente && filtersCot.categoriaCliente.length > 0) {
    filtered = filtered.filter(c => filtersCot.categoriaCliente.includes(c.categoria_cliente));
  }

  // Nombre cliente
  if (filtersCot.nombreCliente && filtersCot.nombreCliente.length > 0) {
    filtered = filtered.filter(c => filtersCot.nombreCliente.includes(c.nombre_cliente));
  }

  // Categoria producto
  if (filtersCot.categoriaProducto && filtersCot.categoriaProducto.length > 0) {
    filtered = filtered.filter(c => filtersCot.categoriaProducto.includes(c.categoria_producto));
  }

  // Marcas
  if (filtersCot.marcas && filtersCot.marcas.length > 0) {
    filtered = filtered.filter(c => filtersCot.marcas.includes(c.marca));
  }

  // Productos
  if (filtersCot.productos && filtersCot.productos.length > 0) {
    filtered = filtered.filter(c => filtersCot.productos.includes(c.producto));
  }

  // Estado cotizacion
  if (filtersCot.estadoCotizacion && filtersCot.estadoCotizacion.length > 0) {
    const estadosNum = filtersCot.estadoCotizacion.map(s => {
      const n = Number(s);
      return isNaN(n) ? s : n;
    });
    filtered = filtered.filter(c => estadosNum.includes(Number(c.estado_cotizacion)));
  }

  return filtered;
};

// Funcion para calcular estadisticas existentes
export const calcularEstadisticas = (filteredCotizaciones, filteredMetas) => {
  const metaTotal = filteredMetas.reduce((sum, m) => sum + parseFloat(m.meta || 0), 0);

  const cotizacionesCerradas = filteredCotizaciones.filter(c => Number(c.estado_cotizacion) === 100);

  const vendidoReal = cotizacionesCerradas.reduce((sum, c) => {
    const precioUnitario = parseFloat(c.precio_unitario) || 0;
    const unidades = Number(c.unidades) || 0;
    const valor = precioUnitario * unidades;
    return sum + valor;
  }, 0);

  const porcentajeCumplimiento = metaTotal > 0
    ? ((vendidoReal / metaTotal) * 100).toFixed(1)
    : '0.0';

  const diferencia = vendidoReal - metaTotal;

  return {
    metaTotal,
    vendidoReal,
    porcentajeCumplimiento: parseFloat(porcentajeCumplimiento),
    diferencia,
  };
};

// Formatear moneda en pesos colombianos
export const formatearMoneda = (value) => {
  const numero = parseFloat(value) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numero);
};

// Autenticacion util
export const isAuthenticated = () => {
  return !!getToken();
};

export const handleAuthError = (error) => {
  if (!error) return;
  const msg = String(error.message || error);
  if (msg.includes('401') || msg.includes('403')) {
    console.error('Error de autenticacion. Limpiando token...');
    localStorage.removeItem('token');
    // window.location.href = '/login'; // descomenta si quieres redirigir automatico
  }
};

// --- Nueva funcion: calcularAnalisisAdicional (recibe array de cotizaciones ya filtradas) ---
export const calcularAnalisisAdicional = (cotizacionesFiltradas) => {
  const valorDe = (c) => {
    const precio = parseFloat(c.precio_unitario) || 0;
    const unidades = Number(c.unidades) || 0;
    return precio * unidades;
  };

  // ventas estado 100
  const ventasEstado100 = cotizacionesFiltradas
    .filter(c => Number(c.estado_cotizacion) === 100)
    .reduce((s, c) => s + valorDe(c), 0);

  // Distinct count de orden_compra total
  const allOrdenesSet = new Set(cotizacionesFiltradas.map(c => c.orden_compra).filter(Boolean));
  const totalOrdenesDistinct = allOrdenesSet.size;

  // Acumular por orden para calcular valor por orden y si tiene estado 100
  const ordenesPorEstado = {};
  cotizacionesFiltradas.forEach(c => {
    const oc = c.orden_compra || `OC-${c.id_registro || c.id || Math.random()}`;
    if (!ordenesPorEstado[oc]) ordenesPorEstado[oc] = { totalValor: 0, tiene100: false, tieneNo100: false };
    const v = valorDe(c);
    ordenesPorEstado[oc].totalValor += v;
    if (Number(c.estado_cotizacion) === 100) ordenesPorEstado[oc].tiene100 = true;
    else ordenesPorEstado[oc].tieneNo100 = true;
  });

  const ordenesCon100Count = Object.values(ordenesPorEstado).filter(o => o.tiene100).length;
  const porcentajeOrdenes100 = totalOrdenesDistinct > 0 ? (ordenesCon100Count / totalOrdenesDistinct) * 100 : 0;

  // Valor total de todas las ordenes (acumulado por orden para evitar double-count)
  const valorTodasOrdenes = Object.values(ordenesPorEstado).reduce((s, o) => s + o.totalValor, 0);

  // Acumulado por estado de cotizacion
  const mapEstado = {};
  cotizacionesFiltradas.forEach(c => {
    const estado = Number(c.estado_cotizacion);
    if (!mapEstado[estado]) mapEstado[estado] = 0;
    mapEstado[estado] += valorDe(c);
  });
  const dataPorEstado = Object.keys(mapEstado).map(k => ({ estado: k, valor: mapEstado[k] }));

  // Distribucion por categoria_producto
  const mapCatProd = {};
  cotizacionesFiltradas.forEach(c => {
    const cat = c.categoria_producto || 'Sin categoria';
    if (!mapCatProd[cat]) mapCatProd[cat] = 0;
    mapCatProd[cat] += valorDe(c);
  });
  const totalCat = Object.values(mapCatProd).reduce((s, v) => s + v, 0);
  const dataPorCategoria = Object.keys(mapCatProd).map(cat => ({
    categoria: cat,
    valor: mapCatProd[cat],
    porcentaje: totalCat > 0 ? (mapCatProd[cat] / totalCat) * 100 : 0
  }));

  // Resumen por cliente (orden distinct, vendido 100, en proceso)
  const clienteOrdenesMap = {};
  cotizacionesFiltradas.forEach(c => {
    const cliente = c.nombre_cliente || 'Sin nombre';
    if (!clienteOrdenesMap[cliente]) clienteOrdenesMap[cliente] = { todas: new Set(), con100: new Set() };
    if (c.orden_compra) {
      clienteOrdenesMap[cliente].todas.add(c.orden_compra);
      if (Number(c.estado_cotizacion) === 100) clienteOrdenesMap[cliente].con100.add(c.orden_compra);
    }
  });

  const resumenClientes = Object.keys(clienteOrdenesMap).map(cliente => {
    const vendido100 = cotizacionesFiltradas
      .filter(c => c.nombre_cliente === cliente && Number(c.estado_cotizacion) === 100)
      .reduce((s, c) => s + valorDe(c), 0);

    const enProceso = cotizacionesFiltradas
      .filter(c => c.nombre_cliente === cliente && Number(c.estado_cotizacion) !== 100)
      .reduce((s, c) => s + valorDe(c), 0);

    const totalOrdenes = clienteOrdenesMap[cliente].todas.size;
    const ordenesCon100 = clienteOrdenesMap[cliente].con100.size;
    const porcentajeConversion = totalOrdenes > 0 ? (ordenesCon100 / totalOrdenes) * 100 : 0;

    return {
      cliente,
      totalOrdenesDistinct: totalOrdenes,
      vendido100,
      enProceso,
      porcentajeConversion
    };
  });

  resumenClientes.sort((a, b) => b.vendido100 - a.vendido100);

  const barrasClientes = resumenClientes.slice(0, 15).map(r => ({
    cliente: r.cliente,
    vendido100: r.vendido100
  }));

  return {
    ventasEstado100,
    totalOrdenesDistinct,
    ordenesCon100Count,
    porcentajeOrdenes100,
    valorTodasOrdenes,
    dataPorEstado,
    dataPorCategoria,
    barrasClientes,
    resumenClientes
  };
};


