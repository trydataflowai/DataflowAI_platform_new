// src/components/.../AppCambiarContrasena.jsx
import React, { useState, useEffect } from 'react';
import { cambiarContrasena } from '../../../api/Profile';
import { useTheme } from '../../componentes/ThemeContext';
import { obtenerInfoUsuario } from '../../../api/Usuario';

// Función para cargar los estilos dinámicamente
const cargarEstilosEmpresa = async (empresaId, planId) => {
  const planesEspeciales = [3, 6]; // Planes que usan estilos personalizados
  
  try {
    // Verificar si el plan es especial y si existe la carpeta de la empresa
    if (planesEspeciales.includes(planId)) {
      try {
        // Intentar importar los estilos de la carpeta de la empresa
        const estilosEmpresa = await import(`../../../styles/empresas/${empresaId}/CambiarContrasena.module.css`);
        return estilosEmpresa.default;
      } catch (error) {
        console.warn(`No se encontraron estilos personalizados para empresa ${empresaId}, usando estilos por defecto`);
      }
    }
    
    // Cargar estilos por defecto
    const estilosPorDefecto = await import('../../../styles/Profile/CambiarContrasena.module.css');
    return estilosPorDefecto.default;
  } catch (error) {
    console.error('Error cargando estilos:', error);
    // Fallback a estilos por defecto
    const estilosPorDefecto = await import('../../../styles/Profile/CambiarContrasena.module.css');
    return estilosPorDefecto.default;
  }
};

const AppCambiarContrasena = () => {
  const { theme } = useTheme();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [styles, setStyles] = useState({});
  const [cargandoEstilos, setCargandoEstilos] = useState(true);

  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  // Cargar información del usuario y estilos
  useEffect(() => {
    const cargarUsuarioYEstilos = async () => {
      setCargandoEstilos(true);
      try {
        const usuarioInfo = await obtenerInfoUsuario();
        const empresaId = usuarioInfo.empresa?.id;
        const planId = usuarioInfo.empresa?.plan?.id;
        
        if (empresaId && planId) {
          const estilosCargados = await cargarEstilosEmpresa(empresaId, planId);
          setStyles(estilosCargados);
        } else {
          // Fallback a estilos por defecto si no hay info de empresa/plan
          const estilosPorDefecto = await import('../../../styles/Profile/CambiarContrasena.module.css');
          setStyles(estilosPorDefecto.default);
        }
      } catch (error) {
        console.error('Error cargando información del usuario:', error);
        // Fallback a estilos por defecto
        const estilosPorDefecto = await import('../../../styles/Profile/CambiarContrasena.module.css');
        setStyles(estilosPorDefecto.default);
      } finally {
        setCargandoEstilos(false);
      }
    };

    cargarUsuarioYEstilos();
  }, []);

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

  // Si aún se están cargando los estilos, mostrar loading
  if (cargandoEstilos) {
    return (
      <div className="cargando-estilos">
        <div>Cargando estilos...</div>
      </div>
    );
  }

  // variante (aplica clase raíz con variables)
  const variantClass = theme === 'light' ? styles.CambiarcontrasenaLight : styles.CambiarcontrasenaDark;

  return (
    <main className={`${styles.Cambiarcontrasenacontainer} ${variantClass}`} aria-labelledby="cambiar-contrasena-title">
      
      {/* Header Section */}
      <section className={styles.Cambiarcontrasenaheader}>
        <div className={styles.CambiarcontrasenaheaderContent}>
          <h1 id="cambiar-contrasena-title" className={styles.Cambiarcontrasenatitle}>
            Cambiar Contraseña
          </h1>
          <p className={styles.Cambiarcontrasenasubtitle}>
            Actualiza tu contraseña para mantener tu cuenta segura
          </p>
        </div>
        <div className={styles.CambiarcontrasenaheaderMeta}>
          <span className={styles.CambiarcontrasenasecurityInfo}>Seguridad</span>
        </div>
      </section>

      {/* Form Section */}
      <section className={styles.CambiarcontrasenaformSection} aria-label="Formulario de cambio de contraseña">
        <div className={styles.Cambiarcontrasenacard}>
          
          {error && (
            <div className={styles.CambiarcontrasenaerrorBox} role="alert">
              <div className={styles.CambiarcontrasenaerrorIcon}>⚠️</div>
              <div className={styles.CambiarcontrasenaerrorText}>{error}</div>
            </div>
          )}
          
          {success && (
            <div className={styles.CambiarcontrasenasuccessBox} role="status">
              <div className={styles.CambiarcontrasenasuccessIcon}>✅</div>
              <div className={styles.CambiarcontrasenasuccessText}>{success}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.Cambiarcontrasenaform}>
            
            {/* Contraseña Actual */}
            <div className={styles.CambiarcontrasenaformGroup}>
              <label className={styles.Cambiarcontrasenalabel}>
                <span className={styles.CambiarcontrasenalabelText}>Contraseña Actual</span>
                <div className={styles.CambiarcontrasenainputContainer}>
                  <input
                    name="actual"
                    value={actual}
                    onChange={(e) => setActual(e.target.value)}
                    type={showActual ? 'text' : 'password'}
                    className={styles.Cambiarcontrasenainput}
                    autoComplete="current-password"
                    aria-label="Contraseña actual"
                    placeholder="Ingresa tu contraseña actual"
                  />
                  <button
                    type="button"
                    className={styles.CambiarcontrasenashowBtn}
                    onClick={() => setShowActual(p => !p)}
                    aria-label={showActual ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showActual ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </label>
            </div>

            {/* Nueva Contraseña */}
            <div className={styles.CambiarcontrasenaformGroup}>
              <label className={styles.Cambiarcontrasenalabel}>
                <span className={styles.CambiarcontrasenalabelText}>Nueva Contraseña</span>
                <div className={styles.CambiarcontrasenainputContainer}>
                  <input
                    name="nueva"
                    value={nueva}
                    onChange={(e) => setNueva(e.target.value)}
                    type={showNueva ? 'text' : 'password'}
                    className={styles.Cambiarcontrasenainput}
                    autoComplete="new-password"
                    aria-label="Nueva contraseña"
                    placeholder="Crea una nueva contraseña"
                  />
                  <button
                    type="button"
                    className={styles.CambiarcontrasenashowBtn}
                    onClick={() => setShowNueva(p => !p)}
                    aria-label={showNueva ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showNueva ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                
                {/* Strength Indicator */}
                {nueva && (
                  <div className={styles.CambiarcontrasenastrengthIndicator}>
                    <div className={styles.CambiarcontrasenastrengthBar}>
                      <div 
                        className={`${styles.CambiarcontrasenastrengthSegment} ${strength >= 1 ? styles.Cambiarcontrasenaon : ''}`}
                      ></div>
                      <div 
                        className={`${styles.CambiarcontrasenastrengthSegment} ${strength >= 2 ? styles.Cambiarcontrasenaon : ''}`}
                      ></div>
                      <div 
                        className={`${styles.CambiarcontrasenastrengthSegment} ${strength >= 3 ? styles.Cambiarcontrasenaon : ''}`}
                      ></div>
                      <div 
                        className={`${styles.CambiarcontrasenastrengthSegment} ${strength >= 4 ? styles.Cambiarcontrasenaon : ''}`}
                      ></div>
                    </div>
                    <span className={styles.CambiarcontrasenastrengthText}>
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
            <div className={styles.CambiarcontrasenaformGroup}>
              <label className={styles.Cambiarcontrasenalabel}>
                <span className={styles.CambiarcontrasenalabelText}>Confirmar Nueva Contraseña</span>
                <div className={styles.CambiarcontrasenainputContainer}>
                  <input
                    name="confirmar"
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    type={showConfirmar ? 'text' : 'password'}
                    className={styles.Cambiarcontrasenainput}
                    autoComplete="new-password"
                    aria-label="Confirmar nueva contraseña"
                    placeholder="Confirma tu nueva contraseña"
                  />
                  <button
                    type="button"
                    className={styles.CambiarcontrasenashowBtn}
                    onClick={() => setShowConfirmar(p => !p)}
                    aria-label={showConfirmar ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showConfirmar ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </label>
            </div>

            {/* Submit Button */}
            <div className={styles.Cambiarcontrasenaactions}>
              <button 
                type="submit" 
                className={styles.CambiarcontrasenaprimaryButton} 
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className={styles.Cambiarcontrasenaspinner}></span>
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