import React, { useEffect, useState } from 'react';
import {
  fetchCategorias,
  fetchPlanes,
  crearEmpresa,
  crearUsuario
} from '../../api/CrearUsuario';
import styles from '../../styles/CreacionEmpresa.module.css';

const CreacionEmpresa = () => {
  const [categorias, setCategorias] = useState([]);
  const [planes, setPlanes]         = useState([]);
  const [error, setError]           = useState(null);
  const [successE, setSuccessE]     = useState(false);
  const [successU, setSuccessU]     = useState(false);

  // Inicializamos sólo los campos que el usuario verá
  const [formE, setFormE] = useState({
    id_categoria: '',
    id_plan: '',
    nombre_empresa: '',
    direccion: '',
    telefono: '',
    ciudad: '',
    pais: '',
    prefijo_pais: '',
    correo: '',
    pagina_web: '',
  });

  const [formU, setFormU] = useState({
    nombres: '',
    apellidos: '',
    correo: '',
    contrasena: '',
  });

  useEffect(() => {
    fetchCategorias().then(setCategorias);
    fetchPlanes().then(setPlanes);
  }, []);

  const handleChangeE = e => {
    const { name, value } = e.target;
    setFormE(prev => ({ ...prev, [name]: value }));
  };

  const handleChangeU = e => {
    const { name, value } = e.target;
    setFormU(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setSuccessE(false);
    setSuccessU(false);

    try {
      // 1) Crear empresa
      const empresa = await crearEmpresa(formE);
      setSuccessE(true);

      // 2) Crear usuario con FK id_empresa y backend infiere el resto
      await crearUsuario({
        ...formU,
        id_empresa: empresa.id_empresa
      });
      setSuccessU(true);
    } catch (err) {
      setError(err);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Crear Empresa y Usuario</h1>
      <form onSubmit={handleSubmit} className={styles.form}>

        <h2>Datos de la Empresa</h2>
        <label>Categoría
          <select
            name="id_categoria"
            value={formE.id_categoria}
            onChange={handleChangeE}
            required
          >
            <option value="">-- Selecciona --</option>
            {categorias.map(c => (
              <option key={c.id_categoria} value={c.id_categoria}>
                {c.descripcion_categoria}
              </option>
            ))}
          </select>
        </label>

        <label>Plan
          <select
            name="id_plan"
            value={formE.id_plan}
            onChange={handleChangeE}
            required
          >
            <option value="">-- Selecciona --</option>
            {planes.map(p => (
              <option key={p.id_plan} value={p.id_plan}>
                {p.tipo_plan}
              </option>
            ))}
          </select>
        </label>

        <label>Nombre Empresa
          <input
            name="nombre_empresa"
            value={formE.nombre_empresa}
            onChange={handleChangeE}
            required
          />
        </label>

        <label>Dirección
          <input
            name="direccion"
            value={formE.direccion}
            onChange={handleChangeE}
            required
          />
        </label>

        <label>Teléfono
          <input
            name="telefono"
            value={formE.telefono}
            onChange={handleChangeE}
            required
          />
        </label>

        <label>Ciudad
          <input
            name="ciudad"
            value={formE.ciudad}
            onChange={handleChangeE}
            required
          />
        </label>

        <label>País
          <input
            name="pais"
            value={formE.pais}
            onChange={handleChangeE}
            required
          />
        </label>

        <label>Prefijo País
          <input
            name="prefijo_pais"
            value={formE.prefijo_pais}
            onChange={handleChangeE}
          />
        </label>

        <label>Correo Empresa
          <input
            type="email"
            name="correo"
            value={formE.correo}
            onChange={handleChangeE}
          />
        </label>

        <label>Página Web
          <input
            type="url"
            name="pagina_web"
            value={formE.pagina_web}
            onChange={handleChangeE}
          />
        </label>

        <h2>Datos del Usuario</h2>
        <label>Nombres
          <input
            name="nombres"
            value={formU.nombres}
            onChange={handleChangeU}
            required
          />
        </label>

        <label>Apellidos
          <input
            name="apellidos"
            value={formU.apellidos}
            onChange={handleChangeU}
          />
        </label>

        <label>Correo Usuario
          <input
            type="email"
            name="correo"
            value={formU.correo}
            onChange={handleChangeU}
            required
          />
        </label>

        <label>Contraseña
          <input
            type="password"
            name="contrasena"
            value={formU.contrasena}
            onChange={handleChangeU}
            required
          />
        </label>

        <button type="submit">Guardar Todo</button>
      </form>

      {error && (
        <pre className={styles.error}>
          {JSON.stringify(error, null, 2)}
        </pre>
      )}
      {successE && <p className={styles.success}>Empresa creada ✅</p>}
      {successU && <p className={styles.success}>Usuario creado ✅</p>}
    </div>
  );
};

export default CreacionEmpresa;
