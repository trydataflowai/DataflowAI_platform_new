import React, { useEffect, useState } from "react";
import styles from "../../../styles/CreacionUsuario.module.css";

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

  if (loading) return <p>Cargando datos...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className={styles.container}>
      <h1>Dashboard Ventas e Inventarios</h1>

      {/* TIENDAS */}
      <h2>Tiendas</h2>
      <table>
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
              <td>{t.estado ? "Activo" : "Inactivo"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* PRODUCTOS */}
      <h2>Productos</h2>
      <table>
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
              <td>{p.valor_producto}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* INVENTARIOS */}
      <h2>Inventarios</h2>
      <table>
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
              <td>{i.inventario_cantidad}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* VENTAS */}
      <h2>Ventas</h2>
      <table>
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
              <td>{v.cantidad_vendida}</td>
              <td>{v.dinero_vendido}</td>
              <td>{v.fecha_venta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DashboardVentaseInventariosAnalisisInventarios;
