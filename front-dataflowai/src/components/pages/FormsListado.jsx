import React, { useEffect, useState } from 'react';
import styles from '../../styles/CreacionUsuario.module.css';
import { obtenerFormulariosEmpresa } from '../../api/ListadoFormulario';
import { Link, useNavigate } from 'react-router-dom';

const FormsListado = () => {
  const [formularios, setFormularios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarFormularios = async () => {
      try {
        const data = await obtenerFormulariosEmpresa();
        setFormularios(data);
      } catch (err) {
        setError(err.message || 'Error al cargar formularios');
      } finally {
        setLoading(false);
      }
    };

    cargarFormularios();
  }, []);

  const handleEditar = (slug) => {
    // navegamos a la ruta de edición; ajusta si tienes prefijo en routes
    navigate(`/forms/edit/${slug}`);
  };

  return (
    <div className={styles.container}>
      <h1>Formularios de la Empresa</h1>

      {loading && <p>Cargando formularios...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && formularios.length === 0 && (
        <p>No hay formularios registrados.</p>
      )}

      <ul className={styles.list}>
        {formularios.map((form) => (
          <li key={form.id_formulario} className={styles.listItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Link to={`/forms/${form.slug}`} className={styles.link}>
                <h3 style={{ margin: 0 }}>{form.nombre}</h3>
                {form.descripcion && <p style={{ margin: '4px 0' }}>{form.descripcion}</p>}
                <small>Creado: {form.fecha_creacion}</small>
              </Link>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => handleEditar(form.slug)}
                className={styles.btnPrimary || ''}
                title="Editar formulario"
              >
                Editar
              </button>
              {/* botón eliminar, ver, etc. lo puedes agregar aquí */}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FormsListado;
