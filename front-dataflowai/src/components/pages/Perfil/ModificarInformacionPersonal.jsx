import React, { useEffect, useState } from 'react';
import styles from '../../../styles/Profile/ModInfoPersonalDark.module.css';
import {
  obtenerMiPerfil,
  actualizarMiUsuario,
  actualizarEmpresa
} from '../../../api/Profile';

const ModificarInformacionPersonal = () => {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false); // modo edición global
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

  // Backups para cancelar edición
  const [backupUser, setBackupUser] = useState(null);
  const [backupCompany, setBackupCompany] = useState(null);

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

  const enterEdit = () => {
    // guarda backups de los valores actuales para poder restaurar si cancela
    setBackupUser({ nombres, apellidos, correo });
    setBackupCompany({
      nombreEmpresa,
      direccion,
      telefono,
      ciudad,
      pais,
      prefijoPais,
      correoEmpresa,
      paginaWeb
    });
    setError('');
    setSuccess('');
    setEditing(true);
  };

  const cancelEdit = () => {
    // restaura desde backups
    if (backupUser) {
      setNombres(backupUser.nombres);
      setApellidos(backupUser.apellidos);
      setCorreo(backupUser.correo);
    }
    if (backupCompany) {
      setNombreEmpresa(backupCompany.nombreEmpresa);
      setDireccion(backupCompany.direccion);
      setTelefono(backupCompany.telefono);
      setCiudad(backupCompany.ciudad);
      setPais(backupCompany.pais);
      setPrefijoPais(backupCompany.prefijoPais);
      setCorreoEmpresa(backupCompany.correoEmpresa);
      setPaginaWeb(backupCompany.paginaWeb);
    }
    setError('');
    setSuccess('');
    setEditing(false);
  };

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
      // actualizar backups para futura edición
      setBackupUser({ nombres, apellidos, correo });
      setEditing(false);
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
      // actualizar backups
      setBackupCompany({
        nombreEmpresa,
        direccion,
        telefono,
        ciudad,
        pais,
        prefijoPais,
        correoEmpresa,
        paginaWeb
      });
      setEditing(false);
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
        <div className={styles.centerBox}>
          <div className={styles.loader} />
          <div className={styles.loadingText}>Cargando perfil...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Modificar Información Personal</h1>
          <p className={styles.subtitle}>Actualiza tu información o la de tu empresa</p>
        </div>

        <div className={styles.headerActions}>
          {!editing ? (
            <button className={styles.editToggle} onClick={enterEdit}>
              ✏️ Editar información
            </button>
          ) : (
            <>
              <span className={styles.editBadge}>Modo edición</span>
              <button className={styles.cancelBtn} onClick={cancelEdit}>
                ✖️ Cancelar edición
              </button>
            </>
          )}
        </div>
      </header>

      {error && <div className={styles.alert + ' ' + styles.alertError}>{error}</div>}
      {success && <div className={styles.alert + ' ' + styles.alertSuccess}>{success}</div>}

      <div className={styles.grid}>

        {/* Usuario */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.sectionTitle}>Mi usuario</h2>
          </div>

          <form onSubmit={handleSaveUser} className={styles.form}>
            <div className={styles.row}>
              <label className={styles.label}>
                <span className={styles.labelText}>Nombre</span>
                <input
                  className={styles.input}
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  placeholder="Tu nombre"
                  readOnly={!editing}
                />
              </label>

              <label className={styles.label}>
                <span className={styles.labelText}>Apellidos</span>
                <input
                  className={styles.input}
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  placeholder="Tus apellidos"
                  readOnly={!editing}
                />
              </label>
            </div>

            <div className={styles.rowSingle}>
              <label className={styles.label}>
                <span className={styles.labelText}>Correo</span>
                <input
                  className={styles.input}
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="email@empresa.com"
                  readOnly={!editing}
                />
              </label>
            </div>

            <div className={styles.actions}>
              <button
                className={styles.primaryButton}
                type="submit"
                disabled={!editing || savingUser}
                aria-disabled={!editing || savingUser}
              >
                {savingUser ? 'Guardando...' : 'Guardar usuario'}
              </button>
            </div>
          </form>
        </section>

        {/* Empresa */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.sectionTitle}>Empresa {empresa ? `- ${empresa.nombre_empresa}` : ''}</h2>
          </div>

          {!isAdmin && (
            <div className={styles.infoBox}>
              Sólo administradores pueden editar la empresa.
            </div>
          )}

          <form onSubmit={handleSaveCompany} className={styles.form}>
            <div className={styles.row}>
              <label className={styles.label}>
                <span className={styles.labelText}>Nombre empresa</span>
                <input
                  className={styles.input}
                  value={nombreEmpresa}
                  onChange={(e) => setNombreEmpresa(e.target.value)}
                  disabled={!isAdmin || !editing}
                  readOnly={!editing}
                  placeholder="Nombre de la empresa"
                />
              </label>

              <label className={styles.label}>
                <span className={styles.labelText}>Dirección</span>
                <input
                  className={styles.input}
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  disabled={!isAdmin || !editing}
                  readOnly={!editing}
                  placeholder="Dirección"
                />
              </label>
            </div>

            <div className={styles.row}>
              <label className={styles.labelSmall}>
                <span className={styles.labelText}>Prefijo</span>
                <input
                  className={styles.input}
                  value={prefijoPais}
                  onChange={(e) => setPrefijoPais(e.target.value)}
                  disabled={!isAdmin || !editing}
                  readOnly={!editing}
                  placeholder="+57"
                />
              </label>

              <label className={styles.label}>
                <span className={styles.labelText}>Teléfono</span>
                <input
                  className={styles.input}
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  disabled={!isAdmin || !editing}
                  readOnly={!editing}
                  placeholder="3001234567"
                />
              </label>
            </div>

            <div className={styles.row}>
              <label className={styles.label}>
                <span className={styles.labelText}>Ciudad</span>
                <input
                  className={styles.input}
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  disabled={!isAdmin || !editing}
                  readOnly={!editing}
                  placeholder="Bogotá"
                />
              </label>

              <label className={styles.label}>
                <span className={styles.labelText}>País</span>
                <input
                  className={styles.input}
                  value={pais}
                  onChange={(e) => setPais(e.target.value)}
                  disabled={!isAdmin || !editing}
                  readOnly={!editing}
                  placeholder="Colombia"
                />
              </label>
            </div>

            <div className={styles.row}>
              <label className={styles.label}>
                <span className={styles.labelText}>Correo empresa</span>
                <input
                  className={styles.input}
                  type="email"
                  value={correoEmpresa}
                  onChange={(e) => setCorreoEmpresa(e.target.value)}
                  disabled={!isAdmin || !editing}
                  readOnly={!editing}
                  placeholder="contacto@empresa.com"
                />
              </label>

              <label className={styles.label}>
                <span className={styles.labelText}>Página web</span>
                <input
                  className={styles.input}
                  value={paginaWeb}
                  onChange={(e) => setPaginaWeb(e.target.value)}
                  disabled={!isAdmin || !editing}
                  readOnly={!editing}
                  placeholder="https://www.empresa.com"
                />
              </label>
            </div>

            <div className={styles.actions}>
              <button
                className={styles.primaryButton}
                type="submit"
                disabled={!editing || !isAdmin || savingCompany}
                aria-disabled={!editing || !isAdmin || savingCompany}
              >
                {savingCompany ? 'Guardando...' : 'Guardar empresa'}
              </button>
            </div>
          </form>
        </section>

      </div>
    </div>
  );
};

export default ModificarInformacionPersonal;
