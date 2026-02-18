import React, { useEffect, useState } from 'react';
import { useTheme } from '../../componentes/ThemeContext';
import { useCompanyStyles } from '../../componentes/ThemeContextEmpresa';
import { obtenerPerfilBroker, actualizarPerfilBroker } from '../../../api/Brokers/EditarPerfilBrokers';

const ProfileBrokers = () => {
  const { theme } = useTheme();
  const styles = useCompanyStyles('PerfilBoker');
  
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
      if (resp.token) {
        localStorage.setItem('token', resp.token);
      }
      setProfileSuccess('Perfil actualizado correctamente.');
      
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

  // Determinar la clase de tema
  const themeClass = theme === 'dark' ? styles.BrkProfilePerfilgeneralDark : styles.BrkProfilePerfilgeneralLight;

  if (loadingProfile) {
    return (
      <div className={`${styles.BrkProfileContainer} ${themeClass}`}>
        <h1>Cargando perfil...</h1>
      </div>
    );
  }

  return (
    <div className={`${styles.BrkProfileContainer} ${themeClass}`}>
      <h1>Perfil Broker</h1>

      {/* Sección Perfil */}
      <section style={{ marginBottom: 28 }}>
        {profileError && (
          <div className={styles.BrkProfileErrorMessage} role="alert">
            {profileError}
          </div>
        )}
        {profileSuccess && (
          <div className={styles.BrkProfileSuccessMessage} role="status">
            {profileSuccess}
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className={styles.BrkProfileForm}>
          <div className={styles.BrkProfileField}>
            <label htmlFor="nombres">Nombres</label>
            <input
              id="nombres"
              name="nombres"
              value={profileForm.nombres}
              onChange={handleProfileChange}
              required
              placeholder="Ingresa tus nombres"
            />
          </div>

          <div className={styles.BrkProfileField}>
            <label htmlFor="apellidos">Apellidos</label>
            <input
              id="apellidos"
              name="apellidos"
              value={profileForm.apellidos}
              onChange={handleProfileChange}
              placeholder="Ingresa tus apellidos"
            />
          </div>

          <div className={styles.BrkProfileField}>
            <label htmlFor="correo">Correo</label>
            <input
              id="correo"
              name="correo"
              type="email"
              value={profileForm.correo}
              onChange={handleProfileChange}
              required
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className={styles.BrkProfileField}>
            <label htmlFor="numero_telefono">Teléfono</label>
            <input
              id="numero_telefono"
              name="numero_telefono"
              value={profileForm.numero_telefono}
              onChange={handleProfileChange}
              placeholder="+57 300 123 4567"
            />
          </div>

          <div className={styles.BrkProfileField}>
            <label htmlFor="pais_residencia">País de residencia</label>
            <input
              id="pais_residencia"
              name="pais_residencia"
              value={profileForm.pais_residencia}
              onChange={handleProfileChange}
              placeholder="Colombia"
            />
          </div>

          <div className={styles.BrkProfileField}>
            <label htmlFor="entidad_financiera">Entidad financiera</label>
            <input
              id="entidad_financiera"
              name="entidad_financiera"
              value={profileForm.entidad_financiera}
              onChange={handleProfileChange}
              placeholder="Banco de Bogotá"
            />
          </div>

          <div className={styles.BrkProfileField}>
            <label htmlFor="numero_cuenta">Número cuenta</label>
            <input
              id="numero_cuenta"
              name="numero_cuenta"
              value={profileForm.numero_cuenta}
              onChange={handleProfileChange}
              placeholder="1234567890"
            />
          </div>

          <div className={styles.BrkProfileField}>
            <label htmlFor="tipo_cuenta">Tipo cuenta</label>
            <input
              id="tipo_cuenta"
              name="tipo_cuenta"
              value={profileForm.tipo_cuenta}
              onChange={handleProfileChange}
              placeholder="AH / CO"
            />
          </div>

          <div className={styles.BrkProfileField}>
            <label htmlFor="codigo_swift">Código SWIFT</label>
            <input
              id="codigo_swift"
              name="codigo_swift"
              value={profileForm.codigo_swift}
              onChange={handleProfileChange}
              placeholder="BBOGCOBB"
            />
          </div>

          <div className={styles.BrkProfileField}>
            <label htmlFor="tipo_identificacion">Tipo identificación</label>
            <input
              id="tipo_identificacion"
              name="tipo_identificacion"
              value={profileForm.tipo_identificacion}
              onChange={handleProfileChange}
              placeholder="CC / CE / TI / NIT"
            />
          </div>

          <div className={styles.BrkProfileField}>
            <label htmlFor="numero_identificacion">Número identificación</label>
            <input
              id="numero_identificacion"
              name="numero_identificacion"
              value={profileForm.numero_identificacion}
              onChange={handleProfileChange}
              placeholder="123456789"
            />
          </div>

          <div style={{ marginTop: 12, gridColumn: '1 / -1' }}>
            <button type="submit" disabled={savingProfile}>
              {savingProfile ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </section>

      <hr className={styles.BrkProfileHr} />

      {/* Sección Contraseña */}
      <section className={styles.BrkProfilePasswordSection}>
        <h3>Cambiar contraseña</h3>
        <p className={styles.BrkProfileHelpText}>
          Si no quieres cambiar la contraseña, deja estos campos vacíos.
        </p>

        {passwordError && (
          <div className={styles.BrkProfileErrorMessage} role="alert">
            {passwordError}
          </div>
        )}
        {passwordSuccess && (
          <div className={styles.BrkProfileSuccessMessage} role="status">
            {passwordSuccess}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className={styles.BrkProfileForm}>
          <div className={styles.BrkProfileField}>
            <label htmlFor="contrasena_actual">Contraseña actual</label>
            <input
              id="contrasena_actual"
              name="contrasena_actual"
              type="password"
              value={passwordForm.contrasena_actual}
              onChange={handlePasswordChange}
              placeholder="••••••••"
            />
          </div>

          <div className={styles.BrkProfileField}>
            <label htmlFor="contrasena_nueva">Nueva contraseña</label>
            <input
              id="contrasena_nueva"
              name="contrasena_nueva"
              type="password"
              value={passwordForm.contrasena_nueva}
              onChange={handlePasswordChange}
              placeholder="••••••••"
            />
          </div>

          <div className={styles.BrkProfileField}>
            <label htmlFor="contrasena_confirm">Confirmar nueva contraseña</label>
            <input
              id="contrasena_confirm"
              name="contrasena_confirm"
              type="password"
              value={passwordForm.contrasena_confirm}
              onChange={handlePasswordChange}
              placeholder="••••••••"
            />
          </div>

          <div style={{ marginTop: 12, gridColumn: '1 / -1' }}>
            <button type="submit" disabled={savingPassword}>
              {savingPassword ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default ProfileBrokers;