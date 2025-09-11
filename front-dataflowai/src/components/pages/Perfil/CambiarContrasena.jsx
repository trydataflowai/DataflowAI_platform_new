import React, { useState } from 'react';
import styles from '../../../styles/Profile/CambiarContraDark.module.css';
import { cambiarContrasena } from '../../../api/Profile';

const AppCambiarContrasena = () => {
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

  return (
    <div className={styles.container}>
      <div className={styles.card} style={{ maxWidth: 560 }}>
        <div className={styles.header}>
          <h1 className={styles.title}>Cambiar contraseña</h1>
          <p className={styles.subtitle}>Actualiza tu contraseña para mantener tu cuenta segura.</p>
        </div>

        {error && <div className={styles.errorBox} role="alert">{error}</div>}
        {success && <div className={styles.successBox} role="status">{success}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            <span className={styles.labelText}>Contraseña actual</span>
            <div className={styles.inputRow}>
              <input
                name="actual"
                value={actual}
                onChange={(e) => setActual(e.target.value)}
                type={showActual ? 'text' : 'password'}
                className={styles.input}
                autoComplete="current-password"
                aria-label="Contraseña actual"
              />
              <button
                type="button"
                className={styles.showBtn}
                onClick={() => setShowActual(p => !p)}
                aria-label="Mostrar contraseña actual"
              >
                {showActual ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </label>

          <label className={styles.label}>
            <span className={styles.labelText}>Nueva contraseña</span>
            <div className={styles.inputRow}>
              <input
                name="nueva"
                value={nueva}
                onChange={(e) => setNueva(e.target.value)}
                type={showNueva ? 'text' : 'password'}
                className={styles.input}
                autoComplete="new-password"
                aria-label="Nueva contraseña"
              />
              <button
                type="button"
                className={styles.showBtn}
                onClick={() => setShowNueva(p => !p)}
                aria-label="Mostrar nueva contraseña"
              >
                {showNueva ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <div className={styles.strengthBar} aria-hidden>
              <div className={`${styles.strengthSegment} ${strength >= 1 ? styles.on : ''}`}></div>
              <div className={`${styles.strengthSegment} ${strength >= 2 ? styles.on : ''}`}></div>
              <div className={`${styles.strengthSegment} ${strength >= 3 ? styles.on : ''}`}></div>
              <div className={`${styles.strengthSegment} ${strength >= 4 ? styles.on : ''}`}></div>
            </div>
          </label>

          <label className={styles.label}>
            <span className={styles.labelText}>Confirmar nueva contraseña</span>
            <div className={styles.inputRow}>
              <input
                name="confirmar"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                type={showConfirmar ? 'text' : 'password'}
                className={styles.input}
                autoComplete="new-password"
                aria-label="Confirmar nueva contraseña"
              />
              <button
                type="button"
                className={styles.showBtn}
                onClick={() => setShowConfirmar(p => !p)}
                aria-label="Mostrar confirmar contraseña"
              >
                {showConfirmar ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </label>

          <div className={styles.actions}>
            <button type="submit" className={styles.primaryButton} disabled={saving}>
              {saving ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default AppCambiarContrasena;
