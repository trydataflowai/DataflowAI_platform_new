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
import HomeLogin from "../components/pages/HomeLogin";
import Home from "../components/pages/Home";
import { HomeDashboard } from "../components/pages/HomeDashboard";
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

/**
 * Rutas principales.
 *
 * Lógica:
 * - Al montar, intenta obtener info del usuario (con token).
 * - Si encuentra empresa.nombre_corto lo normaliza (quita espacios) y lo usa
 *   como prefijo para las rutas protegidas.
 *
 * Nota: la función p(path) antepone `/${companySegment}` si existe, de lo contrario
 * devuelve el path tal cual. Así puedes controlar fácilmente qué rutas van
 * con prefijo y cuáles no.
 */
export const Rutas = () => {
  const [companySegment, setCompanySegment] = useState(""); // Ej: "Coltrade"
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      try {
        const data = await obtenerInfoUsuario();
        // seguridad: verifica que exista empresa.nombre_corto
        const nombreCorto =
          data && data.empresa && data.empresa.nombre_corto
            ? String(data.empresa.nombre_corto)
            : "";

        // Normalizar: quitar espacios (puedes cambiar a replace(/\s+/g,'-') si prefieres guiones)
        const normalized = nombreCorto ? nombreCorto.trim().replace(/\s+/g, "") : "";

        if (mounted) {
          setCompanySegment(normalized);
        }
      } catch (err) {
        // Si falla (no token, sesión expirada, etc.) dejamos companySegment vacío.
        // Puedes registrar el error si quieres:
        // console.error("No se pudo obtener info usuario:", err);
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

  // p('/home') => '/Coltrade/home' o '/home' si companySegment == ''
  const p = (path) => {
    // Asegurar que path empiece con '/' (para inputs como '/home' o 'home')
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return companySegment ? `/${companySegment}${normalizedPath}` : normalizedPath;
  };

  // Mientras carga la info del usuario, puedes:
  // - Mostrar nada (retornar las rutas sin prefijo) o
  // - Esperar y luego renderizar.
  // Aquí renderizamos las rutas inmediatamente (sin prefijo) si loading === true,
  // para evitar bloquear la app. Cuando termine la carga, el prefijo se aplicará
  // automáticamente (siempre que el usuario navegue de nuevo o uses navegación programática).
  //
  // Si prefieres bloquear y esperar a que termine la petición, cambia esto a:
  // if (loading) return <div>Cargando...</div>;

  return (
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
            path={p("/home")}
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
            path={p("/marketplace")}
            element={
              <RutaProtegida>
                <SideBarLayout>
                  <Marketplace />
                </SideBarLayout>
              </RutaProtegida>
            }
          />

          {/* Otros dashboards (todos protegidos y con prefijo si aplica) */}
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

          {/* Aquí la ruta que pediste: /{empresa}/WelcomeHome */}
          <Route
            path={p("/WelcomeHome")}
            element={
              <RutaProtegida>
                <Home />
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
            path={p("/ChatBot")}
            element={
              <RutaProtegida>
                <SideBarLayout>
                  <ChatBot />
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
