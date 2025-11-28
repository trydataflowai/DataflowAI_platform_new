// src/routes/Rutas.jsx

import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

// API
import { obtenerInfoUsuario } from "../api/Usuario";
import { tokenEstaExpirado, inicializarDetectorInactividad, limpiarDetectorInactividad } from "../api/Login";

// Componentes globales
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { SideBar } from "../components/layout/SideBar";

// Páginas
import Index from "../components/pages/Index";
import Login from "../components/pages/Login";
import LoginServitel from "../components/pages/Login/LoginServitel";
import LoginColtrade from "../components/pages/Login/LoginColtrade";
import LoginMercado from "../components/pages/Login/LoginEspMercado";

import HomeLogin from "../components/pages/HomeLogin";
import { HomeDashboard } from "../components/pages/HomeDashboard";
import HomeTools from "../components/pages/HomeTools";
import { Marketplace } from "../components/pages/Marketplace";
import CreacionUsuario from "../components/pages/CreacionUsuario";
import SoporteUsuario from "../components/pages/SoporteUsuario";
import SoporteDetalleUsuario from "../components/pages/SoporteDetalleUsuario";
import ChatPostgre from "../components/pages/Chxtbut";
import FormBuilder from '../components/pages/FormBuilder';
import FormPublic from '../components/pages/FormPublic';
import FormsEdit from "../components/pages/FormsEdit";
import FormsPrevisualizado from "../components/pages/FormPrevisualizar";
import FormsListado from "../components/pages/FormsListado";

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

// Sales corporativo
import CrudDashboardSalesCorporativoCotizaciones from "../components/pages/dashboardcrud/CrudDashboardSalesCorporativoCotiza";
import CrudDashboardSalesCorporativoMetas from "../components/pages/dashboardcrud/CrudDashboardSalesCorporativoMetas";
import DashboardVentasCorporativo from "../components/dashboards/DashboardSalesCorporativo";

// IPS / Churn / ARPU
import DashboardISPVenta from "../components/dashboards/DashboardISPVenta";
import DashboardChurnKpi from "../components/dashboards/DashboardChurnKpi";
import ChatModal from "../components/dashboard_chat/ChatModal";
import DashboardARPUisp from "../components/dashboards/DashboardARPUisp";

import ShopifyJsx from "../components/pages/Shopify";

// Protección de rutas
import RutaProtegida from "../components/componentes/RutaProtegida";

// Contexto de tema
import { ThemeProvider } from "../components/componentes/ThemeContext";

// Dashboard Espacio y mercadeo del formulario ventas
import DashboardFormsVentasEspacio from "../components/dashboards/DashboardFormsVentasEspacio";

/* ---------------------------
   Configuración de layouts
   --------------------------- */

// Rutas que no deben mostrar Navbar/Footer (coincidencias exactas)
const NO_LAYOUT_PATHS = ["/login", "/crear-usuario", "/crear-empresa"];

// Prefijos de ruta que tampoco deben mostrar layout (ej: /forms/:slug)
const NO_LAYOUT_PATH_PREFIXES = ["/forms"];

/**
 * Comprueba si la ruta actual debe ocultar Navbar/Footer
 */
const isNoLayoutPath = (pathname) => {
  if (!pathname) return false;
  if (NO_LAYOUT_PATHS.includes(pathname)) return true;
  return NO_LAYOUT_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix) || pathname.includes(`${prefix}/`));
};

// Layout por defecto (Navbar + Footer) — oculta si la ruta está en NO_LAYOUT_PATH o prefijos
const DefaultLayout = ({ children }) => {
  const { pathname } = useLocation();
  const hide = isNoLayoutPath(pathname);
  return (
    <>
      {!hide && <Navbar />}
      <main>{children}</main>
      {!hide && <Footer />}
    </>
  );
};

// Layout con SideBar (para rutas protegidas con sidebar)
const SideBarLayout = ({ children }) => (
  <div style={{ display: "flex", minHeight: "100vh" }}>
    <SideBar />
    <main style={{ flexGrow: 1 }}>{children}</main>
  </div>
);

/* ------------------------------------
   Verificador global de autenticación
   Solo valida en rutas que NO sean públicas
   ------------------------------------ */
const VerificadorAutenticacionGlobal = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    // Rutas públicas exactas
    const rutasPublicasExactas = [
      '/',
      '/login',
      '/Servitel/login',
      '/Coltrade/login',
      '/crear-empresa',
      '/crear-usuario',
      '/pagos',
      '/homeLogin',
      '/EspacioMercado/login'
    ];

    // Prefijos o patrones públicos (ej: '/forms/:slug' -> detectamos con includes)
    const rutasPublicasPrefijos = [
      '/forms' // cualquier ruta que contenga '/forms' la consideramos pública (p. ej. '/forms/abc' o '/Coltrade/forms/abc')
    ];

    // Determinar si la ruta actual es pública (ten en cuenta paths con companySegment)
    const pathname = location.pathname || "";
    const esExacta = rutasPublicasExactas.includes(pathname);
    const esPrefijo = rutasPublicasPrefijos.some(pref => pathname === pref || pathname.startsWith(pref) || pathname.includes(`${pref}/`));
    const esRutaPublica = esExacta || esPrefijo;

    console.log('Ruta actual:', pathname, 'Es pública:', esRutaPublica);

    if (!esRutaPublica) {
      const verificarAutenticacion = () => {
        const token = localStorage.getItem('token') || localStorage.getItem('access_token');

        if (!token || tokenEstaExpirado()) {
          console.log('Redirigiendo a login desde ruta protegida');
          limpiarDetectorInactividad();
          window.location.href = '/login';
          return false;
        }
        return true;
      };

      const estaAutenticado = verificarAutenticacion();

      if (estaAutenticado) {
        inicializarDetectorInactividad();
      }
    } else {
      // Ruta pública -> no verificar token ni inicializar detector de inactividad
      console.log('Ruta pública detectada, no se requiere autenticación');
    }

    return () => {
      // Si salimos de una ruta protegida, limpiamos detector de inactividad
      if (!esRutaPublica) {
        limpiarDetectorInactividad();
      }
    };
  }, [location.pathname]);

  return children;
};

/* ---------------------------
   Componente de rutas
   --------------------------- */
export const Rutas = () => {
  const [companySegment, setCompanySegment] = useState(""); // Ej: "Coltrade"
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      try {
        const data = await obtenerInfoUsuario();
        const nombreCorto = data && data.empresa && data.empresa.nombre_corto
          ? String(data.empresa.nombre_corto)
          : "";

        const normalized = nombreCorto ? nombreCorto.trim().replace(/\s+/g, "") : "";

        if (mounted) setCompanySegment(normalized);
      } catch (err) {
        if (mounted) setCompanySegment("");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (token && !tokenEstaExpirado()) {
      fetchUser();
    } else {
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, []);

  // Helper para rutas que deben incluir companySegment cuando aplique
  const p = (path) => {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return companySegment ? `/${companySegment}${normalizedPath}` : normalizedPath;
  };

  // Mostrar una ruta pública sin layout ni sidebar: /forms/:slug (y su versión con companySegment)
  return (
    <BrowserRouter>
      <ThemeProvider>
        <VerificadorAutenticacionGlobal>
          <Routes>
            {/* RUTAS PÚBLICAS - SIN PROTECCIÓN */}
            <Route path="/" element={<DefaultLayout><Index /></DefaultLayout>} />
            <Route path="/login" element={<Login />} />
            <Route path="/Servitel/login" element={<LoginServitel />} />
            <Route path="/Coltrade/login" element={<LoginColtrade />} />
            <Route path="/EspacioMercado/login" element={<LoginMercado />} />
            <Route path="/crear-empresa" element={<CreacionEmpresa />} />
            <Route path="/crear-usuario" element={<CreacionUsuario />} />
            <Route path="/pagos" element={<PagosStripe />} />
            <Route path="/homeLogin" element={<DefaultLayout><HomeLogin /></DefaultLayout>} />

            {/* RUTA PÚBLICA ESPECIAL: FORMULARIO PÚBLICO - sin Navbar/Footer/Sidebar */}
            <Route path="/forms/:slug" element={<FormPublic />} />
            {/* También registramos la versión con companySegment (si existe) */}
            <Route path={p("/forms/:slug")} element={<FormPublic />} />

            {/* RUTAS PROTEGIDAS - Con RutaProtegida y SideBarLayout */}
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
              path={"/dashboard-prueba"}
              element={
                <RutaProtegida>
                  <SideBarLayout>
                    <DashboardPrueba />
                  </SideBarLayout>
                </RutaProtegida>
              }
            />

            <Route
              path={"/dashboard-ventas"}
              element={
                <RutaProtegida>
                  <SideBarLayout>
                    <DashboardVentas />
                  </SideBarLayout>
                </RutaProtegida>
              }
            />

            <Route
              path={"/dashboard-finanzas"}
              element={
                <RutaProtegida>
                  <SideBarLayout>
                    <DashboardFinanzas />
                  </SideBarLayout>
                </RutaProtegida>
              }
            />

            <Route
              path={"/dashboard-compras"}
              element={
                <RutaProtegida>
                  <SideBarLayout>
                    <DashboardCompras />
                  </SideBarLayout>
                </RutaProtegida>
              }
            />

            <Route
              path={"/Apache"}
              element={
                <RutaProtegida>
                  <SideBarLayout>
                    <ApacheEcharts />
                  </SideBarLayout>
                </RutaProtegida>
              }
            />

            <Route
              path={"/configuraciones-dashboard"}
              element={
                <RutaProtegida>
                  <SideBarLayout>
                    <ConfiguracionesDashboard />
                  </SideBarLayout>
                </RutaProtegida>
              }
            />

            <Route
              path={"/sales-dashboard"}
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
              path={"/DashboardSalesReview"}
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
              path={"/DashboardSalesReview/settingsDashSalesReview"}
              element={
                <RutaProtegida>
                  <SideBarLayout>
                    <CrudDashboardSalesReview />
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
              path={"/DashboardVentasOdoo"}
              element={
                <RutaProtegida>
                  <SideBarLayout>
                    <DashboardVentasColtradeOdoo />
                  </SideBarLayout>
                </RutaProtegida>
              }
            />

            {/* Sales corporativo */}
            <Route
              path={"/DashboardSalescorporativo"}
              element={
                <RutaProtegida>
                  <SideBarLayout>
                    <DashboardVentasCorporativo />
                  </SideBarLayout>
                </RutaProtegida>
              }
            />

            <Route
              path={"/dashboardSalescorporativo/Cotizaciones"}
              element={
                <RutaProtegida>
                  <SideBarLayout>
                    <CrudDashboardSalesCorporativoCotizaciones />
                  </SideBarLayout>
                </RutaProtegida>
              }
            />

            <Route
              path={"/dashboardSalescorporativo/Metas"}
              element={
                <RutaProtegida>
                  <SideBarLayout>
                    <CrudDashboardSalesCorporativoMetas />
                  </SideBarLayout>
                </RutaProtegida>
              }
            />

            {/* IPS / Churn / ARPU */}
            <Route
              path={"/DashboardISPventas"}
              element={
                <RutaProtegida>
                  <SideBarLayout>
                    <DashboardISPVenta />
                  </SideBarLayout>
                </RutaProtegida>
              }
            />

            <Route
              path={"/dashboard-kpi-churn"}
              element={
                <RutaProtegida>
                  <SideBarLayout>
                    <DashboardChurnKpi />
                  </SideBarLayout>
                </RutaProtegida>
              }
            />

            <Route
              path={"/chatModal"}
              element={
                <RutaProtegida>
                  <ChatModal />
                </RutaProtegida>
              }
            />

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

            <Route
              path={p("/FormBuilder")}
              element={
                <RutaProtegida>
                  <SideBarLayout>
                    <FormBuilder />
                  </SideBarLayout>
                </RutaProtegida>
              }
            />

            <Route path="/forms/edit/:slug" element={<RutaProtegida><SideBarLayout><FormsEdit /></SideBarLayout></RutaProtegida>} />

            <Route
              path={p("/FormsListado")}
              element={
                <RutaProtegida>
                  <SideBarLayout>
                    <FormsListado />
                  </SideBarLayout>
                </RutaProtegida>
              }
            />


            <Route
              path={p("/FormPrevisualizado")}
              element={
                <RutaProtegida>
                  <SideBarLayout>
                    <FormsPrevisualizado />
                  </SideBarLayout>
                </RutaProtegida>
              }
            />

            <Route
              path={p("/ChatPg")}
              element={
                <RutaProtegida>
                  <SideBarLayout>
                    <ChatPostgre />
                  </SideBarLayout>
                </RutaProtegida>
              }
            />



            <Route
              path={"/ventas-en-punto-de-venta"}
              element={
                <RutaProtegida>
                  <SideBarLayout>
                    <DashboardFormsVentasEspacio />
                  </SideBarLayout>
                </RutaProtegida>
              }
            />

            

          </Routes>
        </VerificadorAutenticacionGlobal>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default Rutas;
