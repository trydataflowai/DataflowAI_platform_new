import React, { useEffect, useState } from 'react';
import styles from '../../../styles/CreacionUsuario.module.css';
import { obtenerPerfilBroker, actualizarPerfilBroker } from '../../../api/Brokers/EditarPerfilBrokers';

const ProfileBrokers = () => {
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);

  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  const [profileForm, setProfileForm] = useState({
    nombres: '',
    apellidos: '',
    correo: '',
    numero_telefono: '',
    pais_residencia: '',
    entidad_financiera: '',
    numero_cuenta: '',
    tipo_cuenta: '',
    codigo_swift: '',
    tipo_identificacion: '',
    numero_identificacion: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    contrasena_actual: '',
    contrasena_nueva: '',
    contrasena_confirm: '',
  });

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfile = async () => {
    setLoadingProfile(true);
    setProfileError(null);
    try {
      const data = await obtenerPerfilBroker();
      const b = data;
      setProfileForm({
        nombres: (b.usuario && b.usuario.nombres) || '',
        apellidos: (b.usuario && b.usuario.apellidos) || '',
        correo: (b.usuario && b.usuario.correo) || '',
        numero_telefono: b.numero_telefono || '',
        pais_residencia: b.pais_residencia || '',
        entidad_financiera: b.entidad_financiera || '',
        numero_cuenta: b.numero_cuenta || '',
        tipo_cuenta: b.tipo_cuenta || '',
        codigo_swift: b.codigo_swift || '',
        tipo_identificacion: b.tipo_identificacion || '',
        numero_identificacion: b.numero_identificacion || '',
      });
    } catch (err) {
      console.error(err);
      setProfileError(err.message || 'Error cargando perfil');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);

    const payload = {
      nombres: profileForm.nombres,
      apellidos: profileForm.apellidos,
      correo: profileForm.correo,
      numero_telefono: profileForm.numero_telefono,
      pais_residencia: profileForm.pais_residencia,
      entidad_financiera: profileForm.entidad_financiera,
      numero_cuenta: profileForm.numero_cuenta,
      tipo_cuenta: profileForm.tipo_cuenta,
      codigo_swift: profileForm.codigo_swift,
      tipo_identificacion: profileForm.tipo_identificacion,
      numero_identificacion: profileForm.numero_identificacion,
    };

    try {
      const resp = await actualizarPerfilBroker(payload);
      // Si backend devuelve token actualizado, reemplazarlo
      if (resp.token) {
        localStorage.setItem('token', resp.token);
      }
      setProfileSuccess('Perfil actualizado correctamente.');
      // Actualizar el formulario con lo devuelto si viene
      if (resp.broker) {
        const b = resp.broker;
        setProfileForm(prev => ({
          ...prev,
          nombres: (resp.usuario && resp.usuario.nombres) || b.usuario?.nombres || prev.nombres,
          apellidos: (resp.usuario && resp.usuario.apellidos) || b.usuario?.apellidos || prev.apellidos,
          correo: (resp.usuario && resp.usuario.correo) || b.usuario?.correo || prev.correo,
          numero_telefono: b.numero_telefono || prev.numero_telefono,
          pais_residencia: b.pais_residencia || prev.pais_residencia,
          entidad_financiera: b.entidad_financiera || prev.entidad_financiera,
          numero_cuenta: b.numero_cuenta || prev.numero_cuenta,
          tipo_cuenta: b.tipo_cuenta || prev.tipo_cuenta,
          codigo_swift: b.codigo_swift || prev.codigo_swift,
          tipo_identificacion: b.tipo_identificacion || prev.tipo_identificacion,
          numero_identificacion: b.numero_identificacion || prev.numero_identificacion,
        }));
      }
    } catch (err) {
      console.error(err);
      let msg = err.message || 'Error actualizando perfil';
      try {
        const parsed = JSON.parse(msg);
        msg = parsed.detail || JSON.stringify(parsed);
      } catch (_) {}
      setProfileError(msg);
    } finally {
      setSavingProfile(false);
      setTimeout(() => setProfileSuccess(null), 4000);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    // Validaciones cliente
    const { contrasena_actual, contrasena_nueva, contrasena_confirm } = passwordForm;
    if (!contrasena_actual) {
      setPasswordError('Ingresa tu contraseña actual.');
      setSavingPassword(false);
      return;
    }
    if (!contrasena_nueva) {
      setPasswordError('Ingresa la nueva contraseña.');
      setSavingPassword(false);
      return;
    }
    if (contrasena_nueva !== contrasena_confirm) {
      setPasswordError('La nueva contraseña y la confirmación no coinciden.');
      setSavingPassword(false);
      return;
    }
    if (contrasena_nueva.length < 4) {
      setPasswordError('La nueva contraseña debe tener al menos 4 caracteres.');
      setSavingPassword(false);
      return;
    }

    // Payload solo para contraseña
    const payload = {
      contrasena_actual: contrasena_actual,
      contrasena_nueva: contrasena_nueva,
    };

    try {
      const resp = await actualizarPerfilBroker(payload);
      if (resp.token) {
        localStorage.setItem('token', resp.token);
      }
      setPasswordSuccess('Contraseña actualizada correctamente.');
      // limpiar campos contraseña
      setPasswordForm({ contrasena_actual: '', contrasena_nueva: '', contrasena_confirm: '' });
    } catch (err) {
      console.error(err);
      let msg = err.message || 'Error cambiando contraseña';
      try {
        const parsed = JSON.parse(msg);
        msg = parsed.detail || JSON.stringify(parsed);
      } catch (_) {}
      setPasswordError(msg);
    } finally {
      setSavingPassword(false);
      setTimeout(() => setPasswordSuccess(null), 4000);
    }
  };

  if (loadingProfile) {
    return <div className={styles.container}><h2>Cargando perfil...</h2></div>;
  }

  return (
    <div className={styles.container}>
      <h1>Perfil Broker</h1>

      {/* Sección Perfil */}
      <section style={{ marginBottom: 28 }}>
        {profileError && <div style={{ color: 'crimson', marginBottom: 10 }}>{profileError}</div>}
        {profileSuccess && <div style={{ color: 'green', marginBottom: 10 }}>{profileSuccess}</div>}

        <form onSubmit={handleProfileSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Nombres</label>
            <input name="nombres" value={profileForm.nombres} onChange={handleProfileChange} required />
          </div>

          <div className={styles.field}>
            <label>Apellidos</label>
            <input name="apellidos" value={profileForm.apellidos} onChange={handleProfileChange} />
          </div>

          <div className={styles.field}>
            <label>Correo</label>
            <input name="correo" type="email" value={profileForm.correo} onChange={handleProfileChange} required />
          </div>

          <div className={styles.field}>
            <label>Teléfono</label>
            <input name="numero_telefono" value={profileForm.numero_telefono} onChange={handleProfileChange} />
          </div>

          <div className={styles.field}>
            <label>País de residencia</label>
            <input name="pais_residencia" value={profileForm.pais_residencia} onChange={handleProfileChange} />
          </div>

          <div className={styles.field}>
            <label>Entidad financiera</label>
            <input name="entidad_financiera" value={profileForm.entidad_financiera} onChange={handleProfileChange} />
          </div>

          <div className={styles.field}>
            <label>Número cuenta</label>
            <input name="numero_cuenta" value={profileForm.numero_cuenta} onChange={handleProfileChange} />
          </div>

          <div className={styles.field}>
            <label>Tipo cuenta</label>
            <input name="tipo_cuenta" value={profileForm.tipo_cuenta} onChange={handleProfileChange} placeholder="Cuenta de ahorros / Cuenta corriente (AH/CO)" />
          </div>

          <div className={styles.field}>
            <label>Código SWIFT</label>
            <input name="codigo_swift" value={profileForm.codigo_swift} onChange={handleProfileChange} />
          </div>

          <div className={styles.field}>
            <label>Tipo identificación</label>
            <input name="tipo_identificacion" value={profileForm.tipo_identificacion} onChange={handleProfileChange} placeholder="CC / CE / TI / NIT" />
          </div>

          <div className={styles.field}>
            <label>Número identificación</label>
            <input name="numero_identificacion" value={profileForm.numero_identificacion} onChange={handleProfileChange} />
          </div>

          <div style={{ marginTop: 12 }}>
            <button type="submit" disabled={savingProfile}>
              {savingProfile ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </section>

      <hr style={{ margin: '22px 0' }} />

      {/* Sección Contraseña independiente */}
      <section>
        <h3>Cambiar contraseña</h3>
        <p style={{ fontSize: 13, color: '#555' }}>Si no quieres cambiar la contraseña, deja estos campos vacíos.</p>

        {passwordError && <div style={{ color: 'crimson', marginBottom: 10 }}>{passwordError}</div>}
        {passwordSuccess && <div style={{ color: 'green', marginBottom: 10 }}>{passwordSuccess}</div>}

        <form onSubmit={handlePasswordSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Contraseña actual</label>
            <input name="contrasena_actual" type="password" value={passwordForm.contrasena_actual} onChange={handlePasswordChange} />
          </div>

          <div className={styles.field}>
            <label>Nueva contraseña</label>
            <input name="contrasena_nueva" type="password" value={passwordForm.contrasena_nueva} onChange={handlePasswordChange} />
          </div>

          <div className={styles.field}>
            <label>Confirmar nueva contraseña</label>
            <input name="contrasena_confirm" type="password" value={passwordForm.contrasena_confirm} onChange={handlePasswordChange} />
          </div>

          <div style={{ marginTop: 12 }}>
            <button type="submit" disabled={savingPassword}>
              {savingPassword ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default ProfileBrokers;
