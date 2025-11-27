// src/components/.../AppCambiarContrasena.jsx
import React, { useState } from 'react';
import { cambiarContrasena } from '../../../api/Profile';
import { useTheme } from '../../componentes/ThemeContext';
import { useCompanyStyles } from '../../componentes/ThemeContextEmpresa';

// Importar estilos por defecto (fallback)
import defaultStyles from '../../../styles/Profile/CambiarContrasena.module.css';

const AppCambiarContrasena = () => {
  const { theme } = useTheme();
  // Obtener estilos (empresa o default) desde el provider — evita parpadeo
  const styles = useCompanyStyles('CambiarContrasena', defaultStyles);

  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  const passwordStrength = (pwd) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    return score; // 0..4
  };

  const strength = passwordStrength(nueva);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!actual || !nueva || !confirmar) {
      setError('Completa todos los campos.');
      return;
    }
    if (nueva !== confirmar) {
      setError('La nueva contraseña y la confirmación no coinciden.');
      return;
    }

    setSaving(true);
    try {
      const resp = await cambiarContrasena(actual, nueva);
      setSuccess(resp?.detail || 'Contraseña actualizada correctamente');
      setActual('');
      setNueva('');
      setConfirmar('');
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || err?.detail || 'Error al cambiar la contraseña';
      setError(msg);
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  // Variante basada únicamente en ThemeContext (evita fallback oscuro)
  const variantClass = theme === 'dark'
    ? (styles?.CambiarcontrasenaDark || defaultStyles.CambiarcontrasenaDark || '')
    : (styles?.CambiarcontrasenaLight || defaultStyles.CambiarcontrasenaLight || '');

  const containerClass = styles?.Cambiarcontrasenacontainer || defaultStyles.Cambiarcontrasenacontainer || '';

  return (
    <main className={`${containerClass} ${variantClass}`} aria-labelledby="cambiar-contrasena-title">
      
      {/* Header Section */}
      <section className={styles?.Cambiarcontrasenaheader || defaultStyles.Cambiarcontrasenaheader}>
        <div className={styles?.CambiarcontrasenaheaderContent || defaultStyles.CambiarcontrasenaheaderContent}>
          <h1 id="cambiar-contrasena-title" className={styles?.Cambiarcontrasenatitle || defaultStyles.Cambiarcontrasenatitle}>
            Cambiar Contraseña
          </h1>
          <p className={styles?.Cambiarcontrasenasubtitle || defaultStyles.Cambiarcontrasenasubtitle}>
            Actualiza tu contraseña para mantener tu cuenta segura
          </p>
        </div>
        <div className={styles?.CambiarcontrasenaheaderMeta || defaultStyles.CambiarcontrasenaheaderMeta}>
          <span className={styles?.CambiarcontrasenasecurityInfo || defaultStyles.CambiarcontrasenasecurityInfo}>Seguridad</span>
        </div>
      </section>

      {/* Form Section */}
      <section className={styles?.CambiarcontrasenaformSection || defaultStyles.CambiarcontrasenaformSection} aria-label="Formulario de cambio de contraseña">
        <div className={styles?.Cambiarcontrasenacard || defaultStyles.Cambiarcontrasenacard}>
          
          {error && (
            <div className={styles?.CambiarcontrasenaerrorBox || defaultStyles.CambiarcontrasenaerrorBox} role="alert">
              <div className={styles?.CambiarcontrasenaerrorIcon || defaultStyles.CambiarcontrasenaerrorIcon}>⚠️</div>
              <div className={styles?.CambiarcontrasenaerrorText || defaultStyles.CambiarcontrasenaerrorText}>{error}</div>
            </div>
          )}
          
          {success && (
            <div className={styles?.CambiarcontrasenasuccessBox || defaultStyles.CambiarcontrasenasuccessBox} role="status">
              <div className={styles?.CambiarcontrasenasuccessIcon || defaultStyles.CambiarcontrasenasuccessIcon}>✅</div>
              <div className={styles?.CambiarcontrasenasuccessText || defaultStyles.CambiarcontrasenasuccessText}>{success}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles?.Cambiarcontrasenaform || defaultStyles.Cambiarcontrasenaform}>
            
            {/* Contraseña Actual */}
            <div className={styles?.CambiarcontrasenaformGroup || defaultStyles.CambiarcontrasenaformGroup}>
              <label className={styles?.Cambiarcontrasenalabel || defaultStyles.Cambiarcontrasenalabel}>
                <span className={styles?.CambiarcontrasenalabelText || defaultStyles.CambiarcontrasenalabelText}>Contraseña Actual</span>
                <div className={styles?.CambiarcontrasenainputContainer || defaultStyles.CambiarcontrasenainputContainer}>
                  <input
                    name="actual"
                    value={actual}
                    onChange={(e) => setActual(e.target.value)}
                    type={showActual ? 'text' : 'password'}
                    className={styles?.Cambiarcontrasenainput || defaultStyles.Cambiarcontrasenainput}
                    autoComplete="current-password"
                    aria-label="Contraseña actual"
                    placeholder="Ingresa tu contraseña actual"
                  />
                  <button
                    type="button"
                    className={styles?.CambiarcontrasenashowBtn || defaultStyles.CambiarcontrasenashowBtn}
                    onClick={() => setShowActual(p => !p)}
                    aria-label={showActual ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showActual ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </label>
            </div>

            {/* Nueva Contraseña */}
            <div className={styles?.CambiarcontrasenaformGroup || defaultStyles.CambiarcontrasenaformGroup}>
              <label className={styles?.Cambiarcontrasenalabel || defaultStyles.Cambiarcontrasenalabel}>
                <span className={styles?.CambiarcontrasenalabelText || defaultStyles.CambiarcontrasenalabelText}>Nueva Contraseña</span>
                <div className={styles?.CambiarcontrasenainputContainer || defaultStyles.CambiarcontrasenainputContainer}>
                  <input
                    name="nueva"
                    value={nueva}
                    onChange={(e) => setNueva(e.target.value)}
                    type={showNueva ? 'text' : 'password'}
                    className={styles?.Cambiarcontrasenainput || defaultStyles.Cambiarcontrasenainput}
                    autoComplete="new-password"
                    aria-label="Nueva contraseña"
                    placeholder="Crea una nueva contraseña"
                  />
                  <button
                    type="button"
                    className={styles?.CambiarcontrasenashowBtn || defaultStyles.CambiarcontrasenashowBtn}
                    onClick={() => setShowNueva(p => !p)}
                    aria-label={showNueva ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showNueva ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                
                {/* Strength Indicator */}
                {nueva && (
                  <div className={styles?.CambiarcontrasenastrengthIndicator || defaultStyles.CambiarcontrasenastrengthIndicator}>
                    <div className={styles?.CambiarcontrasenastrengthBar || defaultStyles.CambiarcontrasenastrengthBar}>
                      <div 
                        className={`${styles?.CambiarcontrasenastrengthSegment || defaultStyles.CambiarcontrasenastrengthSegment} ${strength >= 1 ? (styles?.Cambiarcontrasenaon || defaultStyles.Cambiarcontrasenaon) : ''}`}
                      ></div>
                      <div 
                        className={`${styles?.CambiarcontrasenastrengthSegment || defaultStyles.CambiarcontrasenastrengthSegment} ${strength >= 2 ? (styles?.Cambiarcontrasenaon || defaultStyles.Cambiarcontrasenaon) : ''}`}
                      ></div>
                      <div 
                        className={`${styles?.CambiarcontrasenastrengthSegment || defaultStyles.CambiarcontrasenastrengthSegment} ${strength >= 3 ? (styles?.Cambiarcontrasenaon || defaultStyles.Cambiarcontrasenaon) : ''}`}
                      ></div>
                      <div 
                        className={`${styles?.CambiarcontrasenastrengthSegment || defaultStyles.CambiarcontrasenastrengthSegment} ${strength >= 4 ? (styles?.Cambiarcontrasenaon || defaultStyles.Cambiarcontrasenaon) : ''}`}
                      ></div>
                    </div>
                    <span className={styles?.CambiarcontrasenastrengthText || defaultStyles.CambiarcontrasenastrengthText}>
                      {strength === 0 && 'Muy débil'}
                      {strength === 1 && 'Débil'}
                      {strength === 2 && 'Regular'}
                      {strength === 3 && 'Fuerte'}
                      {strength === 4 && 'Muy fuerte'}
                    </span>
                  </div>
                )}
              </label>
            </div>

            {/* Confirmar Contraseña */}
            <div className={styles?.CambiarcontrasenaformGroup || defaultStyles.CambiarcontrasenaformGroup}>
              <label className={styles?.Cambiarcontrasenalabel || defaultStyles.Cambiarcontrasenalabel}>
                <span className={styles?.CambiarcontrasenalabelText || defaultStyles.CambiarcontrasenalabelText}>Confirmar Nueva Contraseña</span>
                <div className={styles?.CambiarcontrasenainputContainer || defaultStyles.CambiarcontrasenainputContainer}>
                  <input
                    name="confirmar"
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    type={showConfirmar ? 'text' : 'password'}
                    className={styles?.Cambiarcontrasenainput || defaultStyles.Cambiarcontrasenainput}
                    autoComplete="new-password"
                    aria-label="Confirmar nueva contraseña"
                    placeholder="Confirma tu nueva contraseña"
                  />
                  <button
                    type="button"
                    className={styles?.CambiarcontrasenashowBtn || defaultStyles.CambiarcontrasenashowBtn}
                    onClick={() => setShowConfirmar(p => !p)}
                    aria-label={showConfirmar ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showConfirmar ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </label>
            </div>

            {/* Submit Button */}
            <div className={styles?.Cambiarcontrasenaactions || defaultStyles.Cambiarcontrasenaactions}>
              <button 
                type="submit" 
                className={styles?.CambiarcontrasenaprimaryButton || defaultStyles.CambiarcontrasenaprimaryButton} 
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className={styles?.Cambiarcontrasenaspinner || defaultStyles.Cambiarcontrasenaspinner}></span>
                    Guardando...
                  </>
                ) : (
                  'Cambiar Contraseña'
                )}
              </button>
            </div>
          </form>

        </div>
      </section>
    </main>
  );
};

export default AppCambiarContrasena;
