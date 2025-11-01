import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { iniciarSesion } from '../../../api/Login';
import { obtenerInfoUsuario } from '../../../api/Usuario';
import Logo from '../../../assets/login/logo_servitel.png';
import styles from '../../../styles/Login/LoginServitel.module.css';

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

const LoginServitel = () => {
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
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(null);
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

  useEffect(() => {
    if (!cargando) {
      setProgress(0);
      setEta(null);
      if (progressRef.current) {
        clearInterval(progressRef.current);
        progressRef.current = null;
      }
      return;
    }

    const initialEta = Math.max(2, Math.floor(Math.random() * 4) + 2);
    setEta(initialEta);
    setProgress(6);

    if (progressRef.current) clearInterval(progressRef.current);
    progressRef.current = setInterval(() => {
      setProgress(prev => {
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

  const particleCount = 10;
  const particles = Array.from({ length: particleCount });

  const starCount = 18;
  const stars = Array.from({ length: starCount });

  return (
    <div className="servitel-login">
      <div className={styles.servitelPageContainer}>
        <div className={styles.servitelLoginWrapper}>
          <div className={styles.servitelSuperContainer}>
            {/* BRANDING / IZQUIERDA */}
            <div className={styles.servitelBrandingSection}>
              {/* Star field (decorativo) */}
              <div className={styles.servitelStarField} aria-hidden>
                {stars.map((_, i) => (
                  <span
                    key={`star-${i}`}
                    className={styles.servitelStar}
                    style={{
                      left: `${(i * 7) % 100}%`,
                      top: `${(i * 13) % 100}%`,
                      animationDelay: `${(i % 6) * 0.25}s`,
                      transform: `scale(${0.6 + (i % 3) * 0.25})`
                    }}
                  />
                ))}
                <div className={styles.servitelShootingStar} />
                <div className={styles.servitelShootingStar2} />
              </div>

              <div className={styles.servitelBrandingContent}>
                <img
                  src={Logo}
                  alt="Dataflow AI"
                  className={styles.servitelLogoImg}
                  onClick={() => navigate('/Servitel/login')}
                  style={{ cursor: 'pointer' }}
                />
                <p className={styles.servitelBrandingText}>Business Intelligence</p>
                <div className={styles.servitelAnimatedGrid}>
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className={styles.servitelGridCell} style={{ animationDelay: `${i * 0.05}s` }} />
                  ))}
                </div>
              </div>
            </div>

            {/* LOGIN / DERECHA */}
            <div className={`${styles.servitelLoginSection} ${shake ? styles.servitelShake : ''}`}>
              {/* partículas decorativas (subtile) */}
              <div className={styles.servitelParticlesWrapper} aria-hidden>
                {particles.map((_, i) => {
                  const size = `${6 + (i % 4) * 3}px`;
                  return (
                    <span
                      key={`p-${i}`}
                      className={styles.servitelParticle}
                      style={{
                        '--servitel-x': `${(i * 11) % 100}%`,
                        '--servitel-size': size,
                        '--servitel-delay': `${i * 0.18}s`,
                        '--servitel-speed': `${6 + (i % 4) * 1.8}s`,
                      }}
                    />
                  );
                })}
              </div>

              <div className={styles.servitelLoginCard}>
                {/* glare / brillo sutil */}
                <div className={styles.servitelCardGlare} aria-hidden />

                <div className={styles.servitelLoginHeader}>
                  <h2>Iniciar Sesión</h2>
                  {error && (
                    <div className={styles.servitelErrorMessage}>
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
                  <div className={styles.servitelFormGroup}>
                    <label htmlFor="correo">Correo Electrónico</label>
                    <div className={styles.servitelInputContainer}>
                      <input
                        id="correo"
                        type="email"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        className={`${styles.servitelInputField} ${correo ? styles.servitelTyping : ''}`}
                        placeholder="tu@correo.com"
                        autoComplete="username"
                        aria-label="Correo electrónico"
                      />
                      <div className={styles.servitelInputUnderline}></div>
                    </div>
                  </div>

                  <div className={styles.servitelFormGroup}>
                    <label htmlFor="contrasena">Contraseña</label>
                    <div className={styles.servitelInputContainer}>
                      <input
                        id="contrasena"
                        type={showPassword ? 'text' : 'password'}
                        value={contrasena}
                        onChange={(e) => setContrasena(e.target.value)}
                        className={`${styles.servitelInputField} ${contrasena ? styles.servitelTyping : ''}`}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        aria-label="Contraseña"
                      />
                      <div className={styles.servitelInputUnderline}></div>
                      <button
                        type="button"
                        className={styles.servitelTogglePassword}
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>

                  {/* Barra de progreso y ETA (solo visual) */}
                  <div className={styles.servitelProgressWrap} aria-hidden={!cargando}>
                    <div className={styles.servitelProgressInfo}>
                      <div className={styles.servitelProgressLabel}>
                        {cargando ? `Cargando ${dots}` : 'Listo'}
                      </div>
                      <div className={styles.servitelProgressETA}>
                        {cargando ? (eta !== null ? `≈ ${eta}s` : '') : ''}
                      </div>
                    </div>
                    <div className={styles.servitelProgressBarContainer} role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
                      <div className={styles.servitelProgressBar} style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <button type="submit" disabled={cargando} className={styles.servitelLoginButton} aria-busy={cargando}>
                    <span className={styles.servitelButtonContent}>
                      {cargando ? (
                        <>
                          <span className={styles.servitelPulseEffect}>Accediendo{dots}</span>
                          <span className={styles.servitelSmallProgress}>{progress}%</span>
                        </>
                      ) : (
                        <span>Iniciar Sesión</span>
                      )}
                    </span>
                    <span className={styles.servitelButtonGlow} aria-hidden />
                    <span className={styles.servitelButtonStar} aria-hidden>✦</span>
                  </button>
                </form>

                <div className={styles.servitelLoginFooter}>
                  
                </div>
              </div>
            </div>
          </div>
        </div>

        {welcomeVisible && (
          <div className={styles.servitelWelcomeOverlay} role="dialog" aria-live="polite">
            <div className={styles.servitelWelcomeCard}>
              <div className={styles.servitelWelcomeIcon}>
                <img src={Logo} alt="" className={styles.servitelWelcomeLogo} />
              </div>
              <h3 className={styles.servitelWelcomeTitle}> Bienvenido {welcomeData.nombres ? welcomeData.nombres : ''} </h3>
              <p className={styles.servitelWelcomeCompany}> {welcomeData.empresa?.nombre ? welcomeData.empresa.nombre : ''} </p>
              <p className={styles.servitelWelcomeMessage}> Espero que tengas una excelente experiencia en nuestra plataforma. </p>
              <div className={styles.servitelWelcomeSparkles}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <span key={i} className={styles.servitelConfetti} style={{ left: `${10 + i * 10}%`, animationDelay: `${i * 0.08}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginServitel;