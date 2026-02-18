import React, { useEffect, useState } from "react";
import styles from '../../../styles/Dashboards/dashboard-ventas-e-inventarios/AnalisisInventarios.module.css';

// APIs ya creadas
import { fetchTiendas } from "../../../api/DashboardsApis/dashboard-ventas-e-inventarios/DashboardApiCrudTiendas";
import { fetchDashVeinteProducts } from "../../../api/DashboardsApis/dashboard-ventas-e-inventarios/DashboardApiCrudProductos";
import { fetchDashVeinteInventarios } from "../../../api/DashboardsApis/dashboard-ventas-e-inventarios/DashboardApiCrudInventarios";
import { fetchDashVeinteVentas } from "../../../api/DashboardsApis/dashboard-ventas-e-inventarios/DashboardApiCrudVentas";

const DashboardVentaseInventariosAnalisisInventarios = () => {
  const [tiendas, setTiendas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [inventarios, setInventarios] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [
          tiendasData,
          productosData,
          inventariosData,
          ventasData,
        ] = await Promise.all([
          fetchTiendas(),
          fetchDashVeinteProducts(),
          fetchDashVeinteInventarios(),
          fetchDashVeinteVentas(),
        ]);

        setTiendas(tiendasData);
        setProductos(productosData);
        setInventarios(inventariosData);
        setVentas(ventasData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <p className={styles['dhveinte-inlv-loading']}>Cargando datos...</p>;
  if (error) return <p className={styles['dhveinte-inlv-error']}>Error: {error}</p>;

  return (
    <div className={styles['dhveinte-inlv-container']}>
      <h1 className={styles['dhveinte-inlv-title']}>Dashboard Ventas e Inventarios</h1>

      {/* TIENDAS */}
      <h2 className={styles['dhveinte-inlv-subtitle']}>Tiendas</h2>
      <div className={styles['dhveinte-inlv-table-container']}>
        <table className={styles['dhveinte-inlv-table']}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Empresa</th>
              <th>Nombre</th>
              <th>Dirección</th>
              <th>Horario</th>
              <th>Ciudad</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Canal</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {tiendas.map((t) => (
              <tr key={t.id_tienda}>
                <td>{t.id_tienda}</td>
                <td>{t.id_empresa}</td>
                <td>{t.nombre_tienda}</td>
                <td>{t.direccion_tienda}</td>
                <td>{t.horario_tienda}</td>
                <td>{t.ciudad}</td>
                <td>{t.telefono}</td>
                <td>{t.email}</td>
                <td>{t.canal}</td>
                <td>
                  <span className={`${styles['dhveinte-inlv-status']} ${t.estado ? styles['dhveinte-inlv-status-active'] : styles['dhveinte-inlv-status-inactive']}`}>
                    {t.estado ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PRODUCTOS */}
      <h2 className={styles['dhveinte-inlv-subtitle']}>Productos</h2>
      <div className={styles['dhveinte-inlv-table-container']}>
        <table className={styles['dhveinte-inlv-table']}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Empresa</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Marca</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id_producto}>
                <td>{p.id_producto}</td>
                <td>{p.id_empresa}</td>
                <td>{p.nombre_producto}</td>
                <td>{p.categoria}</td>
                <td>{p.marca}</td>
                <td className={styles['dhveinte-inlv-currency']}>{p.valor_producto}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* INVENTARIOS */}
      <h2 className={styles['dhveinte-inlv-subtitle']}>Inventarios</h2>
      <div className={styles['dhveinte-inlv-table-container']}>
        <table className={styles['dhveinte-inlv-table']}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Empresa</th>
              <th>ID Tienda</th>
              <th>Tienda</th>
              <th>ID Producto</th>
              <th>Producto</th>
              <th>Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {inventarios.map((i) => (
              <tr key={i.id_registro}>
                <td>{i.id_registro}</td>
                <td>{i.id_empresa}</td>
                <td>{i.id_tienda}</td>
                <td>{i.tienda_nombre}</td>
                <td>{i.id_producto}</td>
                <td>{i.producto_nombre}</td>
                <td className={styles['dhveinte-inlv-quantity']}>{i.inventario_cantidad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VENTAS */}
      <h2 className={styles['dhveinte-inlv-subtitle']}>Ventas</h2>
      <div className={styles['dhveinte-inlv-table-container']}>
        <table className={styles['dhveinte-inlv-table']}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Empresa</th>
              <th>ID Tienda</th>
              <th>Tienda</th>
              <th>ID Producto</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Dinero</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((v) => (
              <tr key={v.id_registro}>
                <td>{v.id_registro}</td>
                <td>{v.id_empresa}</td>
                <td>{v.id_tienda}</td>
                <td>{v.tienda_nombre}</td>
                <td>{v.id_producto}</td>
                <td>{v.producto_nombre}</td>
                <td className={styles['dhveinte-inlv-quantity']}>{v.cantidad_vendida}</td>
                <td className={styles['dhveinte-inlv-currency']}>{v.dinero_vendido}</td>
                <td>{v.fecha_venta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardVentaseInventariosAnalisisInventarios;