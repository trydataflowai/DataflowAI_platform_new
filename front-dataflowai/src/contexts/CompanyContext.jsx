// src/contexts/CompanyContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { obtenerInfoUsuario } from "../api/Usuario";

/**
 * CompanyContext:
 * - usuario: objeto completo tal cual viene de la API
 * - companySegment: nombre_corto normalizado (ej: "Coltrade")
 * - loading: indica si estamos cargando la info
 * - setUsuario / refreshUsuario: utilidades para actualizar el contexto
 */
const CompanyContext = createContext();

export const useCompany = () => useContext(CompanyContext);

const normalizeSegment = (nombreCorto) =>
  nombreCorto ? String(nombreCorto).trim().replace(/\s+/g, "") : "";

export const CompanyProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [companySegment, setCompanySegment] = useState("");
  const [loading, setLoading] = useState(true);

  // Cargar info al montar, si existe token
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await obtenerInfoUsuario();
        if (!mounted) return;
        setUsuario(data || null);
        const nombreCorto = data?.empresa?.nombre_corto ?? "";
        setCompanySegment(normalizeSegment(nombreCorto));
      } catch (err) {
        // no token o error -> usuario null y segmento vacío
        if (!mounted) return;
        setUsuario(null);
        setCompanySegment("");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  // permite forzar una recarga (útil tras login/refresh)
  const refreshUsuario = async () => {
    setLoading(true);
    try {
      const data = await obtenerInfoUsuario();
      setUsuario(data || null);
      const nombreCorto = data?.empresa?.nombre_corto ?? "";
      setCompanySegment(normalizeSegment(nombreCorto));
    } catch (err) {
      setUsuario(null);
      setCompanySegment("");
    } finally {
      setLoading(false);
    }
  };

  const value = {
    usuario,
    setUsuario, // atención: si llamás setUsuario directamente, también actualizá companySegment si procede
    companySegment,
    loading,
    refreshUsuario,
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};
