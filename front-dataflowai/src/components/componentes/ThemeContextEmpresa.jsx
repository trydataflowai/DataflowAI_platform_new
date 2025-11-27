// src/components/componentes/ThemeContextEmpresa.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { obtenerInfoUsuario } from '../../api/Usuario';

// Defaults (fallbacks)
import defaultPerfil from '../../styles/Profile/Perfil.module.css';
import defaultModInfo from '../../styles/Profile/ModInfoPersonal.module.css';
import defaultCambiarContrasena from '../../styles/Profile/CambiarContrasena.module.css';
import defaultActivarDesactivar from '../../styles/Profile/ActivarDesactivar.module.css';
import defaultAsignarDashboard from '../../styles/Profile/AsignarDashboard.module.css';
import defaultFormBuilder from '../../styles/FormBuilder.module.css';
import defaultFormPublic from '../../styles/FormPublic.module.css';
import defaultMarketplace from '../../styles/Marketplace.module.css';
import defaultChxtbut from '../../styles/Chxtbut.module.css';
import defaultSoporteUsuario from '../../styles/SoporteUsuario.module.css';
import defaultConfiguracionesDashboard from '../../styles/ConfiguracionesDashboard.module.css';
import defaultToolsHome from '../../styles/ToolsHome.module.css';


const MODULES = {
  Perfil: { file: 'Perfil.module.css', defaultStyles: defaultPerfil },
  ModInfoPersonal: { file: 'ModInfoPersonal.module.css', defaultStyles: defaultModInfo },
  CambiarContrasena: { file: 'CambiarContrasena.module.css', defaultStyles: defaultCambiarContrasena },
  ActivarDesactivar: { file: 'ActivarDesactivar.module.css', defaultStyles: defaultActivarDesactivar },
  AsignarDashboard: { file: 'AsignarDashboard.module.css', defaultStyles: defaultAsignarDashboard },
  FormBuilder: { file: 'FormBuilder.module.css', defaultStyles: defaultFormBuilder },
  FormPublic: { file: 'FormPublic.module.css', defaultStyles: defaultFormPublic },
  Marketplace: { file: 'Marketplace.module.css', defaultStyles: defaultMarketplace },
  Chxtbut: { file: 'Chxtbut.module.css', defaultStyles: defaultChxtbut },
  SoporteUsuario: { file: 'SoporteUsuario.module.css', defaultStyles: defaultSoporteUsuario },
  ConfiguracionesDashboard: { file: 'ConfiguracionesDashboard.module.css', defaultStyles: defaultConfiguracionesDashboard },
  ToolsHome: { file: 'ToolsHome.module.css', defaultStyles: defaultToolsHome },
};

const CompanyStylesContext = createContext({
  ready: false,
  companyId: null,
  planId: null,
  stylesMap: {},
});

// ====== PRELOAD ALL company CSS MODULES (build-safe) ======
// Nota: la ruta del glob debe ser relativa a este archivo.
// Incluye todos los módulos bajo src/styles/empresas/<id>/*.module.css
const ALL_COMPANY_MODULES = import.meta.glob('../../styles/empresas/*/*.module.css', { eager: true });
// ALL_COMPANY_MODULES: { './..../empresas/2/Perfil.module.css': Module, ... }

export const CompanyStylesProvider = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const [planId, setPlanId] = useState(null);

  const [stylesMap, setStylesMap] = useState(
    Object.fromEntries(Object.entries(MODULES).map(([k, v]) => [k, v.defaultStyles]))
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // Obtén info de usuario (si falla, seguimos con defaults)
        const info = await obtenerInfoUsuario().catch(() => null);
        if (!mounted) return;

        const cid = info?.empresa?.id ?? null;
        const pid = info?.empresa?.plan?.id ?? null;
        setCompanyId(cid);
        setPlanId(pid);

        // Construir map inicial con defaults
        const nextMap = Object.fromEntries(Object.entries(MODULES).map(([k, v]) => [k, v.defaultStyles]));

        // Si aplica estilos por empresa (planes 3 o 6) -> intentar sobreescribir con archivos pre-cargados
        const useCustom = cid && (pid === 3 || pid === 6);
        if (useCustom) {
          // Por cada módulo buscado, intentar encontrar el fichero cargado por import.meta.glob
          for (const [key, { file, defaultStyles }] of Object.entries(MODULES)) {
            // buscamos la ruta que contiene "/empresas/<cid>/" y termina con `file`
            const matchKey = Object.keys(ALL_COMPANY_MODULES).find(p =>
              p.includes(`/empresas/${cid}/`) && p.endsWith(`/${file}`)
            );
            if (matchKey) {
              const mod = ALL_COMPANY_MODULES[matchKey];
              nextMap[key] = (mod && (mod.default || mod)) || defaultStyles;
            } else {
              // no hay CSS por empresa para este módulo -> mantenemos default
              nextMap[key] = defaultStyles;
            }
          }
        }

        if (!mounted) return;
        setStylesMap(nextMap);
      } catch (err) {
        console.error('CompanyStylesProvider error:', err);
        // en error, stylesMap ya tiene defaults iniciales
      } finally {
        if (mounted) setReady(true);
      }
    })();

    return () => { mounted = false; };
  }, []);

  if (!ready) return null; // bloquea render hasta que sepamos qué estilos usar (evita parpadeo)

  return (
    <CompanyStylesContext.Provider value={{ ready, companyId, planId, stylesMap }}>
      {children}
    </CompanyStylesContext.Provider>
  );
};

export const useCompanyStyles = (key, fallback = null) => {
  const ctx = useContext(CompanyStylesContext);
  if (!ctx) {
    return fallback || (MODULES[key] && MODULES[key].defaultStyles) || {};
  }
  return ctx.stylesMap[key] || fallback || (MODULES[key] && MODULES[key].defaultStyles) || {};
};

export const useCompanyContext = () => {
  const ctx = useContext(CompanyStylesContext);
  if (!ctx) throw new Error('useCompanyContext debe usarse dentro de CompanyStylesProvider');
  return ctx;
};
