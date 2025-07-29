// src/components/pages/Marketplace.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  obtenerTodosLosDashboards,
  adquirirDashboard
} from '../../api/Dashboards';
import { obtenerInfoUsuario } from '../../api/Usuario';

// Componente de tarjeta
const DashboardCard = ({ dash, adquirido, loading, onAcquire, onView }) => (
  <div style={{ border: '1px solid #ccc', padding: 12, marginBottom: 8 }}>
    <h3>{dash.producto}</h3>
    <p>Slug: {dash.slug}</p>

    {/* BOTÓN ADQUIRIR */}
    {!adquirido && (
      <button onClick={() => onAcquire(dash.id_producto)} disabled={loading} style={{ marginRight: 8 }}>
        {loading ? 'Adquiriendo...' : 'Adquirir'}
      </button>
    )}

    {/* BOTÓN VER DASHBOARD */}
    <button onClick={() => onView(dash.slug)}>
      Ver Dashboard
    </button>
  </div>
);

// Página principal Marketplace
export const Marketplace = () => {
  const [dashboards, setDashboards] = useState([]);
  const [adquiridos, setAdquiridos] = useState([]);
  const [loadingIds, setLoadingIds] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const [userInfo, all] = await Promise.all([
        obtenerInfoUsuario(),
        obtenerTodosLosDashboards()
      ]);
      setAdquiridos(userInfo.productos.map(p => p.id_producto));
      setDashboards(all);
    })();
  }, []);

  const handleAcquire = async (id) => {
    setLoadingIds(ids => [...ids, id]);
    try {
      await adquirirDashboard(id);
      setAdquiridos(ids => [...ids, id]);
      const dash = dashboards.find(d => d.id_producto === id);
      navigate(`/${dash.slug}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingIds(ids => ids.filter(x => x !== id));
    }
  };

  const handleView = (slug) => {
    const url = `${window.location.origin}/${slug}`;
    window.open(url, '_blank');
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
      <h1>Marketplace</h1>
      {dashboards.map(dash => (
        <DashboardCard
          key={dash.id_producto}
          dash={dash}
          adquirido={adquiridos.includes(dash.id_producto)}
          loading={loadingIds.includes(dash.id_producto)}
          onAcquire={handleAcquire}
          onView={handleView}
        />
      ))}
    </div>
  );
};
