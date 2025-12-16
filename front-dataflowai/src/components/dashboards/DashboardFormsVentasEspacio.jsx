import React, { useEffect, useState, useRef } from 'react';
import * as echarts from 'echarts';
import styles from '../../styles/Dashboards/DashboardFormsVentasEspacio.module.css';
import { obtenerVentasEspacioApi } from '../../api/DashboardsApis/DashboardFormsVentasEspacioApi';

const DashboardFormsVentasEspacio = () => {
  const [ventas, setVentas] = useState([]);
  const [ventasFiltradas, setVentasFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ FILTROS
  const [filtros, setFiltros] = useState({
    regional: 'todas',
    marca: 'todas',
    año: 'todos'
  });

  // ✅ PAGINACIÓN TABLA ASESORES
  const [asesoresData, setAsesoresData] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

  const chartLineRef = useRef(null);
  const chartPieRef = useRef(null);
  const chartBarMarcaRef = useRef(null);
  const chartBarPuntoRef = useRef(null);
  const chartLineInstance = useRef(null);
  const chartPieInstance = useRef(null);
  const chartBarMarcaInstance = useRef(null);
  const chartBarPuntoInstance = useRef(null);

  // ✅ CARGAR DATA CRUD
  useEffect(() => {
    const cargarVentas = async () => {
      try {
        const data = await obtenerVentasEspacioApi();
        const rows = Array.isArray(data)
          ? data
          : data.results && Array.isArray(data.results)
            ? data.results
            : [];

        setVentas(rows);
        setVentasFiltradas(rows);
      } catch (err) {
        setError(err.message || 'Error al cargar ventas');
      } finally {
        setLoading(false);
      }
    };

    cargarVentas();
  }, []);

  // ✅ APLICAR FILTROS
  useEffect(() => {
    if (ventas.length === 0) return;

    let filtradas = [...ventas];

    // Filtrar por regional
    if (filtros.regional !== 'todas') {
      filtradas = filtradas.filter(item =>
        item?.organized?.regional?.['Seleccione la región:'] === filtros.regional
      );
    }

    // Filtrar por marca
    if (filtros.marca !== 'todas') {
      filtradas = filtradas.filter(item =>
        item?.organized?.marca?.['Seleccione la marca:'] === filtros.marca
      );
    }

    // Filtrar por año
    if (filtros.año !== 'todos') {
      filtradas = filtradas.filter(item => {
        if (!item?.fecha) return false;
        const año = new Date(item.fecha).getFullYear();
        return año.toString() === filtros.año;
      });
    }

    setVentasFiltradas(filtradas);
    setPaginaActual(1); // Resetear a primera página cuando cambian filtros
  }, [filtros, ventas]);

  // ✅ PROCESAR DATOS PARA TABLA DE ASESORES
  useEffect(() => {
    if (ventasFiltradas.length === 0) {
      setAsesoresData([]);
      return;
    }

    const asesoresMap = {};

    ventasFiltradas.forEach(item => {
      const asesor = item?.organized?.otros?.['Nombre asesor:'] || 'Sin Asesor';
      const dinero = item?.organized?.Ingresos?.['dinero vendido'] ?? 0;
      const cantidad = item?.organized?.Ingresos?.['cantidad vendida'] ?? 0;

      if (!asesoresMap[asesor]) {
        asesoresMap[asesor] = {
          nombre: asesor,
          totalDinero: 0,
          totalCantidad: 0,
          ventasCount: 0
        };
      }

      asesoresMap[asesor].totalDinero += Number(dinero);
      asesoresMap[asesor].totalCantidad += Number(cantidad);
      asesoresMap[asesor].ventasCount += 1;
    });

    // Convertir a array y ordenar por dinero descendente
    const asesoresArray = Object.values(asesoresMap).sort((a, b) => b.totalDinero - a.totalDinero);

    setAsesoresData(asesoresArray);
  }, [ventasFiltradas]);

  // ✅ OBTENER OPCIONES PARA FILTROS
  const obtenerOpcionesFiltros = () => {
    const regionales = [...new Set(ventas.map(item =>
      item?.organized?.regional?.['Seleccione la región:'] || 'Sin Regional'
    ).filter(Boolean))].sort();

    const marcas = [...new Set(ventas.map(item =>
      item?.organized?.marca?.['Seleccione la marca:'] || 'Sin Marca'
    ).filter(Boolean))].sort();

    const años = [...new Set(ventas.map(item => {
      if (!item?.fecha) return null;
      return new Date(item.fecha).getFullYear();
    }).filter(Boolean))].sort((a, b) => b - a);

    return { regionales, marcas, años };
  };

  // ✅ PROCESAR DATOS PARA GRÁFICA POR MES
  const procesarDatosPorMes = () => {
    const datosPorMes = {};

    ventasFiltradas.forEach(item => {
      if (item?.fecha) {
        try {
          const fecha = new Date(item.fecha);
          const mes = fecha.getMonth();
          const año = fecha.getFullYear();
          const key = `${año}-${String(mes + 1).padStart(2, '0')}`;

          const dinero = item?.organized?.Ingresos?.['dinero vendido'] ?? 0;
          const cantidad = item?.organized?.Ingresos?.['cantidad vendida'] ?? 0;

          if (!datosPorMes[key]) {
            datosPorMes[key] = {
              dinero: 0,
              cantidad: 0
            };
          }

          datosPorMes[key].dinero += Number(dinero);
          datosPorMes[key].cantidad += Number(cantidad);
        } catch (error) {
          console.error('Error procesando fecha:', error);
        }
      }
    });

    // Ordenar por fecha
    const mesesOrdenados = Object.keys(datosPorMes).sort();

    const etiquetas = mesesOrdenados.map(key => {
      const [año, mes] = key.split('-');
      const nombresMeses = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
      ];
      return `${nombresMeses[parseInt(mes) - 1]} ${año}`;
    });

    const datosDinero = mesesOrdenados.map(key => datosPorMes[key].dinero);
    const datosCantidad = mesesOrdenados.map(key => datosPorMes[key].cantidad);

    return { etiquetas, datosDinero, datosCantidad };
  };

  // ✅ PROCESAR DATOS PARA GRÁFICA DE TORTA POR REGIONAL
  const procesarDatosPorRegional = () => {
    const datosPorRegional = {};

    ventasFiltradas.forEach(item => {
      const regional = item?.organized?.regional?.['Seleccione la región:'] || 'Sin Regional';
      const dinero = item?.organized?.Ingresos?.['dinero vendido'] ?? 0;

      if (!datosPorRegional[regional]) {
        datosPorRegional[regional] = {
          valor: 0,
          cantidad: 0
        };
      }

      datosPorRegional[regional].valor += Number(dinero);
      datosPorRegional[regional].cantidad += Number(item?.organized?.Ingresos?.['cantidad vendida'] ?? 0);
    });

    // Convertir a formato para gráfica de torta
    const datosTorta = Object.keys(datosPorRegional).map(regional => ({
      name: regional,
      value: datosPorRegional[regional].valor,
      cantidad: datosPorRegional[regional].cantidad
    }));

    return datosTorta.sort((a, b) => b.value - a.value);
  };

  // ✅ PROCESAR DATOS PARA GRÁFICA DE BARRAS POR MARCA
  const procesarDatosPorMarca = () => {
    const datosPorMarca = {};

    ventasFiltradas.forEach(item => {
      const marca = item?.organized?.marca?.['Seleccione la marca:'] || 'Sin Marca';
      const dinero = item?.organized?.Ingresos?.['dinero vendido'] ?? 0;
      const cantidad = item?.organized?.Ingresos?.['cantidad vendida'] ?? 0;

      if (!datosPorMarca[marca]) {
        datosPorMarca[marca] = {
          valor: 0,
          cantidad: 0
        };
      }

      datosPorMarca[marca].valor += Number(dinero);
      datosPorMarca[marca].cantidad += Number(cantidad);
    });

    // Ordenar por valor descendente y limitar a top 10
    const marcasOrdenadas = Object.keys(datosPorMarca)
      .sort((a, b) => datosPorMarca[b].valor - datosPorMarca[a].valor)
      .slice(0, 10);

    const etiquetas = marcasOrdenadas.map(marca => {
      if (marca.length > 15) {
        return marca.substring(0, 12) + '...';
      }
      return marca;
    });

    const datosDinero = marcasOrdenadas.map(marca => datosPorMarca[marca].valor);
    const datosCantidad = marcasOrdenadas.map(marca => datosPorMarca[marca].cantidad);

    return {
      etiquetas,
      datosDinero,
      datosCantidad,
      datosCompletos: marcasOrdenadas.map(marca => ({
        nombre: marca,
        valor: datosPorMarca[marca].valor,
        cantidad: datosPorMarca[marca].cantidad
      }))
    };
  };

  // ✅ PROCESAR DATOS PARA GRÁFICA DE BARRAS POR PUNTO DE VENTA (TOP 5)
  const procesarDatosPorPuntoVenta = () => {
    const datosPorPunto = {};

    ventasFiltradas.forEach(item => {
      const punto = item?.organized?.regional?.punto || 'Sin Punto';
      const regional = item?.organized?.regional?.['Seleccione la región:'] || 'Sin Regional';
      const dinero = item?.organized?.Ingresos?.['dinero vendido'] ?? 0;
      const cantidad = item?.organized?.Ingresos?.['cantidad vendida'] ?? 0;

      if (!datosPorPunto[punto]) {
        datosPorPunto[punto] = {
          valor: 0,
          cantidad: 0,
          regional: regional
        };
      }

      datosPorPunto[punto].valor += Number(dinero);
      datosPorPunto[punto].cantidad += Number(cantidad);
    });

    // Ordenar por valor descendente y tomar top 5
    const puntosOrdenados = Object.keys(datosPorPunto)
      .sort((a, b) => datosPorPunto[b].valor - datosPorPunto[a].valor)
      .slice(0, 5);

    const etiquetas = puntosOrdenados.map(punto => {
      if (punto.length > 12) {
        return punto.substring(0, 10) + '...';
      }
      return punto;
    });

    const datosDinero = puntosOrdenados.map(punto => datosPorPunto[punto].valor);
    const datosCantidad = puntosOrdenados.map(punto => datosPorPunto[punto].cantidad);

    return {
      etiquetas,
      datosDinero,
      datosCantidad,
      datosCompletos: puntosOrdenados.map(punto => ({
        nombre: punto,
        valor: datosPorPunto[punto].valor,
        cantidad: datosPorPunto[punto].cantidad,
        regional: datosPorPunto[punto].regional
      }))
    };
  };

  // ✅ INICIALIZAR GRÁFICA DE LÍNEAS
  useEffect(() => {
    if (ventasFiltradas.length === 0 || loading) return;

    const { etiquetas, datosDinero, datosCantidad } = procesarDatosPorMes();

    if (chartLineInstance.current) {
      chartLineInstance.current.dispose();
    }

    chartLineInstance.current = echarts.init(chartLineRef.current);

    const option = {
      title: {
        text: 'Ventas por Mes',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#333'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        },
        formatter: function (params) {
          let result = `<strong>${params[0].axisValue}</strong><br/>`;
          params.forEach(param => {
            if (param.seriesName === 'Dinero Vendido') {
              result += `${param.marker} ${param.seriesName}: ${formatCurrency(param.value)}<br/>`;
            } else {
              result += `${param.marker} ${param.seriesName}: ${param.value} unidades<br/>`;
            }
          });
          return result;
        }
      },
      legend: {
        data: ['Dinero Vendido', 'Cantidad Vendida'],
        top: 30,
        textStyle: {
          fontSize: 12
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: etiquetas.length > 0 ? etiquetas : ['Sin datos'],
        axisLabel: {
          rotate: 45,
          fontSize: 11,
          color: '#666'
        }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Dinero (COP)',
          position: 'left',
          axisLabel: {
            formatter: function (value) {
              if (value >= 1000000) {
                return `$${(value / 1000000).toFixed(1)}M`;
              } else if (value >= 1000) {
                return `$${(value / 1000).toFixed(0)}K`;
              }
              return `$${value}`;
            },
            color: '#666'
          }
        },
        {
          type: 'value',
          name: 'Cantidad',
          position: 'right',
          axisLabel: {
            formatter: '{value} u',
            color: '#666'
          }
        }
      ],
      series: [
        {
          name: 'Dinero Vendido',
          type: 'line',
          yAxisIndex: 0,
          data: datosDinero.length > 0 ? datosDinero : [0],
          smooth: true,
          lineStyle: {
            width: 3,
            color: '#5470c6'
          },
          itemStyle: {
            color: '#5470c6'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(84, 112, 198, 0.6)' },
              { offset: 1, color: 'rgba(84, 112, 198, 0.1)' }
            ])
          },
          emphasis: {
            focus: 'series'
          }
        },
        {
          name: 'Cantidad Vendida',
          type: 'line',
          yAxisIndex: 1,
          data: datosCantidad.length > 0 ? datosCantidad : [0],
          smooth: true,
          lineStyle: {
            width: 3,
            color: '#91cc75'
          },
          itemStyle: {
            color: '#91cc75'
          },
          emphasis: {
            focus: 'series'
          }
        }
      ]
    };

    chartLineInstance.current.setOption(option);
  }, [ventasFiltradas, loading]);

  // ✅ INICIALIZAR GRÁFICA DE TORTA
  useEffect(() => {
    if (ventasFiltradas.length === 0 || loading) return;

    const datosTorta = procesarDatosPorRegional();

    if (chartPieInstance.current) {
      chartPieInstance.current.dispose();
    }

    chartPieInstance.current = echarts.init(chartPieRef.current);

    const colores = [
      '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
      '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#60acfc'
    ];

    const option = {
      title: {
        text: 'Ventas por Regional',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#333'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: function (params) {
          const porcentaje = params.percent;
          const regional = params.name;
          const valor = params.data.value;
          const cantidad = params.data.cantidad;
          return `
            <strong>${regional}</strong><br/>
            ${formatCurrency(valor)}<br/>
            ${cantidad} unidades<br/>
            ${porcentaje}% del total
          `;
        }
      },
      legend: {
        type: 'scroll',
        orient: 'vertical',
        right: 10,
        top: 20,
        bottom: 20,
        textStyle: {
          fontSize: 11
        },
        formatter: function (name) {
          const item = datosTorta.find(d => d.name === name);
          const valorFormateado = formatCurrency(item?.value || 0);
          return `${name}: ${valorFormateado}`;
        }
      },
      series: [
        {
          name: 'Ventas por Regional',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
              formatter: function (params) {
                return `${params.name}\n${formatCurrency(params.value)}`;
              }
            }
          },
          labelLine: {
            show: false
          },
          data: datosTorta.length > 0
            ? datosTorta.map((item, index) => ({
              ...item,
              itemStyle: {
                color: colores[index % colores.length]
              }
            }))
            : [{ name: 'Sin datos', value: 1, itemStyle: { color: '#ccc' } }]
        }
      ]
    };

    chartPieInstance.current.setOption(option);
  }, [ventasFiltradas, loading]);

  // ✅ INICIALIZAR GRÁFICA DE BARRAS POR MARCA
  useEffect(() => {
    if (ventasFiltradas.length === 0 || loading) return;

    const { etiquetas, datosDinero, datosCantidad, datosCompletos } = procesarDatosPorMarca();

    if (chartBarMarcaInstance.current) {
      chartBarMarcaInstance.current.dispose();
    }

    chartBarMarcaInstance.current = echarts.init(chartBarMarcaRef.current);

    const option = {
      title: {
        text: 'Ventas por Marca (Top 10)',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#333'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function (params) {
          const marcaIndex = params[0].dataIndex;
          const marcaData = datosCompletos[marcaIndex];
          let result = `<strong>${marcaData.nombre}</strong><br/>`;
          result += `Valor: ${formatCurrency(marcaData.valor)}<br/>`;
          result += `Cantidad: ${marcaData.cantidad} unidades<br/>`;
          return result;
        }
      },
      legend: {
        data: ['Dinero Vendido', 'Cantidad Vendida'],
        top: 30,
        textStyle: {
          fontSize: 12
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: etiquetas.length > 0 ? etiquetas : ['Sin datos'],
        axisLabel: {
          rotate: 45,
          fontSize: 11,
          color: '#666'
        }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Dinero (COP)',
          position: 'left',
          axisLabel: {
            formatter: function (value) {
              if (value >= 1000000) {
                return `$${(value / 1000000).toFixed(1)}M`;
              } else if (value >= 1000) {
                return `$${(value / 1000).toFixed(0)}K`;
              }
              return `$${value}`;
            },
            color: '#666'
          }
        },
        {
          type: 'value',
          name: 'Cantidad',
          position: 'right',
          axisLabel: {
            formatter: '{value} u',
            color: '#666'
          }
        }
      ],
      series: [
        {
          name: 'Dinero Vendido',
          type: 'bar',
          yAxisIndex: 0,
          data: datosDinero.length > 0 ? datosDinero : [0],
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#5470c6' },
              { offset: 1, color: '#83a0e0' }
            ]),
            borderRadius: [4, 4, 0, 0]
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#3c5aa8' },
                { offset: 1, color: '#5c7cc8' }
              ])
            }
          }
        },
        {
          name: 'Cantidad Vendida',
          type: 'bar',
          yAxisIndex: 1,
          data: datosCantidad.length > 0 ? datosCantidad : [0],
          itemStyle: {
            color: '#91cc75',
            borderRadius: [4, 4, 0, 0]
          },
          emphasis: {
            itemStyle: {
              color: '#73b056'
            }
          }
        }
      ]
    };

    chartBarMarcaInstance.current.setOption(option);
  }, [ventasFiltradas, loading]);

  // ✅ INICIALIZAR GRÁFICA DE BARRAS POR PUNTO DE VENTA (TOP 5)
  useEffect(() => {
    if (ventasFiltradas.length === 0 || loading) return;

    const { etiquetas, datosDinero, datosCantidad, datosCompletos } = procesarDatosPorPuntoVenta();

    if (chartBarPuntoInstance.current) {
      chartBarPuntoInstance.current.dispose();
    }

    chartBarPuntoInstance.current = echarts.init(chartBarPuntoRef.current);

    const option = {
      title: {
        text: 'Top 5 Puntos de Venta',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#333'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function (params) {
          const puntoIndex = params[0].dataIndex;
          const puntoData = datosCompletos[puntoIndex];
          let result = `<strong>${puntoData.nombre}</strong><br/>`;
          result += `Regional: ${puntoData.regional}<br/>`;
          result += `Valor: ${formatCurrency(puntoData.valor)}<br/>`;
          result += `Cantidad: ${puntoData.cantidad} unidades<br/>`;
          return result;
        }
      },
      legend: {
        data: ['Dinero Vendido', 'Cantidad Vendida'],
        top: 30,
        textStyle: {
          fontSize: 12
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: etiquetas.length > 0 ? etiquetas : ['Sin datos'],
        axisLabel: {
          rotate: 45,
          fontSize: 11,
          color: '#666'
        }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Dinero (COP)',
          position: 'left',
          axisLabel: {
            formatter: function (value) {
              if (value >= 1000000) {
                return `$${(value / 1000000).toFixed(1)}M`;
              } else if (value >= 1000) {
                return `$${(value / 1000).toFixed(0)}K`;
              }
              return `$${value}`;
            },
            color: '#666'
          }
        },
        {
          type: 'value',
          name: 'Cantidad',
          position: 'right',
          axisLabel: {
            formatter: '{value} u',
            color: '#666'
          }
        }
      ],
      series: [
        {
          name: 'Dinero Vendido',
          type: 'bar',
          yAxisIndex: 0,
          data: datosDinero.length > 0 ? datosDinero : [0],
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#ee6666' },
              { offset: 1, color: '#ff9999' }
            ]),
            borderRadius: [4, 4, 0, 0]
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#d9534f' },
                { offset: 1, color: '#e68986' }
              ])
            }
          },
          label: {
            show: true,
            position: 'top',
            formatter: function (params) {
              if (params.value >= 1000000) {
                return `$${(params.value / 1000000).toFixed(1)}M`;
              } else if (params.value >= 1000) {
                return `$${(params.value / 1000).toFixed(0)}K`;
              }
              return `$${params.value}`;
            },
            fontSize: 10
          }
        },
        {
          name: 'Cantidad Vendida',
          type: 'bar',
          yAxisIndex: 1,
          data: datosCantidad.length > 0 ? datosCantidad : [0],
          itemStyle: {
            color: '#fac858',
            borderRadius: [4, 4, 0, 0]
          },
          emphasis: {
            itemStyle: {
              color: '#e6b400'
            }
          }
        }
      ]
    };

    chartBarPuntoInstance.current.setOption(option);
  }, [ventasFiltradas, loading]);

  // ✅ MANEJAR REDIMENSIONAMIENTO
  useEffect(() => {
    const handleResize = () => {
      if (chartLineInstance.current) {
        chartLineInstance.current.resize();
      }
      if (chartPieInstance.current) {
        chartPieInstance.current.resize();
      }
      if (chartBarMarcaInstance.current) {
        chartBarMarcaInstance.current.resize();
      }
      if (chartBarPuntoInstance.current) {
        chartBarPuntoInstance.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartLineInstance.current) {
        chartLineInstance.current.dispose();
      }
      if (chartPieInstance.current) {
        chartPieInstance.current.dispose();
      }
      if (chartBarMarcaInstance.current) {
        chartBarMarcaInstance.current.dispose();
      }
      if (chartBarPuntoInstance.current) {
        chartBarPuntoInstance.current.dispose();
      }
    };
  }, []);

  // ✅ MANEJAR CAMBIOS EN FILTROS
  const handleFiltroChange = (tipo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [tipo]: valor
    }));
  };

  // ✅ RESET FILTROS
  const resetFiltros = () => {
    setFiltros({
      regional: 'todas',
      marca: 'todas',
      año: 'todos'
    });
  };

  // ✅ PAGINACIÓN TABLA ASESORES
  const totalPaginas = Math.ceil(asesoresData.length / itemsPorPagina);
  const inicio = (paginaActual - 1) * itemsPorPagina;
  const fin = inicio + itemsPorPagina;
  const asesoresPaginados = asesoresData.slice(inicio, fin);

  const cambiarPagina = (nuevaPagina) => {
    setPaginaActual(nuevaPagina);
  };

  // ✅ CÁLCULOS PARA TARJETAS
  const totalCantidad = ventasFiltradas.reduce((acc, item) => {
    const cantidad = item?.organized?.Ingresos?.['cantidad vendida'] ?? 0;
    return acc + Number(cantidad);
  }, 0);

  const totalDinero = Math.round(
    ventasFiltradas.reduce((acc, item) => {
      const dinero = item?.organized?.Ingresos?.['dinero vendido'] ?? 0;
      return acc + Number(dinero);
    }, 0)
  );

  const marcasUnicas = [...new Set(ventasFiltradas.map(item =>
    item?.organized?.marca?.['Seleccione la marca:'] || 'Sin Marca'
  ).filter(Boolean))];

  const puntosUnicos = [...new Set(ventasFiltradas.map(item =>
    item?.organized?.regional?.punto || 'Sin Punto'
  ).filter(Boolean))];

  const asesoresUnicos = [...new Set(ventasFiltradas.map(item =>
    item?.organized?.otros?.['Nombre asesor:'] || 'Sin Asesor'
  ).filter(Boolean))];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // ✅ OBTENER OPCIONES DE FILTROS
  const { regionales, marcas, años } = obtenerOpcionesFiltros();

  // ✅ RENDER
  return (
    <div className={styles['dash-ventas-espmercade-container']}>
      <h2>Dashboard Ventas Punto de Venta</h2>

      {/* ✅ FILTROS */}
      <div className={styles['dash-ventas-espmercade-filtrosContainer']}>
        <div className={styles['dash-ventas-espmercade-filtrosRow']}>
          <div className={styles['dash-ventas-espmercade-filtroGroup']}>
            <label className={styles['dash-ventas-espmercade-filtroLabel']}>Regional:</label>
            <select
              className={styles['dash-ventas-espmercade-filtroSelect']}
              value={filtros.regional}
              onChange={(e) => handleFiltroChange('regional', e.target.value)}
            >
              <option value="todas">Todas las regionales</option>
              {regionales.map(regional => (
                <option key={regional} value={regional}>{regional}</option>
              ))}
            </select>
          </div>

          <div className={styles['dash-ventas-espmercade-filtroGroup']}>
            <label className={styles['dash-ventas-espmercade-filtroLabel']}>Marca:</label>
            <select
              className={styles['dash-ventas-espmercade-filtroSelect']}
              value={filtros.marca}
              onChange={(e) => handleFiltroChange('marca', e.target.value)}
            >
              <option value="todas">Todas las marcas</option>
              {marcas.map(marca => (
                <option key={marca} value={marca}>{marca}</option>
              ))}
            </select>
          </div>

          <div className={styles['dash-ventas-espmercade-filtroGroup']}>
            <label className={styles['dash-ventas-espmercade-filtroLabel']}>Año:</label>
            <select
              className={styles['dash-ventas-espmercade-filtroSelect']}
              value={filtros.año}
              onChange={(e) => handleFiltroChange('año', e.target.value)}
            >
              <option value="todos">Todos los años</option>
              {años.map(año => (
                <option key={año} value={año}>{año}</option>
              ))}
            </select>
          </div>

          <button
            className={styles['dash-ventas-espmercade-resetButton']}
            onClick={resetFiltros}
          >
            Limpiar Filtros
          </button>
        </div>

        <div className={styles['dash-ventas-espmercade-filtroInfo']}>
          <span className={styles['dash-ventas-espmercade-filtroText']}>
            Mostrando {ventasFiltradas.length} de {ventas.length} registros
          </span>
          {Object.values(filtros).some(filtro => filtro !== 'todas' && filtro !== 'todos') && (
            <span className={styles['dash-ventas-espmercade-filtroActivo']}>
              Filtros activos:
              {filtros.regional !== 'todas' && ` Regional: ${filtros.regional}`}
              {filtros.marca !== 'todas' && ` | Marca: ${filtros.marca}`}
              {filtros.año !== 'todos' && ` | Año: ${filtros.año}`}
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className={styles['dash-ventas-espmercade-loading']}>
          <p>Cargando ventas...</p>
        </div>
      ) : error ? (
        <div className={styles['dash-ventas-espmercade-error']}>
          <p>Error: {error}</p>
        </div>
      ) : (
        <>
          {/* ✅ TARJETAS DE RESUMEN */}
          <div className={styles['dash-ventas-espmercade-statsContainer']}>
            {/* ✅ TOTAL CANTIDAD */}
            <div className={styles['dash-ventas-espmercade-statCard']}>
              <div className={styles['dash-ventas-espmercade-statLabel']}>Cantidad Vendida</div>
              <div className={styles['dash-ventas-espmercade-statValue']}>{totalCantidad}</div>
              <div className={styles['dash-ventas-espmercade-statSubtitle']}>unidades</div>
            </div>

            {/* ✅ TOTAL DINERO */}
            <div className={styles['dash-ventas-espmercade-statCard']}>
              <div className={styles['dash-ventas-espmercade-statLabel']}>Dinero Vendido</div>
              <div className={styles['dash-ventas-espmercade-statValue']}>{formatCurrency(totalDinero)}</div>
              <div className={styles['dash-ventas-espmercade-statSubtitle']}>ingresos</div>
            </div>

            {/* ✅ TOTAL REGISTROS */}
            <div className={styles['dash-ventas-espmercade-statCard']}>
              <div className={styles['dash-ventas-espmercade-statLabel']}>Registros</div>
              <div className={styles['dash-ventas-espmercade-statValue']}>{ventasFiltradas.length}</div>
              <div className={styles['dash-ventas-espmercade-statSubtitle']}>ventas</div>
            </div>

            {/* ✅ ASESORES ÚNICOS */}
            <div className={styles['dash-ventas-espmercade-statCard']}>
              <div className={styles['dash-ventas-espmercade-statLabel']}>Asesores Activos</div>
              <div className={styles['dash-ventas-espmercade-statValue']}>{asesoresUnicos.length}</div>
              <div className={styles['dash-ventas-espmercade-statSubtitle']}>activos</div>
            </div>

            {/* ✅ PUNTOS DE VENTA ÚNICOS */}
            <div className={styles['dash-ventas-espmercade-statCard']}>
              <div className={styles['dash-ventas-espmercade-statLabel']}>Puntos de Venta</div>
              <div className={styles['dash-ventas-espmercade-statValue']}>{puntosUnicos.length}</div>
              <div className={styles['dash-ventas-espmercade-statSubtitle']}>activos</div>
            </div>
          </div>

          {/* ✅ GRÁFICA DE LÍNEAS (FULL WIDTH) */}
          <div className={styles['dash-ventas-espmercade-chartRow']}>
            <div className={styles['dash-ventas-espmercade-fullWidthChart']}>
              <div
                ref={chartLineRef}
                className={styles['dash-ventas-espmercade-chart']}
                style={{ height: '399px' }}
              />
            </div>
          </div>

          {/* ✅ GRÁFICAS EN LAYOUT DE 2 COLUMNAS (FILA 1) */}
          <div className={styles['dash-ventas-espmercade-chartsGrid']}>
            {/* ✅ GRÁFICA DE TORTA */}
            <div className={styles['dash-ventas-espmercade-chartCard']}>
              <div
                ref={chartPieRef}
                className={styles['dash-ventas-espmercade-chart']}
                style={{ height: '399px' }}
              />
            </div>

            {/* ✅ GRÁFICA DE BARRAS POR MARCA */}
            <div className={styles['dash-ventas-espmercade-chartCard']}>
              <div
                ref={chartBarMarcaRef}
                className={styles['dash-ventas-espmercade-chart']}
                style={{ height: '400px' }}
              />
            </div>
          </div>

          {/* ✅ GRÁFICA DE BARRAS POR PUNTO DE VENTA */}
          <div className={styles['dash-ventas-espmercade-chartRow']}>
            <div className={styles['dash-ventas-espmercade-fullWidthChart']}>
              <div
                ref={chartBarPuntoRef}
                className={styles['dash-ventas-espmercade-chart']}
                style={{ height: '400px' }}
              />
            </div>
          </div>

          {/* ✅ TABLA DE ASESORES */}
          <div className={styles['dash-ventas-espmercade-tablaContainer']}>
            <div className={styles['dash-ventas-espmercade-tablaHeader']}>
              <h3>Desempeño por Asesor</h3>
              <div className={styles['dash-ventas-espmercade-tablaInfo']}>
                <span>Total asesores: {asesoresData.length}</span>
                <span>Mostrando {asesoresPaginados.length} de {asesoresData.length}</span>
              </div>
            </div>

            <div className={styles['dash-ventas-espmercade-tableWrapper']}>
              <table className={styles['dash-ventas-espmercade-asesoresTable']}>
                <thead>
                  <tr>
                    <th className={styles['dash-ventas-espmercade-tableHeader']}>#</th>
                    <th className={styles['dash-ventas-espmercade-tableHeader']}>Asesor</th>
                    <th className={styles['dash-ventas-espmercade-tableHeader']}>Total Ventas</th>
                    <th className={styles['dash-ventas-espmercade-tableHeader']}>Cantidad Vendida</th>
                    <th className={styles['dash-ventas-espmercade-tableHeader']}>Dinero Vendido</th>
                    <th className={styles['dash-ventas-espmercade-tableHeader']}>Promedio por Venta</th>
                  </tr>
                </thead>
                <tbody>
                  {asesoresPaginados.length > 0 ? (
                    asesoresPaginados.map((asesor, index) => (
                      <tr key={index} className={styles['dash-ventas-espmercade-tableRow']}>
                        <td className={styles['dash-ventas-espmercade-tableCell']}>{inicio + index + 1}</td>
                        <td className={`${styles['dash-ventas-espmercade-tableCell']} ${styles['dash-ventas-espmercade-asesorNombre']}`}>
                          {asesor.nombre}
                        </td>
                        <td className={styles['dash-ventas-espmercade-tableCell']}>
                          <span className={styles['dash-ventas-espmercade-badge']}>{asesor.ventasCount}</span>
                        </td>
                        <td className={styles['dash-ventas-espmercade-tableCell']}>
                          <span className={styles['dash-ventas-espmercade-cantidadBadge']}>{asesor.totalCantidad} unidades</span>
                        </td>
                        <td className={styles['dash-ventas-espmercade-tableCell']}>
                          <span className={styles['dash-ventas-espmercade-dineroValor']}>{formatCurrency(asesor.totalDinero)}</span>
                        </td>
                        <td className={styles['dash-ventas-espmercade-tableCell']}>
                          <span className={styles['dash-ventas-espmercade-promedioValor']}>
                            {formatCurrency(asesor.totalDinero / asesor.ventasCount)}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className={styles['dash-ventas-espmercade-tableRow']}>
                      <td colSpan="6" className={styles['dash-ventas-espmercade-noDataCell']}>
                        No hay datos de asesores para los filtros seleccionados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ✅ PAGINACIÓN */}
            {totalPaginas > 1 && (
              <div className={styles['dash-ventas-espmercade-paginacion']}>
                <button
                  className={`${styles['dash-ventas-espmercade-paginacionButton']} ${paginaActual === 1 ? styles['dash-ventas-espmercade-disabled'] : ''}`}
                  onClick={() => cambiarPagina(paginaActual - 1)}
                  disabled={paginaActual === 1}
                >
                  ← Anterior
                </button>

                <div className={styles['dash-ventas-espmercade-paginaInfo']}>
                  Página {paginaActual} de {totalPaginas}
                </div>

                <div className={styles['dash-ventas-espmercade-paginasNumeros']}>
                  {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                    let paginaNum;
                    if (totalPaginas <= 5) {
                      paginaNum = i + 1;
                    } else if (paginaActual <= 3) {
                      paginaNum = i + 1;
                    } else if (paginaActual >= totalPaginas - 2) {
                      paginaNum = totalPaginas - 4 + i;
                    } else {
                      paginaNum = paginaActual - 2 + i;
                    }

                    return (
                      <button
                        key={paginaNum}
                        className={`${styles['dash-ventas-espmercade-paginaNumero']} ${paginaActual === paginaNum ? styles['dash-ventas-espmercade-activa'] : ''}`}
                        onClick={() => cambiarPagina(paginaNum)}
                      >
                        {paginaNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  className={`${styles['dash-ventas-espmercade-paginacionButton']} ${paginaActual === totalPaginas ? styles['dash-ventas-espmercade-disabled'] : ''}`}
                  onClick={() => cambiarPagina(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardFormsVentasEspacio;