import React, { useEffect, useState } from 'react';
import {
  fetchCategorias,
  fetchEstados,
  fetchPlanes,
  fetchPermisos,
  crearEmpresa,
  crearUsuario
} from '../../api/CrearUsuario';
import styles from '../../styles/CreacionEmpresa.module.css';

const CreacionEmpresa = () => {
  // Catálogos para empresa
  const [categorias, setCategorias] = useState([]);
  const [estados, setEstados]       = useState([]);
  const [planes, setPlanes]         = useState([]);
  // Catálogo permisos para usuario
  const [permisos, setPermisos]     = useState([]);

  // Formulario empresa
  const [formE, setFormE] = useState({
    id_empresa: '',
    id_categoria: '',
    id_plan: '',
    id_estado: '',
    nombre_empresa: '',
    direccion: '',
    fecha_registros: '',
    telefono: '',
    ciudad: '',
    pais: '',
    prefijo_pais: '',
    correo: '',
    pagina_web: '',
    fecha_hora_pago: '',
  });

  // Formulario usuario
  const [formU, setFormU] = useState({
    id_usuario: '',
    id_permiso_acceso: '',
    nombres: '',
    apellidos: '',
    correo: '',
    contrasena: '',
    estado: true,
  });

  const [error, setError]     = useState(null);
  const [successE, setSuccessE] = useState(false);
  const [successU, setSuccessU] = useState(false);

  useEffect(() => {
    fetchCategorias().then(setCategorias);
    fetchEstados().then(setEstados);
    fetchPlanes().then(setPlanes);
    fetchPermisos().then(setPermisos);
  }, []);

  const handleChangeE = e => {
    let { name, value } = e.target;
    // IDs como números
    if (['id_empresa', 'id_categoria', 'id_plan', 'id_estado'].includes(name)) {
      value = value === '' ? '' : Number(value);
    }
    // Añadir segundos al datetime-local
    if (name === 'fecha_hora_pago' && value && !value.endsWith(':00')) {
      value = `${value}:00`;
    }
    setFormE(prev => ({ ...prev, [name]: value }));
  };

  const handleChangeU = e => {
    let { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      return setFormU(prev => ({ ...prev, [name]: checked }));
    }
    // IDs como números
    if (['id_usuario', 'id_permiso_acceso'].includes(name)) {
      value = value === '' ? '' : Number(value);
    }
    setFormU(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setSuccessE(false);
    setSuccessU(false);

    try {
      // 1) Crear la empresa
      const empresa = await crearEmpresa(formE);
      setSuccessE(true);

      // 2) Inyectar FK id_empresa al formulario usuario
      const payloadU = {
        ...formU,
        id_empresa: empresa.id_empresa
      };

      // 3) Crear el usuario
      await crearUsuario(payloadU);
      setSuccessU(true);
    } catch (err) {
      setError(err);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Crear Empresa y Usuario</h1>
      <form onSubmit={handleSubmit} className={styles.form}>

        {/* ===== SECCIÓN EMPRESA ===== */}
        <h2>Datos de la Empresa</h2>

        <label>ID Empresa
          <input
            type="number"
            name="id_empresa"
            value={formE.id_empresa}
            onChange={handleChangeE}
            required
          />
        </label>

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

        <label>Estado
          <select
            name="id_estado"
            value={formE.id_estado}
            onChange={handleChangeE}
            required
          >
            <option value="">-- Selecciona --</option>
            {estados.map(e => (
              <option key={e.id_estado} value={e.id_estado}>
                {e.estado}
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

        <label>Fecha Registro
          <input
            type="date"
            name="fecha_registros"
            value={formE.fecha_registros}
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

        <label>Fecha y Hora de Pago
          <input
            type="datetime-local"
            name="fecha_hora_pago"
            value={formE.fecha_hora_pago}
            onChange={handleChangeE}
          />
        </label>


        {/* ===== SECCIÓN USUARIO ===== */}
        <h2>Datos del Usuario</h2>

        <label>ID Usuario
          <input
            type="number"
            name="id_usuario"
            value={formU.id_usuario}
            onChange={handleChangeU}
            required
          />
        </label>

        <label>Permiso de Acceso
          <select
            name="id_permiso_acceso"
            value={formU.id_permiso_acceso}
            onChange={handleChangeU}
            required
          >
            <option value="">-- Selecciona --</option>
            {permisos.map(p => (
              <option key={p.id_permiso_acceso} value={p.id_permiso_acceso}>
                {p.descripcion || p.codigo || JSON.stringify(p)}
              </option>
            ))}
          </select>
        </label>

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

        <label>
          <input
            type="checkbox"
            name="estado"
            checked={formU.estado}
            onChange={handleChangeU}
          />
          Usuario activo
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
