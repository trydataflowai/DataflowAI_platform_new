// src/components/componentes/ThemeContextEmpresa.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { obtenerInfoUsuario } from '../../api/Usuario';

// Defaults (fallbacks) — importa aquí los CSS por defecto que ya tienes
import defaultPerfil from '../../styles/Profile/Perfil.module.css';
import defaultModInfo from '../../styles/Profile/ModInfoPersonal.module.css';
import defaultCambiarContrasena from '../../styles/Profile/CambiarContrasena.module.css';
import defaultActivarDesactivar from '../../styles/Profile/ActivarDesactivar.module.css';
import defaultAsignarDashboard from '../../styles/Profile/AsignarDashboard.module.css';
import defaultFormBuilder from '../../styles/FormBuilder.module.css';
import defaultMarketplace from '../../styles/Marketplace.module.css';
import defaultChxtbut from '../../styles/Chxtbut.module.css';
import defaultSoporteUsuario from '../../styles/SoporteUsuario.module.css';

// Módulos conocidos que intentaremos pre-cargar (clave => archivo + default)
const MODULES = {
  Perfil: { file: 'Perfil.module.css', defaultStyles: defaultPerfil },
  ModInfoPersonal: { file: 'ModInfoPersonal.module.css', defaultStyles: defaultModInfo },
  CambiarContrasena: { file: 'CambiarContrasena.module.css', defaultStyles: defaultCambiarContrasena },
  ActivarDesactivar: { file: 'ActivarDesactivar.module.css', defaultStyles: defaultActivarDesactivar },
  AsignarDashboard: { file: 'AsignarDashboard.module.css', defaultStyles: defaultAsignarDashboard },
  FormBuilder: { file: 'FormBuilder.module.css', defaultStyles: defaultFormBuilder },
  Marketplace: { file: 'Marketplace.module.css', defaultStyles: defaultMarketplace },
  Chxtbut: { file: 'Chxtbut.module.css', defaultStyles: defaultChxtbut },
  SoporteUsuario: { file: 'SoporteUsuario.module.css', defaultStyles: defaultSoporteUsuario },

  // agregue más módulos aquí si los necesita
};

const CompanyStylesContext = createContext({
  ready: false,
  companyId: null,
  planId: null,
  stylesMap: {},
});

/**
 * CompanyStylesProvider
 *
 * - Intenta cargar CSS de empresa (src/styles/empresas/<companyId>/<file>) si plan === 3 || 6.
 * - Pre-carga los módulos listados en MODULES para minimizar parpadeos.
 * - No renderiza children hasta haber resuelto (ready === true).
 */
export const CompanyStylesProvider = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const [planId, setPlanId] = useState(null);
  const [stylesMap, setStylesMap] = useState(
    // iniciar con defaults para que el hook useCompanyStyles pueda devolver algo inmediato si es usado fuera del provider
    Object.fromEntries(Object.entries(MODULES).map(([k, v]) => [k, v.defaultStyles]))
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const info = await obtenerInfoUsuario().catch(() => null);
        if (!mounted) return;

        const cid = info?.empresa?.id ?? null;
        const pid = info?.empresa?.plan?.id ?? null;
        setCompanyId(cid);
        setPlanId(pid);

        const useCustom = cid && (pid === 3 || pid === 6);

        // helper: intenta importar ruta de empresa, si falla importa default
        const importFor = async (filename, defaultStyles) => {
          if (useCustom && cid) {
            const remotePath = `../../styles/empresas/${cid}/${filename}`;
            try {
              // @vite-ignore evita que vite intente resolver en build tiempo la string dinámica
              const mod = await import(/* @vite-ignore */ remotePath);
              return (mod && (mod.default || mod)) || defaultStyles;
            } catch (err) {
              // fallback al default
            }
          }

          try {
            const modDefault = await import(`../../styles/${filename}`);
            return (modDefault && (modDefault.default || modDefault)) || defaultStyles;
          } catch (err) {
            // si falla el default (raro), devolvemos el objeto defaultStyles pasado
            return defaultStyles;
          }
        };

        // construir lista de promesas
        const promises = Object.entries(MODULES).map(async ([key, { file, defaultStyles }]) => {
          const mod = await importFor(file, defaultStyles);
          return [key, mod || defaultStyles];
        });

        const results = await Promise.all(promises);
        if (!mounted) return;

        const nextMap = Object.fromEntries(results);
        setStylesMap((prev) => ({ ...prev, ...nextMap }));
      } catch (err) {
        // en cualquier error, nos quedamos con los defaults (ya inicializados)
        console.error("CompanyStylesProvider error:", err);
      } finally {
        if (mounted) setReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // no renderizamos contenido hasta estar "ready" — esto evita que los componentes se pinten con defaults
  if (!ready) return null;

  return (
    <CompanyStylesContext.Provider value={{ ready, companyId, planId, stylesMap }}>
      {children}
    </CompanyStylesContext.Provider>
  );
};

/**
 * useCompanyStyles(key, fallback?)
 * - key: la clave definida en MODULES (ej. 'Chxtbut', 'Perfil', ...)
 * - fallback: opcional, si quiere forzar otro fallback
 */
export const useCompanyStyles = (key, fallback = null) => {
  const ctx = useContext(CompanyStylesContext);
  if (!ctx) {
    // si no hay provider, devolver el fallback o el default del MODULES
    return fallback || (MODULES[key] && MODULES[key].defaultStyles) || {};
  }
  return ctx.stylesMap[key] || fallback || (MODULES[key] && MODULES[key].defaultStyles) || {};
};

/**
 * useCompanyContext: exporta todo el contexto si necesitas companyId/planId directamente
 */
export const useCompanyContext = () => {
  const ctx = useContext(CompanyStylesContext);
  if (!ctx) throw new Error("useCompanyContext debe usarse dentro de CompanyStylesProvider");
  return ctx;
};
