import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  solicitarCodigoRecuperacion,
  confirmarRecuperacionContrasena,
} from '../../api/RecuperarContrasena';
import styles from '../../styles/CreacionUsuario.module.css';

const RecuperarContrasena = () => {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [contrasenaNueva, setContrasenaNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [codigoEnviado, setCodigoEnviado] = useState(false);
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
      setCodigoEnviado(true);
      setSuccess(data?.message || 'Si el correo existe, enviaremos un codigo de recuperacion.');
    } catch (err) {
      setError(err?.message || 'No se pudo enviar el codigo.');
    } finally {
      setLoadingEnviar(false);
    }
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
      setSuccess(data?.message || 'Contrasena actualizada correctamente.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err?.message || 'No se pudo cambiar la contraseña.');
    } finally {
      setLoadingConfirmar(false);
    }
  };

  return (
    <div className={styles.container} style={{ maxWidth: '640px', margin: '2rem auto' }}>
      <h1>Recuperar contraseña</h1>
      <p>Ingresa tu correo para recibir un codigo de verificacion por email.</p>

      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
      {success ? <p style={{ color: '#0a7f35' }}>{success}</p> : null}

      <form onSubmit={onEnviarCodigo} style={{ display: 'grid', gap: '0.6rem', marginBottom: '1rem' }}>
        <input
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          placeholder="correo@empresa.com"
          required
        />
        <button type="submit" disabled={loadingEnviar}>
          {loadingEnviar ? 'Enviando codigo...' : 'Enviar codigo'}
        </button>
      </form>

      {codigoEnviado ? (
        <form onSubmit={onCambiarContrasena} style={{ display: 'grid', gap: '0.6rem' }}>
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Codigo de 6 digitos"
            maxLength={6}
            required
          />
          <input
            type="password"
            value={contrasenaNueva}
            onChange={(e) => setContrasenaNueva(e.target.value)}
            placeholder="Nueva contraseña"
            minLength={6}
            required
          />
          <input
            type="password"
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
            placeholder="Confirmar nueva contraseña"
            minLength={6}
            required
          />
          <button type="submit" disabled={loadingConfirmar}>
            {loadingConfirmar ? 'Actualizando...' : 'Cambiar contraseña'}
          </button>
        </form>
      ) : null}

      <p style={{ marginTop: '1rem' }}>
        <Link to="/login">Volver al login</Link>
      </p>
    </div>
  );
};

export default RecuperarContrasena;
