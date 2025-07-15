import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { iniciarSesion } from '../../api/Login';
import Logo from '../../assets/Dataflow AI logo ajustado blanco.png';
import styles from '../../styles/Login.module.css';

const Login = () => {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [shake, setShake] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [dots, setDots] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    if (cargando || error) {
      const interval = setInterval(() => {
        setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [cargando, error]);

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
      const data = await iniciarSesion({ correo, contrasena });
      
      // Redirigir después de un pequeño delay para mejor UX
      setTimeout(() => {
        navigate('/home');
      }, 1000);
      
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas');
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
          {/* Sección izquierda */}
          <div className={styles.brandingSection}>
            <div className={styles.brandingContent}>
              <img
                src={Logo}
                alt="Dataflow AI"
                className={styles.logoImg}
                onClick={() => navigate('/')}
              />
              <p className={styles.brandingText}>Inteligencia artificial para flujos de datos avanzados</p>
              <div className={styles.animatedGrid}>
                {Array.from({ length: 16 }).map((_, i) => (
                  <div
                    key={i}
                    className={styles.gridCell}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sección derecha */}
          <div className={`${styles.loginSection} ${shake ? styles.shake : ''}`}>
            <div className={styles.loginCard}>
              <div className={styles.loginHeader}>
                <h2>Iniciar Sesión</h2>
                {error && (
                  <div className={styles.errorMessage}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
                  <label>Correo Electrónico</label>
                  <div className={styles.inputContainer}>
                    <input
                      type="email"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      className={styles.inputField}
                      placeholder="tu@correo.com"
                    />
                    <div className={styles.inputUnderline}></div>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Contraseña</label>
                  <div className={styles.inputContainer}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={contrasena}
                      onChange={(e) => setContrasena(e.target.value)}
                      className={styles.inputField}
                      placeholder="••••••••"
                    />
                    <div className={styles.inputUnderline}></div>
                    <button
                      type="button"
                      className={styles.togglePassword}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={cargando}
                  className={styles.loginButton}
                >
                  {cargando ? (
                    <span className={styles.pulseEffect}>Accediendo{dots}</span>
                  ) : (
                    <span>Iniciar Sesión</span>
                  )}
                  <span className={styles.buttonGlow}></span>
                </button>
              </form>

              <div className={styles.loginFooter}>
                <p>¿Primera vez en Dataflow? <a href="/register">Crea una cuenta</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;