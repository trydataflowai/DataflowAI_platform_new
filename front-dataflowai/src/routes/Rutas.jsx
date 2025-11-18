// src/routes/Rutas.jsx

import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

// API
import { obtenerInfoUsuario } from "../api/Usuario";

// Componentes globales
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { SideBar } from "../components/layout/SideBar";

// Páginas
import Index from "../components/pages/Index";
import Login from "../components/pages/Login";
import LoginServitel from "../components/pages/Login/LoginServitel";
import LoginColtrade from "../components/pages/Login/LoginColtrade";

import HomeLogin from "../components/pages/HomeLogin";
import { HomeDashboard } from "../components/pages/HomeDashboard";
import HomeTools from "../components/pages/HomeTools";
import { Marketplace } from "../components/pages/Marketplace";
import CreacionUsuario from "../components/pages/CreacionUsuario";
import SoporteUsuario from "../components/pages/SoporteUsuario";
import SoporteDetalleUsuario from "../components/pages/SoporteDetalleUsuario";
import ChatBot from "../components/pages/ChatBot";

import ConfiguracionUsuarios from "../components/pages/Pefil";
import AppCambiarContrasena from "../components/pages/Perfil/CambiarContrasena";
import ActivarDesactivarUsuario from "../components/pages/Perfil/ActivarDesactivarUsuarios";
import ModificarInformacionPersonal from "../components/pages/Perfil/ModificarInformacionPersonal";
import AsgDashboardAsignarDashboards from "../components/pages/Perfil/AsignarDashboards";

import ConfiguracionesDashboard from "../components/pages/ConfiguracionesDashboard";
import CreacionEmpresa from "../components/pages/CreacionEmpresa";
import PagosStripe from "../components/pages/PagosStripe";

import { DashboardPrueba } from "../components/dashboards/DashboardPrueba";
import DashboardVentas from "../components/dashboards/DashboardVentas";
import DashboardFinanzas from "../components/dashboards/DashboardFinanzas";
import DashboardCompras from "../components/dashboards/DashboardCompras";
import DashboardSalesreview from "../components/dashboards/DashboardSalesreview";
import SalesDashboard from "../components/dashboards/SalesDashboard";
import ApacheEcharts from "../components/dashboards/00Echarts";



import CrudDashboardSalesReview from "../components/pages/dashboardcrud/CrudDashboardSalesreview";

import DashboardVentasColtradeOdoo from "../components/dashboards/DashboardColtradeOdoo";



//Rutas correspondientes al DASHBOARD de sales corporativo

import CrudDashboardSalesCorporativoCotizaciones from "../components/pages/dashboardcrud/CrudDashboardSalesCorporativoCotiza";
import CrudDashboardSalesCorporativoMetas from "../components/pages/dashboardcrud/CrudDashboardSalesCorporativoMetas";
import DashboardVentasCorporativo from "../components/dashboards/DashboardSalesCorporativo";

//Rutas correspondientes al dashboard de IPS
import DashboardISPVenta from "../components/dashboards/DashboardISPVenta";



import ShopifyJsx from "../components/pages/Shopify";


// Rutas correspondientes al dashboard ARPU ISP
import DashboardARPUisp from "../components/dashboards/DashboardARPUisp";


// Protección de rutas
import RutaProtegida from "../components/componentes/RutaProtegida";

// Contexto de tema
import { ThemeProvider } from "../components/componentes/ThemeContext";

// Paths sin Navbar ni Footer
const NO_LAYOUT_PATHS = ["/login", "/crear-usuario", "/crear-empresa"];

// Layout con Navbar + Footer (se omite si el path está en NO_LAYOUT_PATHS)
const DefaultLayout = ({ children }) => {
  const { pathname } = useLocation();
  const hide = NO_LAYOUT_PATHS.includes(pathname);
  return (
    <>
      {!hide && <Navbar />}
      <main>{children}</main>
      {!hide && <Footer />}
    </>
  );
};

// Layout con Sidebar
// <-- MODIFICACIÓN: quitamos marginLeft y dejamos que el layout en flex gestione el ancho -->
const SideBarLayout = ({ children }) => (
  <div style={{ display: "flex", minHeight: "100vh" }}>
    <SideBar />
    {/* main ya no tiene marginLeft: el flex hace que el contenido esté al lado del sidebar */}
    <main style={{ flexGrow: 1 }}>{children}</main>
  </div>
);

/**
 * Rutas principales.
 */
export const Rutas = () => {
  const [companySegment, setCompanySegment] = useState(""); // Ej: "Coltrade"
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      try {
        const data = await obtenerInfoUsuario();
        const nombreCorto =
          data && data.empresa && data.empresa.nombre_corto
            ? String(data.empresa.nombre_corto)
            : "";

        const normalized = nombreCorto ? nombreCorto.trim().replace(/\s+/g, "") : "";

        if (mounted) {
          setCompanySegment(normalized);
        }
      } catch (err) {
        if (mounted) {
          setCompanySegment("");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUser();

    return () => {
      mounted = false;
    };
  }, []);

  const p = (path) => {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return companySegment ? `/${companySegment}${normalizedPath}` : normalizedPath;
  };

  return (
    <BrowserRouter>
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<DefaultLayout><Index /></DefaultLayout>} />

          <Route path="/login" element={<Login />} />
          <Route path="Servitel/login" element={<LoginServitel />} />
          <Route path="Coltrade/login" element={<LoginColtrade />} />

          <Route path="/crear-empresa" element={<CreacionEmpresa />} />
          <Route path="/crear-usuario" element={<CreacionUsuario />} />
          <Route path="/pagos" element={<PagosStripe />} />

          <Route path="/homeLogin" element={<DefaultLayout><HomeLogin /></DefaultLayout>} />

          <Route
            path={p("/home")}
            element={
              <RutaProtegida>
                <SideBarLayout>
                  <HomeDashboard />
                </SideBarLayout>
              </RutaProtegida>
            }
          />

          <Route
            path={p("/marketplace")}
            element={
              <RutaProtegida>
                <SideBarLayout>
                  <Marketplace />
                </SideBarLayout>
              </RutaProtegida>
            }
          />

          <Route
            path={("/dashboard-prueba")}
            element={
              <RutaProtegida>
                <SideBarLayout>
                  <DashboardPrueba />
                </SideBarLayout>
              </RutaProtegida>
            }
          />

          <Route
            path={("/dashboard-ventas")}
            element={
              <RutaProtegida>
                <SideBarLayout>
                  <DashboardVentas />
                </SideBarLayout>
              </RutaProtegida>
            }
          />

          <Route
            path={("/dashboard-finanzas")}
            element={
              <RutaProtegida>
                <SideBarLayout>
                  <DashboardFinanzas />
                </SideBarLayout>
              </RutaProtegida>
            }
          />

          <Route
            path={("/dashboard-compras")}
            element={
              <RutaProtegida>
                <SideBarLayout>
                  <DashboardCompras />
                </SideBarLayout>
              </RutaProtegida>
            }
          />

          <Route
            path={("/Apache")}
            element={
              <RutaProtegida>
                <SideBarLayout>
                  <ApacheEcharts />
                </SideBarLayout>
              </RutaProtegida>
            }
          />

          <Route
            path={("/configuraciones-dashboard")}
            element={
              <RutaProtegida>
                <SideBarLayout>
                  <ConfiguracionesDashboard />
                </SideBarLayout>
              </RutaProtegida>
            }
          />

          <Route
            path={("/sales-dashboard")}
            element={
              <RutaProtegida>
                <SideBarLayout>
                  <SalesDashboard />
                </SideBarLayout>
              </RutaProtegida>
            }
          />

          <Route
            path={p("/configuracion-perfil")}
            element={
              <RutaProtegida>
                <SideBarLayout>
                  <ConfiguracionUsuarios />
                </SideBarLayout>
              </RutaProtegida>
            }
          />

          <Route
            path={p("/cambiar-contrasena")}
            element={
              <RutaProtegida>
                <SideBarLayout>
                  <AppCambiarContrasena />
                </SideBarLayout>
              </RutaProtegida>
            }
          />

          <Route
            path={p("/desactivar-activar-usuarios")}
            element={
              <RutaProtegida>
                <SideBarLayout>
                  <ActivarDesactivarUsuario />
                </SideBarLayout>
              </RutaProtegida>
            }
          />

          <Route
            path={p("/ModificarInformacionPersonal")}
            element={
              <RutaProtegida>
                <SideBarLayout>
                  <ModificarInformacionPersonal />
                </SideBarLayout>
              </RutaProtegida>
            }
          />

          <Route
            path={p("/AsignarDashboards")}
            element={
              <RutaProtegida>
                <SideBarLayout>
                  <AsgDashboardAsignarDashboards />
                </SideBarLayout>
              </RutaProtegida>
            }
          />

          <Route
            path={("/DashboardSalesReview")}
            element={
              <RutaProtegida>
                <SideBarLayout>
                  <DashboardSalesreview />
                </SideBarLayout>
              </RutaProtegida>
            }
          />


          <Route
            path={p("/SoporteUsuario")}
            element={
              <RutaProtegida>
                <SideBarLayout>
                  <SoporteUsuario />
                </SideBarLayout>
              </RutaProtegida>
            }
          />

          <Route
            path={p("/SoporteDetalleUsuario")}
            element={
              <RutaProtegida>
                <SideBarLayout>
                  <SoporteDetalleUsuario />
                </SideBarLayout>
              </RutaProtegida>
            }
          />

          <Route
            path={p("/HomeTools")}
            element={
              <RutaProtegida>
                <SideBarLayout>
                  <HomeTools />
                </SideBarLayout>
              </RutaProtegida>
            }
          />


          <Route
            path={("/DashboardSalesReview/settingsDashSalesReview")}
            element={
              <RutaProtegida>
                <SideBarLayout>
                  <CrudDashboardSalesReview />
                </SideBarLayout>
              </RutaProtegida>
            }
          />

          <Route
            path={p("/ChatBot")}
            element={
              <RutaProtegida>
                <SideBarLayout>
                  <ChatBot />
                </SideBarLayout>
              </RutaProtegida>
            }
          />





          <Route
            path={p("/Shopify/Prueba/deApi")}
            element={
              <RutaProtegida>
                <SideBarLayout>
                  <ShopifyJsx />
                </SideBarLayout>
              </RutaProtegida>
            }
          />

          <Route
            path={("/DashboardVentasOdoo")}
            element={
              <RutaProtegida>
                <SideBarLayout>
                  <DashboardVentasColtradeOdoo />
                </SideBarLayout>
              </RutaProtegida>
            }
          />



          //Rutas correspondientes al DASHBOARD de sales corporativo
          <Route
            path={("/DashboardSalescorporativo")}
            element={
              <RutaProtegida>
                <SideBarLayout>
                  <DashboardVentasCorporativo />
                </SideBarLayout>
              </RutaProtegida>
            }
          />

          <Route
            path={("/dashboardSalescorporativo/Cotizaciones")}
            element={
              <RutaProtegida>
                <SideBarLayout>
                  <CrudDashboardSalesCorporativoCotizaciones />
                </SideBarLayout>
              </RutaProtegida>
            }
          />

          <Route
            path={("/dashboardSalescorporativo/Metas")}
            element={
              <RutaProtegida>
                <SideBarLayout>
                  <CrudDashboardSalesCorporativoMetas />
                </SideBarLayout>
              </RutaProtegida>
            }
          />

          //Rutas correspondientes al DASHBOARD Ips
          <Route
            path={("/DashboardISPventas")}
            element={
              <RutaProtegida>
                <SideBarLayout>
                  <DashboardISPVenta />
                </SideBarLayout>
              </RutaProtegida>
            }
          />


          // Rutas correspondientes al DASHBOARD ARPU ISP
          <Route
  path={"/DashboardARPUisp"}
  element={
    <RutaProtegida>
      <SideBarLayout>
        <DashboardARPUisp />
      </SideBarLayout>
    </RutaProtegida>
  }
/>
          
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default Rutas;
