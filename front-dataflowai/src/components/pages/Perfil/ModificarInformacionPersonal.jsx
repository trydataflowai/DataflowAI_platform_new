import React, { useEffect, useState } from 'react';
import styles from '../../../styles/Profile/ModInfoPersonalDark.module.css';
import {
  obtenerMiPerfil,
  actualizarMiUsuario,
  obtenerEmpresa,
  actualizarEmpresa
} from '../../../api/Profile';

const ModificarInformacionPersonal = () => {
  const [loading, setLoading] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Usuario
  const [usuario, setUsuario] = useState(null);
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [correo, setCorreo] = useState('');
  const [permisoId, setPermisoId] = useState(null);

  // Empresa
  const [empresa, setEmpresa] = useState(null);
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [pais, setPais] = useState('');
  const [prefijoPais, setPrefijoPais] = useState('');
  const [correoEmpresa, setCorreoEmpresa] = useState('');
  const [paginaWeb, setPaginaWeb] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await obtenerMiPerfil();
        const u = res.usuario || {};
        const e = res.empresa || {};
        setUsuario(u);
        setNombres(u.nombres || '');
        setApellidos(u.apellidos || '');
        setCorreo(u.correo || '');
        setPermisoId(u.id_permiso_acceso || null);

        setEmpresa(e);
        setNombreEmpresa(e.nombre_empresa || '');
        setDireccion(e.direccion || '');
        setTelefono(e.telefono || '');
        setCiudad(e.ciudad || '');
        setPais(e.pais || '');
        setPrefijoPais(e.prefijo_pais || '');
        setCorreoEmpresa(e.correo || '');
        setPaginaWeb(e.pagina_web || '');
      } catch (err) {
        setError(err.message || 'Error al cargar perfil');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const isAdmin = permisoId === 1;

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!nombres || !correo) {
      setError('Nombre y correo son obligatorios');
      return;
    }
    setSavingUser(true);
    try {
      const payload = { nombres, apellidos, correo };
      const res = await actualizarMiUsuario(payload);
      setUsuario(res.usuario);
      setSuccess('Usuario actualizado correctamente');
    } catch (err) {
      setError(err.message || 'Error al actualizar usuario');
    } finally {
      setSavingUser(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!isAdmin) {
      setError('No autorizado para editar la empresa');
      return;
    }
    setSavingCompany(true);
    try {
      const payload = {
        nombre_empresa: nombreEmpresa,
        direccion,
        telefono,
        ciudad,
        pais,
        prefijo_pais: prefijoPais,
        correo: correoEmpresa,
        pagina_web: paginaWeb
      };
      const res = await actualizarEmpresa(payload);
      setEmpresa(res.empresa);
      setSuccess('Empresa actualizada correctamente');
    } catch (err) {
      setError(err.message || 'Error al actualizar empresa');
    } finally {
      setSavingCompany(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h2>Cargando perfil...</h2>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Modificar Información Personal</h1>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Mi usuario</h2>
        <form onSubmit={handleSaveUser} className={styles.form}>
          <div className={styles.formRow}>
            <label>Nombre</label>
            <input
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
            />
          </div>
          <div className={styles.formRow}>
            <label>Apellidos</label>
            <input
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
            />
          </div>
          <div className={styles.formRow}>
            <label>Correo</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </div>

          <div className={styles.formRow}>
            <button type="submit" disabled={savingUser}>
              {savingUser ? 'Guardando...' : 'Guardar usuario'}
            </button>
          </div>
        </form>
      </section>

      <hr className={styles.divider} />

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>
          Empresa {empresa ? `- ${empresa.nombre_empresa}` : ''}
        </h2>
        {!isAdmin && (
          <div className={styles.info}>
            Sólo administradores pueden editar la empresa.
          </div>
        )}
        <form onSubmit={handleSaveCompany} className={styles.form}>
          <div className={styles.formRow}>
            <label>Nombre empresa</label>
            <input
              value={nombreEmpresa}
              onChange={(e) => setNombreEmpresa(e.target.value)}
              disabled={!isAdmin}
            />
          </div>
          <div className={styles.formRow}>
            <label>Dirección</label>
            <input
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              disabled={!isAdmin}
            />
          </div>
          <div className={styles.formRow}>
            <label>Teléfono</label>
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              disabled={!isAdmin}
            />
          </div>
          <div className={styles.formRow}>
            <label>Ciudad</label>
            <input
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              disabled={!isAdmin}
            />
          </div>
          <div className={styles.formRow}>
            <label>País</label>
            <input
              value={pais}
              onChange={(e) => setPais(e.target.value)}
              disabled={!isAdmin}
            />
          </div>

          <div className={styles.formRow}>
            <label>Correo empresa</label>
            <input
              type="email"
              value={correoEmpresa}
              onChange={(e) => setCorreoEmpresa(e.target.value)}
              disabled={!isAdmin}
            />
          </div>
          <div className={styles.formRow}>
            <label>Página web</label>
            <input
              value={paginaWeb}
              onChange={(e) => setPaginaWeb(e.target.value)}
              disabled={!isAdmin}
            />
          </div>

          <div className={styles.formRow}>
            <button type="submit" disabled={!isAdmin || savingCompany}>
              {savingCompany ? 'Guardando...' : 'Guardar empresa'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default ModificarInformacionPersonal;
