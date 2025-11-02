// src/components/.../AppCambiarContrasena.jsx
import React, { useState } from 'react';
import styles from '../../../styles/Profile/CambiarContrasena.module.css';
import { cambiarContrasena } from '../../../api/Profile';
import { useTheme } from '../../componentes/ThemeContext'; // ajusta la ruta si hace falta

const AppCambiarContrasena = () => {
  const { theme } = useTheme();
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
    }
  };

  // variante (aplica clase raíz con variables)
  const variantClass = theme === 'light' ? styles.CambiarcontrasenaLight : styles.CambiarcontrasenaDark;

  return (
    <div className={`${styles.cambiarcontrasenacontainer} ${variantClass}`}>
      <div className={styles.cambiarcontrasenacard} style={{ maxWidth: 560 }}>
        <div className={styles.cambiarcontrasenaheader}>
          <h1 className={styles.cambiarcontrasenatitle}>Cambiar contraseña</h1>
          <p className={styles.cambiarcontrasenasubtitle}>Actualiza tu contraseña para mantener tu cuenta segura.</p>
        </div>

        {error && <div className={styles.cambiarcontrasenaerrorBox} role="alert">{error}</div>}
        {success && <div className={styles.cambiarcontrasenasuccessBox} role="status">{success}</div>}

        <form onSubmit={handleSubmit} className={styles.cambiarcontrasenaform}>
          <label className={styles.cambiarcontrasenalabel}>
            <span className={styles.cambiarcontrasenalabelText}>Contraseña actual</span>
            <div className={styles.cambiarcontrasenainputRow}>
              <input
                name="actual"
                value={actual}
                onChange={(e) => setActual(e.target.value)}
                type={showActual ? 'text' : 'password'}
                className={styles.cambiarcontrasenainput}
                autoComplete="current-password"
                aria-label="Contraseña actual"
              />
              <button
                type="button"
                className={styles.cambiarcontrasenashowBtn}
                onClick={() => setShowActual(p => !p)}
                aria-label="Mostrar contraseña actual"
              >
                {showActual ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </label>

          <label className={styles.cambiarcontrasenalabel}>
            <span className={styles.cambiarcontrasenalabelText}>Nueva contraseña</span>
            <div className={styles.cambiarcontrasenainputRow}>
              <input
                name="nueva"
                value={nueva}
                onChange={(e) => setNueva(e.target.value)}
                type={showNueva ? 'text' : 'password'}
                className={styles.cambiarcontrasenainput}
                autoComplete="new-password"
                aria-label="Nueva contraseña"
              />
              <button
                type="button"
                className={styles.cambiarcontrasenashowBtn}
                onClick={() => setShowNueva(p => !p)}
                aria-label="Mostrar nueva contraseña"
              >
                {showNueva ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <div className={styles.cambiarcontrasenastrengthBar} aria-hidden>
              <div className={`${styles.cambiarcontrasenastrengthSegment} ${strength >= 1 ? styles.cambiarcontrasenaon : ''}`}></div>
              <div className={`${styles.cambiarcontrasenastrengthSegment} ${strength >= 2 ? styles.cambiarcontrasenaon : ''}`}></div>
              <div className={`${styles.cambiarcontrasenastrengthSegment} ${strength >= 3 ? styles.cambiarcontrasenaon : ''}`}></div>
              <div className={`${styles.cambiarcontrasenastrengthSegment} ${strength >= 4 ? styles.cambiarcontrasenaon : ''}`}></div>
            </div>
          </label>

          <label className={styles.cambiarcontrasenalabel}>
            <span className={styles.cambiarcontrasenalabelText}>Confirmar nueva contraseña</span>
            <div className={styles.cambiarcontrasenainputRow}>
              <input
                name="confirmar"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                type={showConfirmar ? 'text' : 'password'}
                className={styles.cambiarcontrasenainput}
                autoComplete="new-password"
                aria-label="Confirmar nueva contraseña"
              />
              <button
                type="button"
                className={styles.cambiarcontrasenashowBtn}
                onClick={() => setShowConfirmar(p => !p)}
                aria-label="Mostrar confirmar contraseña"
              >
                {showConfirmar ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </label>

          <div className={styles.cambiarcontrasenaactions}>
            <button type="submit" className={styles.cambiarcontrasenaprimaryButton} disabled={saving}>
              {saving ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default AppCambiarContrasena;
