// src/components/pages/Shopify.jsx
import React, { useEffect, useState } from "react";
import styles from "../../styles/CreacionUsuario.module.css";
import { ShopifyJs } from "../../api/Shopify";

const ShopifyJsx = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargarProductos = async () => {
    setLoading(true);
    setError(null);
    try {
      // Cambia opciones si quieres traer todas las páginas: { all: true }
      const prods = await ShopifyJs.obtenerProductos({ limit: 100 });
      setProductos(prods);
    } catch (err) {
      console.error("Error al obtener productos:", err);
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProductos();
    // si quieres refrescar automáticamente cada X segundos, podrías usar setInterval aquí
  }, []);

  return (
    <div className={styles.container}>
      <h1>Productos Shopify</h1>

      {loading && <p>Cargando productos…</p>}
      {error && (
        <div style={{ color: "red", marginBottom: 12 }}>
          Error: {error}
          <button onClick={cargarProductos} style={{ marginLeft: 8 }}>
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && productos.length === 0 && (
        <p>No se encontraron productos.</p>
      )}

      {!loading && productos.length > 0 && (
        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table className={styles.table || undefined} style={{ minWidth: 900, width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 8 }}>ID</th>
                <th style={{ textAlign: "left", padding: 8 }}>Título</th>
                <th style={{ textAlign: "left", padding: 8 }}>Vendedor</th>
                <th style={{ textAlign: "left", padding: 8 }}>Creado</th>
                <th style={{ textAlign: "left", padding: 8 }}>Publicado</th>
                <th style={{ textAlign: "left", padding: 8 }}>Estado</th>
                <th style={{ textAlign: "left", padding: 8 }}>SKU (variante)</th>
                <th style={{ textAlign: "left", padding: 8 }}>Precio</th>
                <th style={{ textAlign: "left", padding: 8 }}>Inventario</th>
                <th style={{ textAlign: "left", padding: 8 }}>Barcode</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => {
                const firstVariant = (p.variants && p.variants.length > 0) ? p.variants[0] : null;
                return (
                  <tr key={p.id} style={{ borderTop: "1px solid #e6e6e6" }}>
                    <td style={{ padding: 8 }}>{p.id}</td>
                    <td style={{ padding: 8 }}>{p.title}</td>
                    <td style={{ padding: 8 }}>{p.vendor}</td>
                    <td style={{ padding: 8 }}>{p.created_at ? new Date(p.created_at).toLocaleString() : "-"}</td>
                    <td style={{ padding: 8 }}>{p.published_at ? new Date(p.published_at).toLocaleString() : "-"}</td>
                    <td style={{ padding: 8 }}>{p.status || "-"}</td>
                    <td style={{ padding: 8 }}>{firstVariant ? firstVariant.sku || "-" : "-"}</td>
                    <td style={{ padding: 8 }}>{firstVariant ? firstVariant.price : "-"}</td>
                    <td style={{ padding: 8 }}>{firstVariant ? firstVariant.inventory_quantity : "-"}</td>
                    <td style={{ padding: 8 }}>{firstVariant ? firstVariant.barcode || "-" : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <button onClick={cargarProductos}>Refrescar</button>
      </div>
    </div>
  );
};

export default ShopifyJsx;
