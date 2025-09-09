// src/components/pages/Perfil/CambiarContrasena.jsx
import React, { useState } from 'react';
import styles from '../../../styles/Profile/ModInfoPersonalLight.module.css';
import { cambiarContrasena } from '../../../api/Profile';

const AppCambiarContrasena = () => {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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
      const resp = await cambiarContrasena(actual, nueva); // CORREGIDO: llamar a la función exportada
      setSuccess(resp?.detail || 'Contraseña actualizada correctamente');
      setActual('');
      setNueva('');
      setConfirmar('');
    } catch (err) {
      setError(err.message || 'Error al cambiar la contraseña');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container} style={{ maxWidth: 520 }}>
      <h1>Cambiar contraseña</h1>

      {error && <div className={styles.errorBox}>{error}</div>}
      {success && <div className={styles.successBox}>{success}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>
          Contraseña actual
          <input
            name="actual"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            type="password"
            className={styles.input}
            autoComplete="current-password"
          />
        </label>

        <label className={styles.label}>
          Nueva contraseña
          <input
            name="nueva"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            type="password"
            className={styles.input}
            autoComplete="new-password"
          />
        </label>

        <label className={styles.label}>
          Confirmar nueva contraseña
          <input
            name="confirmar"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            type="password"
            className={styles.input}
            autoComplete="new-password"
          />
        </label>

        <button type="submit" className={styles.primaryButton} disabled={saving}>
          {saving ? 'Guardando...' : 'Cambiar contraseña'}
        </button>
      </form>
    </div>
  );
};

export default AppCambiarContrasena;
