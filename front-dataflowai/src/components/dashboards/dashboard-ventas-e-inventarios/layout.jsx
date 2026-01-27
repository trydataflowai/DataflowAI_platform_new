import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../../styles/CreacionUsuario.module.css';

const DashboardVentaseInventarios = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <h1>Dashboard ventas e Inventarios</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '30px' }}>
        <button onClick={() => navigate('/dashboard-ventas-e-inventarios/crudTiendas')}>
          Ir a CRUD Tiendas
        </button>

        <button onClick={() => navigate('/dashboard-ventas-e-inventarios/crudProductos')}>
          Ir a CRUD Productos
        </button>

        <button onClick={() => navigate('/dashboard-ventas-e-inventarios/crudInventarios')}>
          Ir a CRUD Inventarios
        </button>

        <button onClick={() => navigate('/dashboard-ventas-e-inventarios/crudVentas')}>
          Ir a CRUD Ventas
        </button>

        <button onClick={() => navigate('/dashboard-ventas-e-inventarios/crudMetas')}>
          Ir a CRUD Metas
        </button>

         <button onClick={() => navigate('/dashboard-ventas-e-inventarios/AnalisisVentas')}>
          Dashboard de Ventas
        </button>

  <button onClick={() => navigate('/dashboard-ventas-e-inventarios/AnalisisInventarios')}>
          Dashboard de inv
        </button>



        
      </div>
    </div>
  );
};

export default DashboardVentaseInventarios;
