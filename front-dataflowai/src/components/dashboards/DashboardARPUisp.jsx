import { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Users,
  Target, ShoppingCart, Award, AlertCircle, RefreshCw
} from 'lucide-react';
import {
  fetchDashboardARPU,
  fetchDashboardARPUForecast,
  clearDashboardARPUCache
} from '../../api/DashboardsApis/DashboardARPUisp';

import styles from '../../styles/Dashboards/DashboardARPUisp.module.css';

const COLORS = ['#00E5FF', '#1DE9B6', '#FFD600', '#FF6D00', '#7C4DFF', '#E91E63'];
const DEFAULT_MONTHLY_CHURN = 0.02;
const DEFAULT_GROSS_MARGIN = 0.5;

const DashboardARPUisp = () => {
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [data, setData]         = useState([]);
  const [forecast, setForecast] = useState(null);

  const [filters, setFilters] = useState({
    empresa: '2',
    producto: '18',
    id_registro: '',
    cliente_id: '',
    tipo_evento: '',
    estado: '',
    velocidad_mbps: '',
    canal_adquisicion: '',
    promo_id: '',
    tags: '',
    metadata: '',
    doc: '',
    start: '',
    end: ''
  });

  const [kpis, setKpis] = useState({ arpu: 0, mrr: 0, subsActivos: 0, ltv: 0 });

  // --- normalización de filtros para API
  const sanitizeFilters = (f) => {
    const num = (v) => (v === '' || v === null || v === undefined ? '' : Number(v));
    const str = (v) => (v === null || v === undefined ? '' : String(v).trim());
    return {
      ...f,
      empresa: str(f.empresa),
      producto: str(f.producto),
      id_registro: str(f.id_registro),
      cliente_id: str(f.cliente_id),
      tipo_evento: str(f.tipo_evento),
      estado: str(f.estado),
      velocidad_mbps: f.velocidad_mbps === '' ? '' : num(f.velocidad_mbps),
      canal_adquisicion: str(f.canal_adquisicion),
      promo_id: str(f.promo_id),
      tags: str(f.tags),
      metadata: str(f.metadata),
      doc: str(f.doc),
      start: str(f.start),
      end: str(f.end),
    };
  };

  useEffect(() => {
    loadData(sanitizeFilters(filters), false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async (currentFilters, forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = { empresa: currentFilters.empresa, producto: currentFilters.producto, forceRefresh };
      const keys = ['id_registro','cliente_id','tipo_evento','estado','velocidad_mbps','canal_adquisicion','promo_id','tags','metadata','doc','start','end'];
      keys.forEach((k) => {
        const val = currentFilters[k];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          if (k === 'tags') {
            const arr = String(val).split(',').map(t=>t.trim()).filter(Boolean);
            if (arr.length) params.tags = arr;
          } else if (k === 'metadata') {
            try { params.metadata = JSON.parse(String(val)); } catch { params.metadata = String(val); }
          } else {
            params[k] = val;
          }
        }
      });

      const resultData = await fetchDashboardARPU(params);
      setData(resultData || []);

      if (params.empresa && params.producto) {
        try {
          const f = await fetchDashboardARPUForecast({ empresa: params.empresa, producto: params.producto, periods: 6, forceRefresh });
          setForecast(f);
        } catch (e) { console.warn('⚠️ Forecast:', e); }
      }
    } catch (err) {
      setError(err.message || 'Error cargando datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    clearDashboardARPUCache();
    const f = sanitizeFilters(filters);
    loadData(f, true);
  };

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const handleApplyFilters  = () => loadData(sanitizeFilters(filters), true);

  const handleClearFilters = () => {
    const cleaned = {
      empresa: filters.empresa, producto: filters.producto,
      id_registro:'', cliente_id:'', tipo_evento:'', estado:'',
      velocidad_mbps:'', canal_adquisicion:'', promo_id:'',
      tags:'', metadata:'', doc:'', start:'', end:''
    };
    setFilters(cleaned);
    loadData(sanitizeFilters(cleaned), true);
  };

  // -------- FILTRADO LOCAL PARA VISUALIZACIONES
  const parseDateLoose = (val) => {
    if (!val) return null;
    if (/^\d{4}-\d{2}$/.test(val)) return new Date(`${val}-01T00:00:00Z`);
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return new Date(`${val}T00:00:00Z`);
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };
  const normalizeStr = (x) => (x === null || x === undefined) ? '' : String(x).trim().toLowerCase();

  const applyLocalFilters = (rows, f) => {
    if (!rows || !rows.length) return [];
    const id_registro = normalizeStr(f.id_registro);
    const cliente_id  = normalizeStr(f.cliente_id);
    const tipo_evento = normalizeStr(f.tipo_evento);
    const estado      = normalizeStr(f.estado);
    const vel         = f.velocidad_mbps === '' ? '' : Number(f.velocidad_mbps);
    const canal       = normalizeStr(f.canal_adquisicion);
    const promo_id    = normalizeStr(f.promo_id);
    const tagsQuery   = String(f.tags || '').split(',').map(t=>t.trim().toLowerCase()).filter(Boolean);
    const docQ        = normalizeStr(f.doc);
    const startD      = parseDateLoose(f.start);
    const endD        = parseDateLoose(f.end);

    return rows.filter((r) => {
      const rid   = normalizeStr(r.id_registro);
      const rcid  = normalizeStr(r.cliente_id ?? r.cliente ?? r.customer_id);
      const rtype = normalizeStr(r.tipo_evento);
      const rest  = normalizeStr(r.estado ?? r.status ?? r.state ?? r.estatus);
      const rvel  = (r.velocidad_mbps === '' || r.velocidad_mbps === null || r.velocidad_mbps === undefined) ? '' : Number(r.velocidad_mbps);
      const rcan  = normalizeStr(r.canal_adquisicion);
      const rpid  = normalizeStr(r.promo_id);
      const rdoc  = normalizeStr(r.doc);

      const perStr = r.periodo_mes || r.periodo || r.fecha;
      const rDate  = parseDateLoose(perStr);

      if (id_registro && !rid.includes(id_registro)) return false;
      if (cliente_id && rcid !== cliente_id) return false;
      if (tipo_evento && rtype !== tipo_evento) return false;
      if (estado && rest !== estado) return false;
      if (vel !== '' && rvel !== vel) return false;
      if (canal && rcan !== canal) return false;
      if (promo_id && rpid !== promo_id) return false;
      if (docQ && rdoc !== docQ) return false;

      if (tagsQuery.length) {
        const rowTags = Array.isArray(r.tags)
          ? r.tags.map(t=>normalizeStr(t))
          : (r.tags ? String(r.tags).split(',').map(t=>normalizeStr(t)) : []);
        const ok = tagsQuery.every(t => rowTags.includes(t));
        if (!ok) return false;
      }

      if (startD && rDate && rDate < startD) return false;
      if (endD && rDate && rDate > new Date(endD.getTime() + 24*60*60*1000 - 1)) return false;

      return true;
    });
  };

  // Dataset que alimenta visualizaciones
  const viewData = useMemo(() => applyLocalFilters(data, filters), [data, filters]);

  // ------- KPIs (desde viewData)
  const getActiveValues = () => new Set([
    'activo','act','a','active','1',1,true,'true','ok','enabled',
    'habilitado','actived','actv','act','activo'
  ].map(v => (typeof v === 'string' ? v.trim().toLowerCase() : String(v))));

  const calculateKPIs = (d) => {
    if (!d || !d.length) {
      setKpis({ arpu: 0, mrr: 0, subsActivos: 0, ltv: 0 });
      return;
    }
    const totalMRR = d.reduce((s, it) => s + (Number(it.mrr || 0) || 0), 0);
    const arpuVals = d.map(it => Number(it.arpu || 0)).filter(v => !Number.isNaN(v));
    const avgARPU  = arpuVals.length ? (arpuVals.reduce((s,v)=>s+v,0)/arpuVals.length) : 0;

    const churnVals = d.map(it => {
      const raw = it.churn ?? it.churn_rate ?? it.churn_monthly;
      return raw === undefined || raw === null ? NaN : Number(raw);
    }).filter(v => !Number.isNaN(v) && v >= 0);
    const churn  = churnVals.length ? (churnVals.reduce((s,v)=>s+v,0)/churnVals.length) : DEFAULT_MONTHLY_CHURN;
    const margin = DEFAULT_GROSS_MARGIN;
    const ltv    = churn > 0 ? (avgARPU * margin) / churn : avgARPU * 12 * margin;

    const activeSet = getActiveValues();
    const clientesActivos = new Set();
    d.forEach(it => {
      const estadoRaw = it.estado ?? it.status ?? it.state ?? it.estatus ?? '';
      const estadoN = (typeof estadoRaw === 'string') ? estadoRaw.trim().toLowerCase() : String(estadoRaw).trim().toLowerCase();
      const isActive = activeSet.has(estadoN) || activeSet.has(String(estadoRaw));
      if (isActive) {
        const key = [it.cliente_id, it.cliente, it.customer_id, it.doc, it.id_registro]
          .find(c => c !== undefined && c !== null && String(c).trim() !== '');
        if (key) clientesActivos.add(String(key).trim());
      }
    });

    let subs = clientesActivos.size;
    if (subs === 0) {
      const any = d.find(x => x.subs_final || x.subs_activos || x.subscribers);
      if (any) subs = parseInt(any.subs_final || any.subs_activos || any.subscribers, 10) || 0;
    }

    setKpis({
      arpu: Number(avgARPU).toFixed(2),
      mrr: Number(totalMRR).toFixed(2),
      subsActivos: subs,
      ltv: Number(ltv).toFixed(2)
    });
  };

  useEffect(() => { calculateKPIs(viewData); }, [viewData]);

  // ------- datasets derivados (desde viewData)
  const prepareARPUForecastData = () => {
    const historical = (viewData || []).map(item => ({
      periodo: item.periodo_mes,
      arpu: parseFloat(item.arpu || 0),
      type: 'historical'
    }));
    if (!forecast || !forecast.predicciones) return historical;
    const fcast = forecast.predicciones.map(pred => ({
      periodo: pred.periodo, arpu: null,
      forecast: pred.arpu_pred, lower: pred.lower, upper: pred.upper, type: 'forecast'
    }));
    return [...historical, ...fcast];
  };

  const prepareRevenueBySource = () => {
    const bySource = {};
    (viewData || []).forEach(item => {
      const fuente = item.tipo_servicio || item.producto || item.plan || 'Desconocido';
      const val = Number(item.ingresos_totales ?? item.mrr ?? item.arpu ?? 0) || 0;
      if (!bySource[fuente]) bySource[fuente] = 0;
      bySource[fuente] += val;
    });
    return [
      { name: 'Internet', value: 45 },
      { name: 'TV', value: 25 },
      { name: 'Voz', value: 15 },
      { name: 'Paquetes', value: 10 },
      { name: 'Extras', value: 5 }
    ];;
  };

  const prepareChannelData = () => {
    const channels = {};
    (viewData || []).forEach(item => {
      const ch = item.canal_adquisicion || 'Desconocido';
      const val = Number(item.ingresos_totales ?? item.mrr ?? 0) || 0;
      if (!channels[ch]) channels[ch] = 0;
      channels[ch] += val;
    });
    return Object.keys(channels).map(key => ({ canal: key, ingresos: channels[key] }));
  };

  // ---- NUEVO: agregados por tipo_evento
  const prepareTipoEventoAgg = () => {
    const map = {};
    (viewData || []).forEach(item => {
      const key = (item.tipo_evento ?? 'desconocido') + '';
      if (!map[key]) map[key] = { tipo_evento: key, eventos: 0, mrr: 0, arpuSum: 0, arpuN: 0 };
      map[key].eventos += 1;
      map[key].mrr     += Number(item.mrr || 0) || 0;
      const arpuVal = Number(item.arpu || 0);
      if (!Number.isNaN(arpuVal)) { map[key].arpuSum += arpuVal; map[key].arpuN += 1; }
    });
    return Object.values(map).map(r => ({
      tipo_evento: r.tipo_evento,
      eventos: r.eventos,
      mrr: r.mrr,
      arpu_prom: r.arpuN ? r.arpuSum / r.arpuN : 0
    }));
  };

  // ---- NUEVO: agregados por tarifa_plan
  // Si tu columna se llama "tarifaplan" cambia item.tarifa_plan -> item.tarifaplan
  const prepareTarifaPlanAgg = () => {
    const map = {};
    (viewData || []).forEach(item => {
      const key = (item.tarifa_plan ?? 'N/A') + '';
      if (!map[key]) map[key] = { tarifa_plan: key, mrr: 0, arpuSum: 0, arpuN: 0 };
      map[key].mrr += Number(item.mrr || 0) || 0;
      const arpuVal = Number(item.arpu || 0);
      if (!Number.isNaN(arpuVal)) { map[key].arpuSum += arpuVal; map[key].arpuN += 1; }
    });
    return Object.values(map).map(r => ({
      tarifa_plan: r.tarifa_plan,
      mrr: r.mrr,
      arpu_prom: r.arpuN ? r.arpuSum / r.arpuN : 0
    }));
  };

  const revenueBySource = useMemo(() => prepareRevenueBySource(), [viewData]);
  const channelData     = useMemo(() => prepareChannelData(), [viewData]);
  const arpuSeries      = useMemo(() => prepareARPUForecastData(), [viewData, forecast]);
  const tipoEventoAgg   = useMemo(() => prepareTipoEventoAgg(), [viewData]);
  const tarifaPlanAgg   = useMemo(() => prepareTarifaPlanAgg(), [viewData]);

  const KPICard = ({ title, value, icon: Icon, trend, colorClass }) => (
    <div className={`${styles.DashboardARPU__card} ${colorClass}`}>
      <div className={styles.DashboardARPU__cardHeader}>
        <div className={styles.DashboardARPU__iconWrap}>
          <div className={styles.DashboardARPU__iconBg}>
            <Icon className={styles.DashboardARPU__icon} />
          </div>
        </div>
        {trend !== undefined && (
          <div className={`${styles.DashboardARPU__trend} ${trend > 0 ? styles['DashboardARPU__trend--up'] : styles['DashboardARPU__trend--down']}`}>
            {trend > 0 ? <TrendingUp className={styles.DashboardARPU__trendIcon} /> : <TrendingDown className={styles.DashboardARPU__trendIcon} />}
            <span className={styles.DashboardARPU__trendValue}>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <h3 className={styles.DashboardARPU__cardTitle}>{title}</h3>
      <p className={styles.DashboardARPU__cardValue}>{value}</p>
    </div>
  );

  if (loading) {
    return (
      <div className={`${styles.DashboardARPU} ${styles.DashboardARPU__loadingWrap}`}>
        <div className={styles.DashboardARPU__loading}>
          <div className={styles.DashboardARPU__spinner}></div>
          <p className={styles.DashboardARPU__loadingText}>Cargando Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.DashboardARPU}>
      <div className={styles.DashboardARPU__container}>
        {/* Header */}
        <div className={styles.DashboardARPU__header}>
          <div>
            <h1 className={styles.DashboardARPU__title}>Dashboard ARPU</h1>
            <p className={styles.DashboardARPU__subtitle}>Métricas y análisis de ingresos por usuario</p>
          </div>
            <button onClick={handleRefresh} className={styles.DashboardARPU__refreshBtn}>
              <RefreshCw className={styles.DashboardARPU__refreshIcon} />
              Actualizar
            </button>
        </div>

        {/* Filtros */}
        <div className={styles.DashboardARPU__filters}>
          <h2 className={styles.DashboardARPU__filtersTitle}>Filtros</h2>
          <div className={styles.DashboardARPU__filtersGrid}>
            <input type="text" placeholder="ID Registro" value={filters.id_registro}
              onChange={(e)=>handleFilterChange('id_registro', e.target.value)} className={styles.DashboardARPU__input}/>
            <input type="text" placeholder="Cliente ID" value={filters.cliente_id}
              onChange={(e)=>handleFilterChange('cliente_id', e.target.value)} className={styles.DashboardARPU__input}/>
            <input type="text" placeholder="Tipo Evento" value={filters.tipo_evento}
              onChange={(e)=>handleFilterChange('tipo_evento', e.target.value)} className={styles.DashboardARPU__input}/>
            <input type="text" placeholder="Estado" value={filters.estado}
              onChange={(e)=>handleFilterChange('estado', e.target.value)} className={styles.DashboardARPU__input}/>
            <input type="number" placeholder="Velocidad Mbps" value={filters.velocidad_mbps}
              onChange={(e)=>handleFilterChange('velocidad_mbps', e.target.value)} className={styles.DashboardARPU__input}/>
            <input type="text" placeholder="Canal Adquisición" value={filters.canal_adquisicion}
              onChange={(e)=>handleFilterChange('canal_adquisicion', e.target.value)} className={styles.DashboardARPU__input}/>
            <input type="text" placeholder="Promo ID" value={filters.promo_id}
              onChange={(e)=>handleFilterChange('promo_id', e.target.value)} className={styles.DashboardARPU__input}/>
            <input type="text" placeholder="Tags (coma separados)" value={filters.tags}
              onChange={(e)=>handleFilterChange('tags', e.target.value)} className={styles.DashboardARPU__input}/>
            <input type="text" placeholder="Metadata (json o texto)" value={filters.metadata}
              onChange={(e)=>handleFilterChange('metadata', e.target.value)} className={styles.DashboardARPU__input}/>
            <input type="text" placeholder="Doc (número o tipo)" value={filters.doc}
              onChange={(e)=>handleFilterChange('doc', e.target.value)} className={styles.DashboardARPU__input}/>
            <input type="date" placeholder="Fecha Inicio" value={filters.start}
              onChange={(e)=>handleFilterChange('start', e.target.value)} className={styles.DashboardARPU__input}/>
            <input type="date" placeholder="Fecha Fin" value={filters.end}
              onChange={(e)=>handleFilterChange('end', e.target.value)} className={styles.DashboardARPU__input}/>
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={handleApplyFilters} className={styles.DashboardARPU__applyBtn}>Aplicar Filtros</button>
            <button onClick={handleClearFilters} className={styles.DashboardARPU__refreshBtn}
              style={{ background: 'transparent', border: '1px solid rgba(15,23,42,0.06)', color: 'var(--DashboardARPU-text)' }}>
              Limpiar filtros
            </button>
          </div>
        </div>

        {error && (
          <div className={styles.DashboardARPU__error}>
            <AlertCircle className={styles.DashboardARPU__errorIcon} />
            <p className={styles.DashboardARPU__errorText}>{error}</p>
          </div>
        )}

        {/* KPIs */}
        <div className={styles.DashboardARPU__kpisGrid}>
          <KPICard title="ARPU" value={`$${Number(kpis.arpu).toLocaleString()}`} icon={DollarSign} colorClass={styles.DashboardARPU__cardGradientCyan}/>
          <KPICard title="MRR Total" value={`$${Number(kpis.mrr).toLocaleString()}`} icon={TrendingUp} colorClass={styles.DashboardARPU__cardGradientGreen}/>
          <KPICard title="Subs Activos" value={kpis.subsActivos.toLocaleString()} icon={Users} colorClass={styles.DashboardARPU__cardGradientPurple}/>
          <KPICard title="LTV" value={`$${Number(kpis.ltv).toLocaleString()}`} icon={Target} colorClass={styles.DashboardARPU__cardGradientIndigo}/>
        </div>

        {/* Gráficos principales */}
        <div className={styles.DashboardARPU__chartsRow}>
          <div className={styles.DashboardARPU__chartCard}>
            <h2 className={styles.DashboardARPU__chartTitle}><TrendingUp className={styles.DashboardARPU__chartIcon}/>ARPU Histórico + Forecast</h2>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={arpuSeries}>
                <defs>
                  <linearGradient id="colorARPU" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#00E5FF" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFD600" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#FFD600" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="periodo" stroke="#111827" />
                <YAxis stroke="#111827" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e6e9ee', borderRadius: '8px' }} labelStyle={{ color: '#111827' }} />
                <Legend />
                <Area type="monotone" dataKey="upper" fill="#FFD600" fillOpacity={0.1} stroke="none" />
                <Area type="monotone" dataKey="lower" fill="#FFD600" fillOpacity={0.1} stroke="none" />
                <Line type="monotone" dataKey="arpu" stroke="#00E5FF" strokeWidth={3} name="ARPU Real" dot={{ fill: '#00E5FF' }} />
                <Line type="monotone" dataKey="forecast" stroke="#FFD600" strokeWidth={3} strokeDasharray="5 5" name="Forecast" dot={{ fill: '#FFD600' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.DashboardARPU__chartCard}>
            <h2 className={styles.DashboardARPU__chartTitle}><DollarSign className={styles.DashboardARPU__chartIcon}/>MRR por Periodo</h2>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={viewData}>
                <defs>
                  <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1DE9B6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#1DE9B6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e9ee" />
                <XAxis dataKey="periodo_mes" stroke="#111827" />
                <YAxis stroke="#111827" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e6e9ee', borderRadius: '8px' }} labelStyle={{ color: '#111827' }} />
                <Area type="monotone" dataKey="mrr" stroke="#1DE9B6" fillOpacity={1} fill="url(#colorMRR)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.DashboardARPU__chartsRow}>
          <div className={styles.DashboardARPU__chartCard}>
            <h2 className={styles.DashboardARPU__chartTitle}><Award className={styles.DashboardARPU__chartIcon}/>Ingresos por Fuente</h2>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={revenueBySource}
                  cx="50%" cy="50%" labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120} fill="#8884d8" dataKey="value"
                >
                  {revenueBySource.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e6e9ee', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.DashboardARPU__chartCard}>
            <h2 className={styles.DashboardARPU__chartTitle}><ShoppingCart className={styles.DashboardARPU__chartIcon}/>Ingresos por Segmento de Clientes</h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={channelData}>
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6D00" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#FF6D00" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e9ee" />
                <XAxis dataKey="canal" stroke="#111827" />
                <YAxis stroke="#111827" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e6e9ee', borderRadius: '8px' }} />
                <Bar dataKey="ingresos" fill="url(#colorBar)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* NUEVO BLOQUE: Análisis por Tipo de Evento */}
        <div className={styles.DashboardARPU__chartsRow}>
          <div className={styles.DashboardARPU__chartCard}>
            <h2 className={styles.DashboardARPU__chartTitle}><TrendingUp className={styles.DashboardARPU__chartIcon}/>Impacto por Cambio de Servicio</h2>
            <ResponsiveContainer width="100%" height={380}>
              <ComposedChart data={tipoEventoAgg}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e9ee" />
                <XAxis dataKey="tipo_evento" stroke="#111827" />
                <YAxis yAxisId="left" stroke="#111827" />
                <YAxis yAxisId="right" orientation="right" stroke="#111827" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e6e9ee', borderRadius: '8px' }}/>
                <Legend />
                <Bar yAxisId="left" dataKey="mrr" name="MRR" fill="#1DE9B6" radius={[8, 8, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="arpu_prom" name="ARPU Prom" stroke="#7C4DFF" strokeWidth={3} dot />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.DashboardARPU__chartCard}>
            <h2 className={styles.DashboardARPU__chartTitle}><Award className={styles.DashboardARPU__chartIcon}/>Distribución de Cambios de Servicio</h2>
            <ResponsiveContainer width="100%" height={380}>
              <PieChart>
                <Pie
                  data={tipoEventoAgg.map(x => ({ name: x.tipo_evento, value: x.eventos }))}
                  cx="50%" cy="50%" outerRadius={120} labelLine={false} dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent*100).toFixed(0)}%`}
                >
                  {tipoEventoAgg.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e6e9ee', borderRadius: '8px' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* (Se eliminó la tabla de Top Clientes) */}

      </div>
    </div>
  );
};

export default DashboardARPUisp;
