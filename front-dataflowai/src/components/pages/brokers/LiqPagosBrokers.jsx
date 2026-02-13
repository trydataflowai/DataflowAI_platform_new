// C:\...\front-dataflowai\src\components\pages\brokers\LiqPagosBrokers.jsx
import React, { useEffect, useState } from 'react';
import styles from '../../../styles/CreacionUsuario.module.css';
import { obtenerLiqPagosBroker } from '../../../api/Brokers/LiqPagosBrokers';

const formatCurrency = (v) => {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return '-';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(Number(v));
};

/**
 * safeParse: convierte cadenas como:
 * "$ 1.000,00", "1.000,00", "1000.00", "100.000,00" -> número correcto
 */
const safeParse = (val) => {
  if (val === null || val === undefined) return 0;
  let s = String(val).trim();

  // eliminar signo de moneda y espacios
  s = s.replace(/\$/g, '').replace(/\s/g, '');

  // mantener solo dígitos, puntos y comas
  s = s.replace(/[^0-9.,-]/g, '');

  // Si contiene tanto punto como coma, asumimos que la coma es decimal (formato español)
  if (s.indexOf('.') !== -1 && s.indexOf(',') !== -1) {
    s = s.replace(/\./g, ''); // quitar separadores de miles
    s = s.replace(',', '.');  // coma -> punto decimal
  } else if (s.indexOf(',') !== -1 && s.indexOf('.') === -1) {
    // solo coma -> coma decimal
    s = s.replace(',', '.');
  } else {
    // solo puntos o ninguno -> puede ser "1000.00" o "1.000" (si es "1.000" lo interpretamos como 1000)
    // si hay más de un punto, eliminamos todos los puntos (asumimos separadores de miles) excepto el último si parece decimal
    const parts = s.split('.');
    if (parts.length > 2) {
      // juntar todos los primeros como miles y mantener el último como decimal si tiene 2 dígitos
      const last = parts.pop();
      s = parts.join('') + '.' + last;
    }
    // si solo hay un punto y los decimales tienen 3 dígitos, es probable que sea separador de miles: quitar el punto
    if (s.indexOf('.') !== -1) {
      const [intPart, decPart] = s.split('.');
      if (decPart.length === 3) {
        s = (intPart + decPart);
      }
    }
  }

  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

const isPaid = (estado) => {
  if (estado === true) return true;
  if (estado === false) return false;
  if (estado === null || estado === undefined) return false;
  const s = String(estado).toLowerCase().trim();
  return ['true', 'pagado', 'paid', '1', 'si', 'sí'].includes(s);
};

const isPending = (estado) => !isPaid(estado);

const LiqPagosBrokers = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [brokerData, setBrokerData] = useState({ facturas: [], pagos: [], broker_id: null });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await obtenerLiqPagosBroker();
        if (!mounted) return;
        setBrokerData(data || { facturas: [], pagos: [], broker_id: null });
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Error desconocido');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className={styles.container}><p>Cargando...</p></div>;
  if (error) return <div className={styles.container}><p>Error: {error}</p></div>;

  const { facturas = [], pagos = [], broker_id } = brokerData;

  // Fecha/hora actual
  const now = new Date();
  const fechaHoy = now.toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  // Valor total = suma de valor_comision_amount en facturas
  const valorTotalComisiones = facturas.reduce((acc, f) => acc + safeParse(f.valor_comision_amount), 0);

  // Combinar pagos top-level y pagos dentro de facturas, luego deduplicar por id_pago (o key compuesto)
  const combinedPagos = [];
  if (Array.isArray(pagos)) combinedPagos.push(...pagos);
  facturas.forEach(f => {
    if (Array.isArray(f.pagos)) combinedPagos.push(...f.pagos);
  });

  const pagosMap = new Map();
  combinedPagos.forEach(p => {
    if (!p) return;
    const idKey = (p.id_pago !== undefined && p.id_pago !== null)
      ? `id_${p.id_pago}`
      : `nf_${p.numero_factura_num ?? 'x'}_${p.fecha_pago ?? 'x'}_${String(p.valor_pagado ?? '0')}`;
    if (!pagosMap.has(idKey)) pagosMap.set(idKey, p);
  });
  const uniquePagos = Array.from(pagosMap.values());

  // Valor pagado = suma de pagos efectivamente pagados (estado true)
  const valorPagadoTotal = uniquePagos
    .filter(p => isPaid(p.estado))
    .reduce((acc, p) => acc + safeParse(p.valor_pagado), 0);

  // Valor pendiente a pagar = suma(comisiones) - suma(valor_pagado)
  const valorPendiente = valorTotalComisiones - valorPagadoTotal;

  // Valor a pagar este mes = pagos pendientes (estado false) cuya fecha_pago coincide con el mes+anio actual
  const currentMonth = now.getMonth(); // 0-11
  const currentYear = now.getFullYear();
  const valorAPagarEsteMes = uniquePagos.reduce((acc, p) => {
    if (!p) return acc;
    if (!isPending(p.estado)) return acc; // solo pendientes
    if (!p.fecha_pago) return acc;
    const d = new Date(p.fecha_pago);
    if (Number.isNaN(d.getTime())) return acc;
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      return acc + safeParse(p.valor_pagado);
    }
    return acc;
  }, 0);

  // Cantidad de clientes activos = cantidad de id_lead.id_lead únicos en facturas
  const clientesSet = new Set();
  facturas.forEach(f => {
    const id = f.id_lead && (f.id_lead.id_lead ?? f.id_lead);
    if (id !== null && id !== undefined) clientesSet.add(id);
  });
  const cantidadClientesActivos = clientesSet.size;

  // ---- Preparar pagos por factura (match por numero_factura) ----
  // Mapa: numero_factura (string) -> [pagos...]
  const pagosPorFacturaMap = new Map();

  // Inicializar entradas desde facturas (mantener pagos que vienen dentro de la factura)
  facturas.forEach(f => {
    const key = String(f.numero_factura ?? '');
    const arr = Array.isArray(f.pagos) ? f.pagos.slice() : [];
    pagosPorFacturaMap.set(key, arr);
  });

  // Añadir pagos top-level que coincidan con alguna factura por numero_factura_num
  uniquePagos.forEach(p => {
    const nf = (p.numero_factura_num !== undefined && p.numero_factura_num !== null) ? String(p.numero_factura_num) : null;
    if (!nf) return;
    if (pagosPorFacturaMap.has(nf)) {
      // deduplicar por id_pago (si existe) dentro del arreglo
      const existing = pagosPorFacturaMap.get(nf);
      const exists = existing.some(e => (e.id_pago !== undefined && e.id_pago !== null && p.id_pago === e.id_pago)
        || (String(e.numero_factura_num ?? '') === String(p.numero_factura_num ?? '') && String(e.fecha_pago ?? '') === String(p.fecha_pago ?? '') && String(e.valor_pagado ?? '') === String(p.valor_pagado ?? '')));
      if (!exists) existing.push(p);
    }
  });

  // Función auxiliar para obtener pagos asociados a una factura (array ordenado por fecha ascendente)
  const obtenerPagosDeFactura = (factura) => {
    const key = String(factura.numero_factura ?? '');
    const arr = pagosPorFacturaMap.get(key) ?? [];
    // ordenar por fecha_pago (si es válida) ascendiente
    const sorted = arr.slice().sort((a, b) => {
      const da = a && a.fecha_pago ? new Date(a.fecha_pago).getTime() : 0;
      const db = b && b.fecha_pago ? new Date(b.fecha_pago).getTime() : 0;
      return da - db;
    });
    return sorted;
  };

  return (
    <div className={styles.container}>
      <h1>Liquidación y Pagos - Broker {broker_id ?? ''}</h1>

      {/* Resumen superior */} 
      <section style={{ marginTop: 10, marginBottom: 20 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          alignItems: 'stretch'
        }}>
          <div style={{ padding: 12, borderRadius: 8, background: '#fafafa', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 12, color: '#666' }}>Fecha hoy</div>
            <div style={{ fontSize: 16, fontWeight: '600' }}>{fechaHoy}</div>
          </div>

          <div style={{ padding: 12, borderRadius: 8, background: '#fafafa', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 12, color: '#666' }}>Valor total (comisiones)</div>
            <div style={{ fontSize: 16, fontWeight: '600' }}>{formatCurrency(valorTotalComisiones)}</div>
          </div>

          <div style={{ padding: 12, borderRadius: 8, background: '#fff7e6', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 12, color: '#666' }}>Valor a pagar este mes</div>
            <div style={{ fontSize: 16, fontWeight: '600' }}>{formatCurrency(valorAPagarEsteMes)}</div>
          </div>

          <div style={{ padding: 12, borderRadius: 8, background: '#e8f7ff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 12, color: '#666' }}>Valor pagado</div>
            <div style={{ fontSize: 16, fontWeight: '600' }}>{formatCurrency(valorPagadoTotal)}</div>
          </div>

          <div style={{ padding: 12, borderRadius: 8, background: '#fff2f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 12, color: '#666' }}>Valor pendiente a pagar</div>
            <div style={{ fontSize: 16, fontWeight: '600' }}>{formatCurrency(valorPendiente)}</div>
          </div>
        </div>
      </section>

      {/* Lista de facturas y, debajo de cada una, sus pagos asociados */}
      <section style={{ marginTop: 20 }}>
        <h2>Facturas ({facturas.length})</h2>
        {facturas.length === 0 && <div>No hay facturas</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {facturas.map((f) => {
            const pagosAsociados = obtenerPagosDeFactura(f);
            return (
              <div key={String(f.numero_factura ?? Math.random())} style={{
                padding: 12,
                borderRadius: 8,
                background: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                border: '1px solid #eee'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, color: '#666' }}>N° Factura</div>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>{f.numero_factura ?? '-'}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: '#666' }}>Fecha</div>
                    <div style={{ fontSize: 14 }}>{f.fecha_facturacion ?? '-'}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: '#666' }}>Lead</div>
                    <div style={{ fontSize: 14 }}>{f.id_lead ? f.id_lead.nombre_lead : '-'}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: '#666' }}>Valor Facturado</div>
                    <div style={{ fontSize: 14 }}>{formatCurrency(f.valor_facturado)}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: '#666' }}>% Comisión</div>
                    <div style={{ fontSize: 14 }}>{f.comision_percent ? `${f.comision_percent}%` : '-'}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: '#666' }}>Valor Comisión</div>
                    <div style={{ fontSize: 14 }}>{formatCurrency(f.valor_comision_amount)}</div>
                  </div>
                </div>

                {/* Pagos asociados */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 13, color: '#333', marginBottom: 8 }}>Pagos ({pagosAsociados.length})</div>
                  {pagosAsociados.length === 0 && (
                    <div style={{ color: '#777' }}>No hay pagos asociados a esta factura</div>
                  )}
                  {pagosAsociados.length > 0 && (
                    <table className={styles.table || ''} style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th>ID Pago</th>
                          <th>Fecha Pago</th>
                          <th>Valor Pagado</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagosAsociados.map((p, i) => {
                          const key = p && (p.id_pago ?? `p_${i}`);
                          return (
                            <tr key={key}>
                              <td>{p.id_pago ?? '-'}</td>
                              <td>{p.fecha_pago ?? '-'}</td>
                              <td>{formatCurrency(p.valor_pagado)}</td>
                              <td>{isPaid(p.estado) ? 'Pagado' : 'Pendiente'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
};

export default LiqPagosBrokers;
