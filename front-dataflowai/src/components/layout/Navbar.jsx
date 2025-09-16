// src/components/layout/Navbar.jsx
import '../../styles/Navbar.css';
import defaultLogo from '../../assets/Dataflow AI logo ajustado blanco.png';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerInfoUsuario } from '../../api/Usuario';

export function Navbar() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [companyId, setCompanyId] = useState(null);
  const [planId, setPlanId] = useState(null);
  const [companyName, setCompanyName] = useState('DataFlow AI');
  const [companySegment, setCompanySegment] = useState('');
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoFound, setLogoFound] = useState(false);

  const NO_PREFIX = [
    "/homeLogin",
    "/login",
    "/crear-empresa",
    "/crear-usuario",
    "/pagos",
    "/",
  ];

  const normalizeSegment = (nombreCorto) =>
    nombreCorto ? String(nombreCorto).trim().replace(/\s+/g, "") : "";

  const buildTo = (to) => {
    const [baseRaw, hash] = to.split("#");
    const base = baseRaw.startsWith("/") ? baseRaw : `/${baseRaw}`;

    if (NO_PREFIX.includes(base)) {
      return hash ? `${base}#${hash}` : base;
    }

    if (companySegment && base.startsWith(`/${companySegment}`)) {
      return hash ? `${base}#${hash}` : base;
    }

    const fullBase = companySegment ? `/${companySegment}${base}` : base;
    return hash ? `${fullBase}#${hash}` : fullBase;
  };

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem('token');

    if (!token) {
      setCargando(false);
      return;
    }

    async function fetchUsuario() {
      try {
        const data = await obtenerInfoUsuario();
        if (!mounted || !data) return;

        setUsuario(data);
        setCompanyId(data?.empresa?.id ?? null);
        const pid = data?.empresa?.plan?.id ?? null;
        setPlanId(pid);
        const cname = data?.empresa?.nombre ?? 'DataFlow AI';
        const nombreCorto = data?.empresa?.nombre_corto ?? '';
        setCompanySegment(normalizeSegment(nombreCorto));
        setCompanyName((pid === 3 || pid === 6) ? cname : 'DataFlow AI');
      } catch (err) {
        console.error('Error al obtener info usuario:', err);
      } finally {
        if (mounted) setCargando(false);
      }
    }

    fetchUsuario();
    return () => { mounted = false; };
  }, []);

  // Intentar cargar logo público similar a SideBar (png/jpg/jpeg/svg)
  useEffect(() => {
    if (!companyId) {
      setLogoFound(false);
      setLogoUrl(null);
      return;
    }

    let mounted = true;
    const exts = ["png", "jpg", "jpeg", "svg"];
    const publicPathPrefix = "/logos-empresas";

    const tryLoad = async () => {
      for (const ext of exts) {
        const candidate = `${publicPathPrefix}/${companyId}.${ext}`;
        const img = new Image();
        const loaded = await new Promise((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = candidate;
        });
        if (loaded && mounted) {
          setLogoUrl(candidate);
          setLogoFound(true);
          return;
        }
      }
      if (mounted) {
        setLogoFound(false);
        setLogoUrl(null);
      }
    };

    tryLoad();
    return () => { mounted = false; };
  }, [companyId]);

  if (cargando) {
    return null; // o spinner si prefieres
  }

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <a
          href={usuario ? buildTo("/homeLogin#home") : "#home"}
          className="logo"
          onClick={(e) => {
            if (usuario) {
              e.preventDefault();
              navigate(buildTo("/homeLogin#home"));
            }
            // si no hay usuario, deja el anchor para scroll en landing
          }}
        >
          <img
            src={logoFound ? logoUrl : defaultLogo}
            alt={companyName}
            className="profile-img"
          />
        </a>

        <ul className="nav-links">
          <li>
            <a
              href={usuario ? buildTo("/homeLogin#home") : "#home"}
              onClick={(e) => {
                if (usuario) { e.preventDefault(); navigate(buildTo("/homeLogin#home")); }
              }}
            >
              Home
            </a>
          </li>
          <li>
            <a
              href={usuario ? buildTo("/home#features") : "#features"}
              onClick={(e) => {
                if (usuario) { e.preventDefault(); navigate(buildTo("/home#features")); }
              }}
            >
              Features
            </a>
          </li>
          <li>
            <a
              href={usuario ? buildTo("/home#pricing") : "#pricing"}
              onClick={(e) => {
                if (usuario) { e.preventDefault(); navigate(buildTo("/home#pricing")); }
              }}
            >
              Plans
            </a>
          </li>
          <li>
            <a
              href={usuario ? buildTo("/home#business") : "#business"}
              onClick={(e) => {
                if (usuario) { e.preventDefault(); navigate(buildTo("/home#business")); }
              }}
            >
              Solution
            </a>
          </li>
          <li>
            <a
              href={usuario ? buildTo("/home#process") : "#process"}
              onClick={(e) => {
                if (usuario) { e.preventDefault(); navigate(buildTo("/home#process")); }
              }}
            >
              Process
            </a>
          </li>
          <li>
            <a
              href={usuario ? buildTo("/home#team") : "#team"}
              onClick={(e) => {
                if (usuario) { e.preventDefault(); navigate(buildTo("/home#team")); }
              }}
            >
              Team
            </a>
          </li>
          <li>
            <a
              href={usuario ? buildTo("/home#contact") : "#contact"}
              onClick={(e) => {
                if (usuario) { e.preventDefault(); navigate(buildTo("/home#contact")); }
              }}
            >
              Contact
            </a>
          </li>

          {usuario ? (
            <li className="user-menu">
              <a
                href={buildTo("/home")}
                onClick={(e) => { e.preventDefault(); navigate(buildTo("/home")); }}
                className="user-name"
              >
                HOME
              </a>
            </li>
          ) : (
            <li>
              <a href="/login">Sign In</a>
            </li>
          )}
        </ul>

        <div className="menu-toggle">
          <i className="fas fa-bars"></i>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
