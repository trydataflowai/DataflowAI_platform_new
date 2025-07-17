import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

// Componentes globales de la interfaz
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { SideBar } from "../components/layout/SideBar";

// Páginas principales
import Index from "../components/pages/Index";
import Login from "../components/pages/Login";
import { HomeDashboard } from "../components/pages/HomeDashboard";
import HomeLogin from "/src/components/pages/HomeLogin.jsx";
import { Marketplace } from "../components/pages/Marketplace";

// Componente para proteger rutas con autenticación
import RutaProtegida from '../components/componentes/RutaProtegida';

// Definimos qué rutas no deben mostrar Navbar/Footer
const NO_LAYOUT_PATHS = ["/login"];

// Layout por defecto (Navbar + Footer)
const DefaultLayout = ({ children }) => {
  const { pathname } = useLocation();
  const hideLayout = NO_LAYOUT_PATHS.includes(pathname);

  return (
    <>
      {!hideLayout && <Navbar />}
      <main>{children}</main>
      {!hideLayout && <Footer />}
    </>
  );
};

// Layout con Sidebar (usado en rutas protegidas con dashboard)
const SideBarLayout = ({ children }) => {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <SideBar />
      <main style={{ flexGrow: 1 }}>{children}</main>
    </div>
  );
};

// Definición de todas las rutas de la app
export const Rutas = () => (
  <BrowserRouter>
    <Routes>

      {/* 🔒 Ruta protegida para el dashboard principal */}
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

      {/* 🔒 Ruta protegida para la página Marketplace */}
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

      {/* Ruta pública para el Login (sin Navbar ni Footer) */}
      <Route path="/login" element={<Login />} />

      {/* Ruta pública para la página homeLogin (solo Navbar y Footer, sin Sidebar) */}
      <Route
        path="/homeLogin"
        element={
          <DefaultLayout>
            <HomeLogin />
          </DefaultLayout>
        }
      />

      {/* Ruta para la página de inicio (Index) con layout normal */}
      <Route
        path="/"
        element={
          <DefaultLayout>
            <Index />
          </DefaultLayout>
        }
      />
      
    </Routes>
  </BrowserRouter>
);
