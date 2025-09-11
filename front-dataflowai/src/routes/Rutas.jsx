// src/routes/Rutas.jsx

import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

// Componentes globales
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { SideBar } from "../components/layout/SideBar";

// Páginas
import Index from "../components/pages/Index";
import Login from "../components/pages/Login";
import HomeLogin from "../components/pages/HomeLogin";
import Home from "../components/pages/Home";
import { HomeDashboard } from "../components/pages/HomeDashboard";
import { Marketplace } from "../components/pages/Marketplace";
import CreacionUsuario from "../components/pages/CreacionUsuario";
import SoporteUsuario from "../components/pages/SoporteUsuario";
import SoporteDetalleUsuario from "../components/pages/SoporteDetalleUsuario";


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
const SideBarLayout = ({ children }) => (
  <div style={{ display: "flex", minHeight: "100vh" }}>
    <SideBar />
    <main style={{ flexGrow: 1, marginLeft: "280px" }}>{children}</main>
  </div>
);

export const Rutas = () => (
  <BrowserRouter>
    {/* THEME PROVIDER al nivel más alto */}
    <ThemeProvider>
      <Routes>
        {/* Página de inicio pública */}
        <Route path="/" element={<DefaultLayout><Index /></DefaultLayout>} />

        {/* Rutas sin layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/crear-empresa" element={<CreacionEmpresa />} />
        <Route path="/crear-usuario" element={<CreacionUsuario />} />
        <Route path="/pagos" element={<PagosStripe />} />

        {/* HomeLogin (con Navbar y Footer) */}
        <Route path="/homeLogin" element={<DefaultLayout><HomeLogin /></DefaultLayout>} />

        {/* Dashboard (protegido, con Sidebar y tema) */}
        <Route
          path="/home"
          element={
            <RutaProtegida>
              <SideBarLayout>
                <HomeDashboard />
              </SideBarLayout>
            </RutaProtegida>
          }
        />

        {/* Marketplace (protegido, con Sidebar y tema) */}
        <Route
          path="/marketplace"
          element={
            <RutaProtegida>
              <SideBarLayout>
                <Marketplace />
              </SideBarLayout>
            </RutaProtegida>
          }
        />

        {/* Otros dashboards */}
        <Route
          path="/dashboard-prueba"
          element={
            <RutaProtegida>
              <SideBarLayout>
                <DashboardPrueba />
              </SideBarLayout>
            </RutaProtegida>
          }
        />

        <Route
          path="/dashboard-ventas"
          element={
            <RutaProtegida>
              <SideBarLayout>
                <DashboardVentas />
              </SideBarLayout>
            </RutaProtegida>
          }
        />

        <Route
          path="/dashboard-finanzas"
          element={
            <RutaProtegida>
              <SideBarLayout>
                <DashboardFinanzas />
              </SideBarLayout>
            </RutaProtegida>
          }
        />

        <Route
          path="/dashboard-compras"
          element={
            <RutaProtegida>
              <SideBarLayout>
                <DashboardCompras />
              </SideBarLayout>
            </RutaProtegida>
          }
        />



        <Route
          path="/Apache"
          element={
            <RutaProtegida>
              <SideBarLayout>
                <ApacheEcharts />
              </SideBarLayout>
            </RutaProtegida>
          }
        />


        <Route
          path="/configuraciones-dashboard"
          element={
            <RutaProtegida>
              <SideBarLayout>
                <ConfiguracionesDashboard />
              </SideBarLayout>
            </RutaProtegida>
          }
        />



         <Route
          path="/sales-dashboard"
          element={
            <RutaProtegida>
              <SideBarLayout>
                <SalesDashboard />
              </SideBarLayout>
            </RutaProtegida>
          }
        />



        

         <Route
          path="/configuracion-perfil"
          element={
            <RutaProtegida>
              <SideBarLayout>
                <ConfiguracionUsuarios />
              </SideBarLayout>
            </RutaProtegida>
          }
        />


         <Route
          path="/cambiar-contrasena"
          element={
            <RutaProtegida>
              <SideBarLayout>
                <AppCambiarContrasena />
              </SideBarLayout>
            </RutaProtegida>
          }
        />

         <Route
          path="/desactivar-activar-usuarios"
          element={
            <RutaProtegida>
              <SideBarLayout>
                <ActivarDesactivarUsuario />
              </SideBarLayout>
            </RutaProtegida>
          }
        />


         <Route
          path="/ModificarInformacionPersonal"
          element={
            <RutaProtegida>
              <SideBarLayout>
                <ModificarInformacionPersonal />
              </SideBarLayout>
            </RutaProtegida>
          }
        />
         <Route
          path="/AsignarDashboards"
          element={
            <RutaProtegida>
              <SideBarLayout>
                <AsgDashboardAsignarDashboards />
              </SideBarLayout>
            </RutaProtegida>
          }
        />


        <Route
          path="/DashboardSalesReview"
          element={
            <RutaProtegida>
              <SideBarLayout>
                <DashboardSalesreview />
              </SideBarLayout>
            </RutaProtegida>
          }
        />


         <Route
          path="/WelcomeHome"
          element={
            <RutaProtegida>
                <Home />
            </RutaProtegida>
          }
        />



        <Route
          path="/SoporteUsuario"
          element={
            <RutaProtegida>
              <SideBarLayout>
                <SoporteUsuario />
              </SideBarLayout>
            </RutaProtegida>
          }
        />
        <Route
          path="/SoporteDetalleUsuario"
          element={
            <RutaProtegida>
              <SideBarLayout>
                <SoporteUsuario />
              </SideBarLayout>
            </RutaProtegida>
          }
        />  


         
      </Routes>
    </ThemeProvider>
  </BrowserRouter>
);

