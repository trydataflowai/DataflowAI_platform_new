import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { iniciarSesion } from '../../../api/Login';
import { obtenerInfoUsuario } from '../../../api/Usuario';
import Logo from '../../../assets/LogoColtrade.png';
import styles from '../../../styles/Login/LoginColtrade.module.css';

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

const LoginColtrade = () => {
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
  // UI extras:
  const [progress, setProgress] = useState(0); // 0 - 100
  const [eta, setEta] = useState(null); // seconds remaining estimate
  const progressRef = useRef(null);

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

  // Simula barra de progreso y ETA mientras cargando === true
  useEffect(() => {
    if (!cargando) {
      // reset
      setProgress(0);
      setEta(null);
      if (progressRef.current) {
        clearInterval(progressRef.current);
        progressRef.current = null;
      }
      return;
    }

    // Al comenzar carga: estimado aleatorio corto (2-5s) que vamos "consumiendo"
    const initialEta = Math.max(2, Math.floor(Math.random() * 4) + 2);
    setEta(initialEta);
    setProgress(6);

    if (progressRef.current) clearInterval(progressRef.current);
    progressRef.current = setInterval(() => {
      setProgress(prev => {
        // incrementa más al inicio, menos al final
        const step = Math.max(1, Math.floor(Math.random() * 6));
        const next = Math.min(95, prev + step);
        return next;
      });

      setEta(e => (e ? Math.max(0, e - 1) : 0));
    }, 700);

    return () => {
      if (progressRef.current) {
        clearInterval(progressRef.current);
        progressRef.current = null;
      }
    };
  }, [cargando]);

  // cuando se hace welcomeVisible (login ok) empujamos la barra al 100% y animamos
  useEffect(() => {
    if (welcomeVisible) {
      setProgress(100);
      setEta(0);
      if (progressRef.current) {
        clearInterval(progressRef.current);
        progressRef.current = null;
      }
    }
  }, [welcomeVisible]);

  const safeNavigateAndReload = (to) => {
    try {
      if (to === window.location.pathname + window.location.hash) {
        const key = 'login_reload_attempt';
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, Date.now().toString());
          window.location.reload();
        } else {
          sessionStorage.removeItem(key);
          window.location.replace(to);
        }
        return;
      }
      window.location.assign(to);
    } catch (err) {
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
      await iniciarSesion({ correo, contrasena });

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

      // deja que la animación se vea un poco
      setTimeout(() => {
        setWelcomeVisible(false);
        const to = buildTo(normalized, "/home");
        safeNavigateAndReload(to);
      }, 1200);
    } catch (err) {
      setError(err?.message || 'Credenciales incorrectas');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setCargando(false);
    }
  };

  // Partículas pequeñas (para login card/lado derecho)
  const particleCount = 10;
  const particles = Array.from({ length: particleCount });

  // Estrellas en el branding (lado izquierdo)
  const starCount = 18;
  const stars = Array.from({ length: starCount });

  return (
    <div className={styles.pageContainer}>
      <div className={styles.loginWrapper}>
        <div className={styles.superPremiumContainer}>
          {/* BRANDING / IZQUIERDA */}
          <div className={styles.brandingSection}>
            {/* Star field (decorativo) */}
            <div className={styles.starField} aria-hidden>
              {stars.map((_, i) => (
                <span
                  key={`star-${i}`}
                  className={styles.star}
                  style={{
                    left: `${(i * 7) % 100}%`,
                    top: `${(i * 13) % 100}%`,
                    animationDelay: `${(i % 6) * 0.25}s`,
                    transform: `scale(${0.6 + (i % 3) * 0.25})`
                  }}
                />
              ))}
              <div className={styles.shootingStar} />
              <div className={styles.shootingStar2} />
            </div>

            <div className={styles.brandingContent}>
              <img
                src={Logo}
                alt="Dataflow AI"
                className={styles.logoImg}
                onClick={() => navigate('/Coltrade/login')}
                style={{ cursor: 'pointer' }}
              />
              <p className={styles.brandingText}>Business Intelligence</p>
              <div className={styles.animatedGrid}>
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className={styles.gridCell} style={{ animationDelay: `${i * 0.05}s` }} />
                ))}
              </div>
            </div>
          </div>

          {/* LOGIN / DERECHA */}
          <div className={`${styles.loginSection} ${shake ? styles.shake : ''}`}>
            {/* partículas decorativas (subtile) */}
            <div className={styles.particlesWrapper} aria-hidden>
              {particles.map((_, i) => {
                const size = `${6 + (i % 4) * 3}px`;
                return (
                  <span
                    key={`p-${i}`}
                    className={styles.particle}
                    style={{
                      '--x': `${(i * 11) % 100}%`,
                      '--size': size,
                      '--delay': `${i * 0.18}s`,
                      '--speed': `${6 + (i % 4) * 1.8}s`,
                    }}
                  />
                );
              })}
            </div>

            <div className={styles.loginCard}>
              {/* glare / brillo sutil */}
              <div className={styles.cardGlare} aria-hidden />

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

              <form onSubmit={handleSubmit} aria-describedby={error ? 'login-error' : undefined}>
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
                      aria-label="Correo electrónico"
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
                      aria-label="Contraseña"
                    />
                    <div className={styles.inputUnderline}></div>
                    <button
                      type="button"
                      className={styles.togglePassword}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                {/* Barra de progreso y ETA (solo visual) */}
                <div className={styles.progressWrap} aria-hidden={!cargando}>
                  <div className={styles.progressInfo}>
                    <div className={styles.progressLabel}>
                      {cargando ? `Cargando ${dots}` : 'Listo'}
                    </div>
                    <div className={styles.progressETA}>
                      {cargando ? (eta !== null ? `≈ ${eta}s` : '') : ''}
                    </div>
                  </div>
                  <div className={styles.progressBarContainer} role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
                    <div className={styles.progressBar} style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <button type="submit" disabled={cargando} className={styles.loginButton} aria-busy={cargando}>
                  <span className={styles.buttonContent}>
                    {cargando ? (
                      <>
                        <span className={styles.pulseEffect}>Accediendo{dots}</span>
                        <span className={styles.smallProgress}>{progress}%</span>
                      </>
                    ) : (
                      <span>Iniciar Sesión</span>
                    )}
                  </span>
                  <span className={styles.buttonGlow} aria-hidden />
                  <span className={styles.buttonStar} aria-hidden>✦</span>
                </button>
              </form>

              <div className={styles.loginFooter}>
                
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

export default LoginColtrade;
