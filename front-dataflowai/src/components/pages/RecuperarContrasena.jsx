import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  solicitarCodigoRecuperacion,
  confirmarRecuperacionContrasena,
} from '../../api/RecuperarContrasena';
import Logo from '../../assets/Dataflow AI logo ajustado blanco.png';
import styles from '../../styles/RecuperarContrasena.module.css';

const RecuperarContrasena = () => {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [contrasenaNueva, setContrasenaNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [step, setStep] = useState(1);
  const [intentosCodigo, setIntentosCodigo] = useState(0);
  const [loadingEnviar, setLoadingEnviar] = useState(false);
  const [loadingConfirmar, setLoadingConfirmar] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const onEnviarCodigo = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!correo.trim()) {
      setError('Ingresa un correo valido.');
      return;
    }
    try {
      setLoadingEnviar(true);
      const data = await solicitarCodigoRecuperacion({ correo: correo.trim() });
      setStep(2);
      setIntentosCodigo(0);
      setSuccess(data?.message || 'Si el correo existe, enviaremos un codigo de recuperacion.');
    } catch (err) {
      setError(err?.message || 'No se pudo enviar el codigo.');
    } finally {
      setLoadingEnviar(false);
    }
  };

  const MAX_INTENTOS_CODIGO = 2;
  const intentosRestantes = Math.max(0, MAX_INTENTOS_CODIGO - intentosCodigo);

  const onValidarCodigo = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (intentosCodigo >= MAX_INTENTOS_CODIGO) {
      setError('Has alcanzado el máximo de intentos para validar el código.');
      return;
    }

    const codigoTrim = codigo.trim();
    if (!codigoTrim) {
      setIntentosCodigo((prev) => prev + 1);
      setError(`Ingresa el código de verificación. Te quedan ${intentosRestantes - 1} intento(s).`);
      return;
    }
    if (!/^\d{6}$/.test(codigoTrim)) {
      setIntentosCodigo((prev) => prev + 1);
      setError(`El código debe tener 6 dígitos. Te quedan ${intentosRestantes - 1} intento(s).`);
      return;
    }

    setSuccess('Código verificado. Ahora crea tu nueva contraseña.');
    setStep(3);
  };

  const onCambiarContrasena = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!correo.trim() || !codigo.trim() || !contrasenaNueva || !confirmacion) {
      setError('Completa todos los campos.');
      return;
    }
    if (contrasenaNueva !== confirmacion) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      setLoadingConfirmar(true);
      const data = await confirmarRecuperacionContrasena({
        correo: correo.trim(),
        codigo: codigo.trim(),
        contrasena_nueva: contrasenaNueva,
        contrasena_nueva_confirmacion: confirmacion,
      });
      setSuccess(data?.message || 'Contraseña actualizada correctamente.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err?.message || 'No se pudo cambiar la contraseña.');
    } finally {
      setLoadingConfirmar(false);
    }
  };

  return (
    <div className="recuperar-general">
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
                />
                <p className={styles.brandingText}>Seguridad y control total de tu cuenta</p>
                <div className={styles.animatedGrid}>
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className={styles.gridCell} style={{ animationDelay: `${i * 0.05}s` }} />
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.loginSection}>
              <div className={styles.loginCard}>
                <div className={styles.loginHeader}>
                  <h2>Recuperar contraseña</h2>
                  <p className={styles.helperText}>
                    Ingresa tu correo para recibir un código de verificación por email.
                  </p>
                  {error && (
                    <div className={styles.errorMessage}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}
                  {success && (
                    <div className={styles.successMessage}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span>{success}</span>
                    </div>
                  )}
                </div>

                {step === 1 ? (
                  <form onSubmit={onEnviarCodigo} className={styles.formStack}>
                    <div className={styles.formGroup}>
                      <label htmlFor="correo">Correo electrónico</label>
                      <div className={styles.inputContainer}>
                        <input
                          id="correo"
                          type="email"
                          value={correo}
                          onChange={(e) => setCorreo(e.target.value)}
                          className={`${styles.inputField} ${correo ? styles.typing : ''}`}
                          placeholder="correo@empresa.com"
                          autoComplete="username"
                          required
                        />
                        <div className={styles.inputUnderline}></div>
                      </div>
                    </div>
                    <button type="submit" disabled={loadingEnviar} className={styles.loginButton}>
                      <span className={styles.buttonGlow} aria-hidden />
                      <span className={styles.buttonContent}>
                        {loadingEnviar ? (
                          <span className={styles.pulseEffect}>Enviando código...</span>
                        ) : (
                          <span>Enviar código</span>
                        )}
                      </span>
                    </button>
                  </form>
                ) : null}

                {step === 2 ? (
                  <form onSubmit={onValidarCodigo} className={`${styles.formStack} ${styles.formSpacer}`}>
                    <div className={styles.formGroup}>
                      <label htmlFor="codigo">Código de verificación</label>
                      <div className={styles.inputContainer}>
                        <input
                          id="codigo"
                          type="text"
                          value={codigo}
                          onChange={(e) => setCodigo(e.target.value)}
                          className={`${styles.inputField} ${codigo ? styles.typing : ''}`}
                          placeholder="Código de 6 dígitos"
                          maxLength={6}
                          required
                        />
                        <div className={styles.inputUnderline}></div>
                      </div>
                    </div>
                    <button type="submit" disabled={intentosCodigo >= MAX_INTENTOS_CODIGO} className={styles.loginButton}>
                      <span className={styles.buttonGlow} aria-hidden />
                      <span className={styles.buttonContent}>
                        <span>Validar código</span>
                      </span>
                    </button>
                  </form>
                ) : null}

                {step === 3 ? (
                  <form onSubmit={onCambiarContrasena} className={`${styles.formStack} ${styles.formSpacer}`}>
                    <div className={styles.formGroup}>
                      <label htmlFor="contrasenaNueva">Nueva contraseña</label>
                      <div className={styles.inputContainer}>
                        <input
                          id="contrasenaNueva"
                          type="password"
                          value={contrasenaNueva}
                          onChange={(e) => setContrasenaNueva(e.target.value)}
                          className={`${styles.inputField} ${contrasenaNueva ? styles.typing : ''}`}
                          placeholder="Mínimo 6 caracteres"
                          minLength={6}
                          autoComplete="new-password"
                          required
                        />
                        <div className={styles.inputUnderline}></div>
                      </div>
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="confirmacion">Confirmar contraseña</label>
                      <div className={styles.inputContainer}>
                        <input
                          id="confirmacion"
                          type="password"
                          value={confirmacion}
                          onChange={(e) => setConfirmacion(e.target.value)}
                          className={`${styles.inputField} ${confirmacion ? styles.typing : ''}`}
                          placeholder="Repite la nueva contraseña"
                          minLength={6}
                          autoComplete="new-password"
                          required
                        />
                        <div className={styles.inputUnderline}></div>
                      </div>
                    </div>
                    <button type="submit" disabled={loadingConfirmar} className={styles.loginButton}>
                      <span className={styles.buttonGlow} aria-hidden />
                      <span className={styles.buttonContent}>
                        {loadingConfirmar ? (
                          <span className={styles.pulseEffect}>Actualizando...</span>
                        ) : (
                          <span>Cambiar contraseña</span>
                        )}
                      </span>
                    </button>
                  </form>
                ) : null}

                <div className={styles.loginFooter}>
                  <p>
                    <Link to="/login">Volver al login</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecuperarContrasena;

