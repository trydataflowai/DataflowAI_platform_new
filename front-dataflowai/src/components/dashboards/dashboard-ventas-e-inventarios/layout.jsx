import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../../styles/Dashboards/dashboard-ventas-e-inventarios/Layout.module.css';

const Card = ({ texto, ruta, onCardClick, styles }) => {
  const ref = useRef(null);

  const handleClick = () => {
    onCardClick(ruta);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onCardClick(ruta);
    }
  };

  return (
    <div
      ref={ref}
      className={styles.DashboardGeneralcard}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={texto}
    >
      <div className={styles.DashboardGeneralcardInner}>
        <div className={styles.DashboardGeneralcardContent}>
          <div className={styles.DashboardGeneralcardHeader}>
            <div className={styles.DashboardGeneralcardIcon}>
              <span className={styles.DashboardGeneralicon}></span>
            </div>
            <h3 className={styles.DashboardGeneralcardTitle}>{texto}</h3>
          </div>

          <div className={styles.DashboardGeneralcardBody}>
            <p className={styles.DashboardGeneralcardDesc}>
              Gestiona y visualiza información de ventas e inventarios
            </p>
          </div>

          <div className={styles.DashboardGeneralcardFooter}>
            <span className={styles.DashboardGeneralcta}>
              Acceder
              <span className={styles.DashboardGeneralctaArrow}>→</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardVentaseInventarios = () => {
  const navigate = useNavigate();

  const opciones = [
    { 
      texto: "CRUD Tiendas", 
      ruta: "/dashboard-ventas-e-inventarios/crudTiendas",
      desc: "Administra la información de las tiendas"
    },
    { 
      texto: "CRUD Productos", 
      ruta: "/dashboard-ventas-e-inventarios/crudProductos",
      desc: "Gestiona el catálogo de productos"
    },
    { 
      texto: "CRUD Inventarios", 
      ruta: "/dashboard-ventas-e-inventarios/crudInventarios",
      desc: "Controla los niveles de inventario"
    },
    { 
      texto: "CRUD Ventas", 
      ruta: "/dashboard-ventas-e-inventarios/crudVentas",
      desc: "Administra las transacciones de ventas"
    },
    { 
      texto: "CRUD Metas", 
      ruta: "/dashboard-ventas-e-inventarios/crudMetas",
      desc: "Define y monitorea objetivos de ventas"
    },
    { 
      texto: "Dashboard de Ventas", 
      ruta: "/dashboard-ventas-e-inventarios/AnalisisVentas",
      desc: "Análisis y reportes de ventas"
    },
    { 
      texto: "Dashboard de Inventarios", 
      ruta: "/dashboard-ventas-e-inventarios/AnalisisInventarios",
      desc: "Análisis y reportes de inventarios"
    },
  ];

  const handleCardClick = (ruta) => {
    navigate(ruta);
  };

  return (
    <main className={`${styles.DashboardGeneralcontainer} ${styles.DashboardGeneralLight}`} aria-labelledby="dashboard-ventas-title">
      
      {/* Header Section */}
      <section className={styles.DashboardGeneralheader}>
        <div className={styles.DashboardGeneralheaderContent}>
          <h1 id="dashboard-ventas-title" className={styles.DashboardGeneraltitle}>
            Dashboard Ventas e Inventarios
          </h1>
          <p className={styles.DashboardGeneralsubtitle}>
            Gestiona, analiza y visualiza información comercial de tu negocio
          </p>
        </div>
      </section>

      {/* Cards Grid */}
      <section className={styles.DashboardGeneralcardsSection} aria-label="Módulos de ventas e inventarios">
        <div className={styles.DashboardGeneralcardsContainer}>
          {opciones.map((opcion, index) => (
            <Card
              key={index}
              texto={opcion.texto}
              ruta={opcion.ruta}
              onCardClick={handleCardClick}
              styles={styles}
            />
          ))}
        </div>
      </section>
    </main>
  );
};

export default DashboardVentaseInventarios;