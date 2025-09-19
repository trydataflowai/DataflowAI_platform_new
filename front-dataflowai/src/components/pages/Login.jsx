// src/components/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { iniciarSesion } from '../../api/Login';
import { obtenerInfoUsuario } from '../../api/Usuario';
import Logo from '../../assets/Dataflow AI logo ajustado blanco.png';
import styles from '../../styles/Login.module.css';

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

const buildTo = (companySegment, to) => {
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

const Login = () => {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [shake, setShake] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [dots, setDots] = useState('');
  const [welcomeVisible, setWelcomeVisible] = useState(false);
  const [welcomeData, setWelcomeData] = useState({ nombres: '', empresa: { nombre: '' } });
  const [companySegment, setCompanySegment] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    if (cargando || error) {
      const interval = setInterval(() => {
        setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
      }, 500);
      return () => clearInterval(interval);
    } else {
      setDots('');
    }
  }, [cargando, error]);

  const safeNavigateAndReload = (to) => {
    try {
      // Si ya estamos en esa ruta, solo recargamos para forzar render.
      if (to === window.location.pathname + window.location.hash) {
        // Evitar recarga infinita: marcar en sessionStorage por un intento
        const key = 'login_reload_attempt';
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, Date.now().toString());
          window.location.reload();
        } else {
          // ya intentamos recargar; limpiamos la marca
          sessionStorage.removeItem(key);
          // Como fallback, hacemos replace para evitar bucles
          window.location.replace(to);
        }
        return;
      }

      // Si la ruta es distinta, navegamos y forzamos recarga completa
      // Esto evita estados inconsistentes en la SPA cuando la app espera
      // el prefijo de empresa ya presente en la URL.
      // Usamos assign para que haya recarga (replace podría necesitar historial control).
      window.location.assign(to);
    } catch (err) {
      // como fallback si algo falla con location, usamos navigate (SPA)
      navigate(to, { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    if (!correo || !contrasena) {
      setError('Por favor ingresa tu correo y contraseña');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setCargando(false);
      return;
    }

    try {
      // iniciarSesion presumiblemente guarda el token en localStorage
      await iniciarSesion({ correo, contrasena });

      // Después del login pedimos info del usuario (retry corto por si el token
      // aún no quedó disponible de inmediato)
      let info = null;
      try {
        const maxRetries = 4;
        let attempt = 0;
        while (attempt < maxRetries) {
          try {
            info = await obtenerInfoUsuario();
            break;
          } catch (err) {
            attempt += 1;
            await new Promise((r) => setTimeout(r, 200));
          }
        }
      } catch (errInfo) {
        console.warn('No se pudo obtener info del usuario tras login:', errInfo);
      }

      const nombres = info?.nombres || info?.first_name || '';
      const empresaNombre = info?.empresa?.nombre || info?.empresa || '';
      const nombreCortoRaw = info?.empresa?.nombre_corto ?? '';
      const normalized = normalizeSegment(nombreCortoRaw);
      setCompanySegment(normalized);
      setWelcomeData({ nombres, empresa: { nombre: empresaNombre } });
      setWelcomeVisible(true);

      // Mostrar overlay de bienvenida unos segundos y luego navegar + recargar
      setTimeout(() => {
        setWelcomeVisible(false);

        const to = buildTo(normalized, "/home");

        // Usamos la función segura que fuerza recarga controlada
        safeNavigateAndReload(to);
      }, 1200); // tiempo breve para mostrar el overlay
    } catch (err) {
      setError(err?.message || 'Credenciales incorrectas');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.loginWrapper}>
        <div className={styles.superPremiumContainer}>
          <div className={styles.brandingSection}>
            <div className={styles.brandingContent}>
              <img
                src={Logo}
                alt="Dataflow AI"
                className={styles.logoImg}
                onClick={() => navigate('/')}
                style={{ cursor: 'pointer' }}
              />
              <p className={styles.brandingText}>Inteligencia artificial para flujos de datos avanzados</p>
              <div className={styles.animatedGrid}>
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className={styles.gridCell} style={{ animationDelay: `${i * 0.05}s` }} />
                ))}
              </div>
            </div>
          </div>

          <div className={`${styles.loginSection} ${shake ? styles.shake : ''}`}>
            <div className={styles.loginCard}>
              <div className={styles.loginHeader}>
                <h2>Iniciar Sesión</h2>
                {error && (
                  <div className={styles.errorMessage}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>{error}{dots}</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label htmlFor="correo">Correo Electrónico</label>
                  <div className={styles.inputContainer}>
                    <input
                      id="correo"
                      type="email"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      className={`${styles.inputField} ${correo ? styles.typing : ''}`}
                      placeholder="tu@correo.com"
                      autoComplete="username"
                    />
                    <div className={styles.inputUnderline}></div>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="contrasena">Contraseña</label>
                  <div className={styles.inputContainer}>
                    <input
                      id="contrasena"
                      type={showPassword ? 'text' : 'password'}
                      value={contrasena}
                      onChange={(e) => setContrasena(e.target.value)}
                      className={`${styles.inputField} ${contrasena ? styles.typing : ''}`}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <div className={styles.inputUnderline}></div>
                    <button type="button" className={styles.togglePassword} onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={cargando} className={styles.loginButton}>
                  {cargando ? (
                    <span className={styles.pulseEffect}>Accediendo{dots}</span>
                  ) : (
                    <span>Iniciar Sesión</span>
                  )}
                  <span className={styles.buttonGlow} aria-hidden />
                </button>
              </form>

              <div className={styles.loginFooter}>
                <p>¿Primera vez en Dataflow? <Link to="/crear-usuario">Crea una cuenta</Link></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {welcomeVisible && (
        <div className={styles.welcomeOverlay} role="dialog" aria-live="polite">
          <div className={styles.welcomeCard}>
            <div className={styles.welcomeIcon}>
              <img src={Logo} alt="" className={styles.welcomeLogo} />
            </div>
            <h3 className={styles.welcomeTitle}> Bienvenido {welcomeData.nombres ? welcomeData.nombres : ''} </h3>
            <p className={styles.welcomeCompany}> {welcomeData.empresa?.nombre ? welcomeData.empresa.nombre : ''} </p>
            <p className={styles.welcomeMessage}> Espero que tengas una excelente experiencia en nuestra plataforma. </p>
            <div className={styles.welcomeSparkles}>
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} className={styles.confetti} style={{ left: `${10 + i * 10}%`, animationDelay: `${i * 0.08}s` }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
