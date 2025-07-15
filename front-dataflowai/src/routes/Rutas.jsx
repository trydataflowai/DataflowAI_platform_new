import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { SideBar } from "../components/layout/SideBar";

import Index from "../components/pages/Index";
import Login from "../components/pages/Login";
import { HomeDashboard } from "../components/pages/HomeDashboard";
import RutaProtegida from '../components/componentes/RutaProtegida';


const NO_LAYOUT_PATHS = ["/login"];

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

const SideBarLayout = ({ children }) => {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <SideBar />
      <main style={{ flexGrow: 1 }}>{children}</main>
    </div>
  );
};

export const Rutas = () => (
  <BrowserRouter>
    <Routes>
      {/* 🔒 Ruta protegida con token */}
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

      {/* Ruta pública */}
      <Route path="/login" element={<Login />} />

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
