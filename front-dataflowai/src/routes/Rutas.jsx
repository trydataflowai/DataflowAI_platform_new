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
import { HomeDashboard } from "../components/pages/HomeDashboard";
import { Marketplace } from "../components/pages/Marketplace";

// Protección de rutas
import RutaProtegida from "../components/componentes/RutaProtegida";

const NO_LAYOUT_PATHS = ["/login"];

// Layout con Navbar + Footer (salta en /login)
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

// Layout con Sidebar (fijo) + main desplazado
const SideBarLayout = ({ children }) => (
  <div style={{ display: "flex", minHeight: "100vh" }}>
    <SideBar />
    <main style={{ flexGrow: 1, marginLeft: "280px" }}>
      {children}
    </main>
  </div>
);

export const Rutas = () => (
  <BrowserRouter>
    <Routes>
      {/* Inicio público */}
      <Route path="/" element={<DefaultLayout><Index /></DefaultLayout>} />

      {/* Login (sin Navbar ni Footer) */}
      <Route path="/login" element={<Login />} />

      {/* HomeLogin (Navbar + Footer) */}
      <Route
        path="/homeLogin"
        element={<DefaultLayout><HomeLogin /></DefaultLayout>}
      />

      {/* Dashboard protegido (con Sidebar) */}
      <Route
        path="/home"
        element={
          <RutaProtegida>
            <SideBarLayout><HomeDashboard /></SideBarLayout>
          </RutaProtegida>
        }
      />

      {/* Marketplace protegido (con Sidebar) */}
      <Route
        path="/marketplace"
        element={
          <RutaProtegida>
            <SideBarLayout><Marketplace /></SideBarLayout>
          </RutaProtegida>
        }
      />
    </Routes>
  </BrowserRouter>
);
