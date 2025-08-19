**este es el JSON de la api**

C:\Users\Julian Herreño\OneDrive - Colombian Trade Company SAS\DATA\02. AREAS\DATA\Julian Estif Herreno Palacios\09-DataFlow-WebSite\front-dataflowai\src\api\DashboardsApis\SalesDashboard.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function fetchDashboardSales(startDate, endDate) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No hay token en localStorage');

  const params = new URLSearchParams();
  if (startDate) params.append('start', startDate);
  if (endDate) params.append('end', endDate);

  const res = await fetch(`${API_BASE_URL}dashboard-sales/?${params}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error ${res.status}`);
  }

  return res.json();
}

[
  {
    "id_registro": 1,
    "id_empresa": 1,
    "id_producto": 5,
    "point_of_sale_id": "POS-001",
    "point_of_sale": "Main Store",
    "channel": "Online",
    "city": "Bogotá",
    "region": "Andina",
    "quantity_sold": 50,
    "sales_amount": "250000.00",
    "average_ticket": "5000.00",
    "promoted_units": 10,
    "total_discount": "20000.00",
    "number_transactions": 45,
    "returns": 2,
    "return_amount": "10000.00",
    "sale_date": "2025-08-18",
    "month": 8,
    "year": 2025,
    "weekday": "Monday",
    "hour": "14:30:00",
    "sku": "SKU-12345",
    "product_name": "Gaming Keyboard",
    "category": "Electronics",
    "subcategory": "Keyboards",
    "brand": "Redragon",
    "customer_type": "Retail",
    "customer_segment": "Gamer",
    "customer_gender": "Male",
    "customer_age": 22,
    "gross_profit": "150000.00",
    "total_cost": "100000.00",
    "profit_margin": "60.00",
    "notes": "First test insert"
  }
]

**Entonces lo único que quiero es que coloques estas graficas tal cual USANDO MI API, ósea mi JSON. No agregues diseño ni nada solo haz las graficas usando mis datos de la API, ESTAS GRAFICAS:**

***Grafica de líneas por mes:***

**aca lo quiero implementar el dashboard**

C:\Users\Julian Herreño\OneDrive - Colombian Trade Company SAS\DATA\02. AREAS\DATA\Julian Estif Herreno Palacios\09-DataFlow-WebSite\front-dataflowai\src\components\dashboards\SalesDashboard.jsx

import React from 'react';
import styles from '../../styles/CreacionUsuario.module.css';

const SalesDashboard = () => {
  return (
    `<div className={styles.container}>`
      `<h1>`Dashboard de Ventas`</h1>`
    `</div>`
  );
};

export default SalesDashboard;

***Necesito que en mi componente React , al cargar los datos , primero se intenten mostrar los registros de la empresa del usuario logeado (obtenido desde obtenerInfoUsuario()). En caso de que no existan datos asociados, quiero que el sistema use los registros de la empresa con id = 56 como datos de referencia y mostrar un aviso visual (banner) de que se están usando datos de demostración.***

import { obtenerInfoUsuario } from '../../api/Usuario';

ejemplo

const usuario = await obtenerInfoUsuario();
const idEmpresaUsuario = usuario.empresa?.id;

let datosFiltrados = compras.filter(
  item => item.id_empresa === idEmpresaUsuario
);

if (datosFiltrados.length === 0) {
  datosFiltrados = compras.filter(item => item.id_empresa === 2);
  setUsandoDatosReferencia(true);
}

{usandoDatosReferencia && (

<div className={styles.warningBanner}>
    <span className={styles.warningIcon}⚠️</span>
    <div className={styles.warningContent}>
      <h3 className={styles.warningTitle}>Datos de Referencia</h3>
      <p className={styles.warningText}>
        Estás viendo datos de demostración porque tu empresa aún no tiene registros.
      </p>
    </div>
  </div>
)}
