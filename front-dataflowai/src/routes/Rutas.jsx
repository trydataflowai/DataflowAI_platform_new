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
import CreacionUsuario from "../components/pages/CreacionUsuario";
import CreacionEmpresa from "../components/pages/CreacionEmpresa";
import PagosStripe from "../components/pages/PagosStripe";

// Protección de rutas
import RutaProtegida from "../components/componentes/RutaProtegida";

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
    <Routes>
      {/* Página de inicio pública */}
      <Route path="/" element={<DefaultLayout><Index /></DefaultLayout>} />

      {/* Login (sin Navbar ni Footer) */}
      <Route path="/login" element={<Login />} />

      {/* Creación de usuario (sin Navbar ni Footer) */}
      <Route path="/crear-usuario" element={<CreacionUsuario />} />

      {/* Creación de empresa (sin Navbar ni Footer) */}
      <Route path="/crear-empresa" element={<CreacionEmpresa />} />

      {/* Pagos con Stripe (sin Navbar ni Footer) */}
      <Route path="/pagos" element={<PagosStripe />} />
      
      {/* HomeLogin (con Navbar y Footer) */}
      <Route path="/homeLogin" element={<DefaultLayout><HomeLogin /></DefaultLayout>} />

      {/* Dashboard (protegido, con Sidebar) */}
      <Route
        path="/home"
        element={
          <RutaProtegida>
            <SideBarLayout><HomeDashboard /></SideBarLayout>
          </RutaProtegida>
        }
      />

      {/* Marketplace (protegido, con Sidebar) */}
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
